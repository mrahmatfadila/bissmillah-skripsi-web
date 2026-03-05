import { getSystemSettingsAsync } from './settings';

export class WhatsAppService {
    // Fonnte API Implementation
    static async sendNotification(phone: string, message: string, imageUrl?: string) {
        const settings = await getSystemSettingsAsync();
        const apiKey = settings.notification?.whatsappApiKey || process.env.WHATSAPP_API_KEY;
        const apiUrl = process.env.WHATSAPP_API_URL || 'https://api.fonnte.com/send';

        if (!settings.notification?.whatsappEnabled) {
            console.log("WhatsApp notification skipped: Disabled in system settings.");
            return false;
        }

        if (!apiKey) {
            console.warn("WhatsApp notification skipped: Missing API Key.");
            return false;
        }

        try {
            console.log(`Sending WhatsApp to ${phone}...`);

            const formData = new FormData();
            formData.append('target', phone);

            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            let finalImageUrl = imageUrl;

            if (imageUrl) {
                if (imageUrl.startsWith('/')) {
                    finalImageUrl = `${baseUrl}${imageUrl}`;
                }
                const isLocalhost = finalImageUrl?.includes('localhost') || finalImageUrl?.includes('127.0.0.1');
                if (isLocalhost) {
                    formData.append('message', `${message}\n\n🖼️ Lampiran (Local): ${finalImageUrl}`);
                } else {
                    formData.append('message', message);
                    formData.append('url', finalImageUrl!);
                }
            } else {
                formData.append('message', message);
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Authorization': apiKey },
                body: formData
            });

            const responseText = await response.text();
            console.log("Fonnte API Response:", responseText);

            if (!response.ok) {
                console.error("WhatsApp API Error Status:", response.status);
                return false;
            }
            return true;
        } catch (error) {
            console.error("Failed to send WhatsApp notification:", error);
            return false;
        }
    }

    static async notifyNewTicket(ticket: any, creatorName: string) {
        const settings = await getSystemSettingsAsync();
        if (!settings.notification?.notifyOnCreate) return;

        const targetPhone = settings.notification?.whatsappAdminPhone || process.env.WHATSAPP_ADMIN_PHONE;
        if (!targetPhone) {
            console.warn("WhatsApp notification skipped: No Admin Phone configured.");
            return;
        }

        const message = `🚨 *TIKET BARU DIBUAT* 🚨\n\n` +
            `*No. Tiket:* ${ticket.ticketNumber}\n` +
            `*Pelapor:* ${creatorName}\n` +
            `*Prioritas:* ${ticket.priority}\n` +
            `*Kategori:* ${ticket.category || 'IT Support'}\n\n` +
            `*Judul:*\n${ticket.title}\n\n` +
            `*Deskripsi Singkat:*\n${ticket.description ? ticket.description.substring(0, 100) + '...' : 'Tidak ada deskripsi.'}\n\n` +
            `_Mohon tim IT Support segera melakukan pengecekan. Terima kasih._ 👨‍💻`;

        await this.sendNotification(targetPhone, message);
    }

    static async notifyTicketAssigned(ticket: any, assigneeName: string, assignedByName: string) {
        const settings = await getSystemSettingsAsync();
        if (!settings.notification?.notifyOnAssign) return;

        const targetPhone = settings.notification?.whatsappAdminPhone || process.env.WHATSAPP_ADMIN_PHONE;
        if (!targetPhone) return;

        const message = `👨‍🔧 *PENUGASAN TIKET* 👨‍🔧\n\n` +
            `Halo *${assigneeName}*,\n` +
            `Anda telah ditugaskan oleh *${assignedByName}* untuk menangani kendala berikut:\n\n` +
            `*No. Tiket:* ${ticket.ticketNumber || ticket.id}\n` +
            `*Topik:* ${ticket.title}\n` +
            `*Prioritas:* ${ticket.priority || 'MEDIUM'}\n\n` +
            `_Silakan login ke sistem ticketing untuk melihat detail. Semangat!_ 🚀`;

        await this.sendNotification(targetPhone, message);
    }

    static async notifyTicketStatusChange(ticket: any, oldStatus: string, newStatus: string, changedByName: string) {
        const settings = await getSystemSettingsAsync();
        if (!settings.notification?.notifyOnStatusChange) return;

        const targetPhone = settings.notification?.whatsappAdminPhone || process.env.WHATSAPP_ADMIN_PHONE;
        if (!targetPhone) return;

        const getStatusEmoji = (s: string) => {
            if (s === 'RESOLVED' || s === 'CLOSED') return '✅';
            if (s === 'IN_PROGRESS') return '⏳';
            if (s === 'CANCELLED') return '❌';
            return 'ℹ️';
        };
        const statusEmoji = getStatusEmoji(newStatus);

        const message = `${statusEmoji} *UPDATE STATUS TIKET* ${statusEmoji}\n\n` +
            `*No. Tiket:* ${ticket.ticketNumber || ticket.id}\n` +
            `*Topik:* ${ticket.title}\n\n` +
            `Status tiket telah diubah:\n` +
            `~${oldStatus}~  ➔  *${newStatus}*\n\n` +
            `*Diperbarui Oleh:* ${changedByName}\n\n` +
            `_Cek dashboard Anda untuk informasi lebih rinci._`;

        await this.sendNotification(targetPhone, message);
    }

    static async notifyTicketComment(ticket: any, commenterName: string, commentContent: string) {
        const settings = await getSystemSettingsAsync();
        if (!settings.notification?.notifyOnComment) return;

        const targetPhone = settings.notification?.whatsappAdminPhone || process.env.WHATSAPP_ADMIN_PHONE;
        if (!targetPhone) return;

        const shortContent = commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent;

        const message = `💬 *KOMENTAR BARU* 💬\n\n` +
            `Tiket *[#${ticket.ticketNumber || ticket.id}]* mendapatkan balasan dari *${commenterName}*:\n\n` +
            `_"${shortContent}"_\n\n` +
            `*Topik Tiket:* ${ticket.title}\n\n` +
            `_Buka sistem ticketing untuk membalas atau melihat lampiran._`;

        await this.sendNotification(targetPhone, message);
    }
}
