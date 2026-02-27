import { getSystemSettings } from './settings';

export class WhatsAppService {
    // Fonnte API Implementation
    static async sendNotification(phone: string, message: string, imageUrl?: string) {
        const settings = getSystemSettings();
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
            console.log(`Sending WhatsApp to ${phone}... (Image: ${imageUrl || 'None'})`);

            // Use URLSearchParams/x-www-form-urlencoded as it is more stable with some Node environments interacting with PHP APIs
            // However, Fonnte documentation recommends FormData for files.
            // Let's stick to FormData but ensure headers are not manually set to 'multipart/form-data' because fetch does it automatically with boundary.

            const formData = new FormData();
            formData.append('target', phone);
            // Handle Image URL
            // Fonnte requires a PUBLICLY accessible URL to send media.
            // If we are on localhost, Fonnte cannot access our /uploads folder.
            // So, if the URL is relative or points to localhost, we skip the 'url' param 
            // and append the link to the message instead to prevent API failure.

            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            let finalImageUrl = imageUrl;
            let sendAsAttachment = false;

            if (imageUrl) {
                // If relative path, prepend base URL
                if (imageUrl.startsWith('/')) {
                    finalImageUrl = `${baseUrl}${imageUrl}`;
                }

                // Check if it's a public URL or localhost
                const isLocalhost = finalImageUrl?.includes('localhost') || finalImageUrl?.includes('127.0.0.1');

                if (isLocalhost) {
                    console.warn(`WhatsApp: Image is on localhost (${finalImageUrl}), cannot send as attachment. Appending link to text.`);
                    formData.append('message', `${message}\n\n🖼️ Lampiran (Local): ${finalImageUrl}`);
                } else {
                    // Public URL, try to send as attachment
                    formData.append('message', message);
                    formData.append('url', finalImageUrl!);
                }
            } else {
                formData.append('message', message);
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': apiKey,
                    // Do NOT set Content-Type here, let fetch handle the boundary for FormData
                },
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
        const settings = getSystemSettings();
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
            `_Mohon tim IT Support segera melakukan pengecekan pada sistem. Terima kasih._ 👨‍💻`;

        // Check for attachments
        // const imageUrl = ticket.attachments && ticket.attachments.length > 0 ? ticket.attachments[0] : undefined;
        // Image logic removed since api might not support it reliably without public URL.

        await this.sendNotification(targetPhone, message, undefined);
    }

    static async notifyTicketAssigned(ticket: any, assigneeName: string, assignedByName: string) {
        const settings = getSystemSettings();
        if (!settings.notification?.notifyOnAssign) return;

        const targetPhone = settings.notification?.whatsappAdminPhone || process.env.WHATSAPP_ADMIN_PHONE;
        if (!targetPhone) return;

        const message = `👨‍🔧 *PENUGASAN TIKET* 👨‍🔧\n\n` +
            `Halo *${assigneeName}*,\n` +
            `Anda telah ditugaskan oleh *${assignedByName}* untuk menangani kendala berikut:\n\n` +
            `*No. Tiket:* ${ticket.ticketNumber || ticket.id}\n` +
            `*Topik:* ${ticket.title}\n` +
            `*Prioritas:* ${ticket.priority || 'MEDIUM'}\n\n` +
            `_Silakan login ke sistem ticketing untuk melihat detail dan mulai mengerjakan. Semangat!_ 🚀`;

        await this.sendNotification(targetPhone, message);
    }

    static async notifyTicketStatusChange(ticket: any, oldStatus: string, newStatus: string, changedByName: string) {
        const settings = getSystemSettings();
        if (!settings.notification?.notifyOnStatusChange) return;

        const targetPhone = settings.notification?.whatsappAdminPhone || process.env.WHATSAPP_ADMIN_PHONE;
        if (!targetPhone) return;

        // Status emoji mapping
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
        const settings = getSystemSettings();
        if (!settings.notification?.notifyOnComment) return;

        const targetPhone = settings.notification?.whatsappAdminPhone || process.env.WHATSAPP_ADMIN_PHONE;
        if (!targetPhone) return;

        // Truncate comment if too long
        const shortContent = commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent;

        const message = `💬 *KOMENTAR BARU* 💬\n\n` +
            `Tiket *[#${ticket.ticketNumber || ticket.id}]* mendapatkan balasan/komentar baru dari *${commenterName}*:\n\n` +
            `_"${shortContent}"_\n\n` +
            `*Topik Tiket:* ${ticket.title}\n\n` +
            `_Buka sistem ticketing untuk membalas atau melihat lampiran tambahan._`;

        await this.sendNotification(targetPhone, message);
    }
}
