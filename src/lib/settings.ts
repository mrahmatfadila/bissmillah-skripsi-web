import { PrismaClient } from '@prisma/client';

export const DEFAULT_SETTINGS = {
    general: {
        appName: 'IT Ticketing Support',
        appLogo: '/logo/login-logo.png',
        companyName: 'PT Plaza Bali',
        supportEmail: 'support@plazabali.com',
        supportPhone: '082112435490',
        timezone: 'Asia/Makassar',
        language: 'id',
        dateFormat: 'DD/MM/YYYY',
    },
    ticket: {
        autoAssignEnabled: false,
        autoCloseEnabled: true,
        autoCloseDays: 7,
        maxAttachmentSize: 5,
        allowedFileTypes: 'jpg,jpeg,png,gif,pdf,doc,docx,xlsx',
        requireCategory: true,
        requirePriority: true,
        defaultPriority: 'MEDIUM',
        ticketPrefix: 'TKT',
    },
    notification: {
        emailEnabled: false,
        whatsappEnabled: true,
        whatsappApiKey: '',
        whatsappAdminPhone: '082112435490,081292765764',
        notifyOnCreate: true,
        notifyOnAssign: true,
        notifyOnStatusChange: true,
        notifyOnComment: true,
        notifyOnClose: true,
    },
    security: {
        sessionTimeout: 480,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        requireStrongPassword: false,
        passwordMinLength: 6,
        twoFactorEnabled: false,
        ipWhitelistEnabled: false,
        ipWhitelist: '',
    },
    sla: {
        enabled: true,
        criticalHours: 2,
        highHours: 8,
        mediumHours: 24,
        lowHours: 72,
        warningThreshold: 75,
    },
    maintenance: {
        maintenanceMode: false,
        maintenanceMessage: 'Sistem sedang dalam perbaikan. Mohon coba beberapa saat lagi.',
        allowAdminAccess: true,
        scheduledMaintenance: '',
    },
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
};

// In-memory cache for settings (reduces DB calls)
let _cache: { data: any; ts: number } | null = null;
const CACHE_TTL_MS = 30_000; // 30 seconds

/**
 * Synchronous fallback: returns in-memory cache or defaults.
 * Use getSystemSettingsAsync() for fresh data from DB.
 */
export function getSystemSettings(): typeof DEFAULT_SETTINGS {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL_MS) {
        return _cache.data;
    }
    // Return defaults if cache is cold (async load will warm it)
    return DEFAULT_SETTINGS;
}

export async function getSystemSettingsAsync(): Promise<typeof DEFAULT_SETTINGS> {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL_MS) {
        return _cache.data;
    }
    try {
        const prisma = new PrismaClient();
        const row = await prisma.systemSetting.findUnique({ where: { id: 'singleton' } });
        await prisma.$disconnect();
        if (row) {
            const parsed = JSON.parse(row.data);
            _cache = { data: parsed, ts: Date.now() };
            return parsed;
        }
    } catch {
        // DB not available, return defaults
    }
    return DEFAULT_SETTINGS;
}

export async function saveSystemSettings(settings: object, updatedBy?: string): Promise<void> {
    const prisma = new PrismaClient();
    try {
        await prisma.systemSetting.upsert({
            where: { id: 'singleton' },
            update: { data: JSON.stringify(settings), updatedBy: updatedBy || 'system' },
            create: { id: 'singleton', data: JSON.stringify(settings), updatedBy: updatedBy || 'system' },
        });
        _cache = { data: settings, ts: Date.now() };
    } finally {
        await prisma.$disconnect();
    }
}
