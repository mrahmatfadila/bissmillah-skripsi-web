import fs from 'fs';
import path from 'path';

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

export function getSystemSettings() {
    try {
        const SETTINGS_FILE = path.join(process.cwd(), 'data', 'system-settings.json');
        if (!fs.existsSync(SETTINGS_FILE)) {
            return DEFAULT_SETTINGS;
        }
        const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return DEFAULT_SETTINGS;
    }
}
