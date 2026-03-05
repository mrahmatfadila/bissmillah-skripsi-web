import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getSystemSettings } from '@/lib/settings';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

// Configure Cloudinary if env vars are present
const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'it-ticketing',
                public_id: filename.replace(/\.[^/.]+$/, ''), // remove extension
                resource_type: 'auto',
                overwrite: true,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result!.secure_url);
            }
        );
        uploadStream.end(buffer);
    });
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const settings = getSystemSettings();
        const extension = file.name.split('.').pop()?.toLowerCase() || '';

        // Validate file type
        const allowedTypesStr = settings?.ticket?.allowedFileTypes || "jpg,jpeg,png,pdf,doc";
        const allowedExtensions = allowedTypesStr.split(',').map((t: string) => t.trim().toLowerCase());

        if (!allowedExtensions.includes(extension) && allowedTypesStr !== '*') {
            return NextResponse.json({ error: `Invalid file type. Only ${allowedTypesStr} are allowed.` }, { status: 400 });
        }

        // Validate file size
        const maxAttachmentSizeMB = settings?.ticket?.maxAttachmentSize || 5;
        const maxSize = maxAttachmentSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: `File too large. Maximum size is ${maxAttachmentSizeMB}MB.` }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const filename = `${timestamp}-${randomString}.${extension}`;

        let fileUrl: string;

        if (isCloudinaryConfigured) {
            // Upload to Cloudinary (persistent cloud storage)
            fileUrl = await uploadToCloudinary(buffer, filename);
        } else {
            // Fallback: Save locally
            const uploadsDir = join(process.cwd(), 'public', 'uploads');
            if (!existsSync(uploadsDir)) {
                await mkdir(uploadsDir, { recursive: true });
            }
            const filepath = join(uploadsDir, filename);
            await writeFile(filepath, buffer);
            fileUrl = `/uploads/${filename}`;
        }

        return NextResponse.json({
            success: true,
            url: fileUrl,
            filename: file.name,
            size: file.size,
            type: file.type
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
