export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { getSystemSettings, DEFAULT_SETTINGS } from '@/lib/settings';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'system-settings.json');

function ensureDataDir() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function writeSettings(settings: object) {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const settings = getSystemSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error reading system settings:', error);
        return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const currentSettings = getSystemSettings();

        const updatedSettings = {
            ...currentSettings,
            ...body,
            updatedAt: new Date().toISOString(),
            updatedBy: session.user.name || session.user.email || 'admin',
        };

        writeSettings(updatedSettings);
        return NextResponse.json({ success: true, settings: updatedSettings });
    } catch (error) {
        console.error('Error saving system settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        writeSettings({
            ...DEFAULT_SETTINGS,
            updatedAt: new Date().toISOString(),
            updatedBy: session.user.name || 'admin',
        });

        return NextResponse.json({ success: true, message: 'Settings reset to defaults' });
    } catch (error) {
        console.error('Error resetting settings:', error);
        return NextResponse.json({ error: 'Failed to reset settings' }, { status: 500 });
    }
}
