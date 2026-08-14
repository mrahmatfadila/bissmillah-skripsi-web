
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
        emailEnabled: true,
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

// In-memory cache for settings
let settingsInMemory = { ...DEFAULT_SETTINGS };

/**
 * Synchronous helper: returns in-memory settings.
 */
export function getSystemSettings(): typeof DEFAULT_SETTINGS {
    return settingsInMemory;
}

/**
 * Asynchronous helper: returns in-memory settings.
 */
export async function getSystemSettingsAsync(): Promise<typeof DEFAULT_SETTINGS> {
    return settingsInMemory;
}

/**
 * Update the in-memory settings configuration.
 */
export async function saveSystemSettings(settings: object, updatedBy?: string): Promise<void> {
    settingsInMemory = {
        ...settingsInMemory,
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy || 'system',
    } as any;
}
