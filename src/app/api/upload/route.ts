import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getSystemSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';


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

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const filename = `${timestamp}-${randomString}.${extension}`;

        const filepath = join(uploadsDir, filename);
        await writeFile(filepath, buffer);

        // Return the public URL
        const fileUrl = `/uploads/${filename}`;

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
