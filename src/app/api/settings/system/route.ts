import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSystemSettingsAsync, saveSystemSettings, DEFAULT_SETTINGS } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const settings = await getSystemSettingsAsync();
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
        const currentSettings = await getSystemSettingsAsync();

        const updatedSettings = {
            ...currentSettings,
            ...body,
            updatedAt: new Date().toISOString(),
            updatedBy: session.user.name || session.user.email || 'admin',
        };

        await saveSystemSettings(updatedSettings, session.user.name || 'admin');
        return NextResponse.json({ success: true, settings: updatedSettings });
    } catch (error) {
        console.error('Error saving system settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const resetSettings = {
            ...DEFAULT_SETTINGS,
            updatedAt: new Date().toISOString(),
            updatedBy: session.user.name || 'admin',
        };

        await saveSystemSettings(resetSettings, session.user.name || 'admin');
        return NextResponse.json({ success: true, message: 'Settings reset to defaults' });
    } catch (error) {
        console.error('Error resetting settings:', error);
        return NextResponse.json({ error: 'Failed to reset settings' }, { status: 500 });
    }
}
