import nodemailer from 'nodemailer';
import { getSystemSettingsAsync } from './settings';
import { prisma } from './db';
import path from 'path';

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

export class EmailService {
    static async sendNotification(to: string, subject: string, html: string, attachments: any[] = []) {
        const settings = await getSystemSettingsAsync();
        if (!settings.notification?.emailEnabled) {
            console.log("Email notification skipped: Disabled in system settings.");
            return false;
        }

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn("Email notification skipped: Missing SMTP credentials in .env");
            return false;
        }

        if (!to) {
            console.warn("Email notification skipped: No recipient provided.");
            return false;
        }

        try {
            console.log(`Sending Email to ${to}...`);
            const transporter = createTransporter();
            const from = process.env.SMTP_FROM || `"IT Ticketing Support" <${process.env.SMTP_USER}>`;

            const info = await transporter.sendMail({
                from,
                to,
                subject,
                html,
                attachments,
            });

            console.log("Email sent:", info.messageId);
            return true;
        } catch (error) {
            console.error("Failed to send Email notification:", error);
            return false;
        }
    }

    static async getAdminEmails() {
        const admins = await prisma.user.findMany({
            where: {
                role: {
                    in: ['SUPER_ADMIN', 'IT_SUPPORT']
                }
            }
        });
        return admins.map((a: { email?: string | null }) => a.email).filter(Boolean).join(',');
    }

    static async notifyNewTicket(ticket: any, creatorName: string) {
        const settings = await getSystemSettingsAsync();
        if (!settings.notification?.notifyOnCreate) return;

        const toEmails = await this.getAdminEmails();

        const mailAttachments: any[] = [];
        let htmlAttachments = '';

        if (ticket.attachments && Array.isArray(ticket.attachments) && ticket.attachments.length > 0) {
            ticket.attachments.forEach((filePath: string, index: number) => {
                const isLocal = filePath.startsWith('/uploads/');
                if (isLocal) {
                    const filename = filePath.split('/').pop() || `lampiran-${index + 1}`;
                    mailAttachments.push({
                        filename: filename,
                        path: path.join(process.cwd(), 'public', filePath)
                    });
                    htmlAttachments += `<li>Terlampir: ${filename}</li>`;
                } else {
                    htmlAttachments += `<li><a href="${filePath}">Link Eksternal Lampiran ${index + 1}</a></li>`;
                }
            });
        }

        const subject = `[Tiket Baru] ${ticket.ticketNumber} - ${ticket.title}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0; font-size: 24px;">Tiket Baru Dibuat</h2>
                    <p style="margin: 5px 0 0; opacity: 0.9;">No. ${ticket.ticketNumber}</p>
                </div>
                <div style="padding: 20px; background-color: #f8fafc;">
                    <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
                        <h3 style="margin-top: 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Detail Tiket</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; width: 30%;">Pelapor</td>
                                <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">${creatorName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Kategori</td>
                                <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">${ticket.category || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Prioritas</td>
                                <td style="padding: 8px 0;">
                                    <span style="background-color: ${ticket.priority === 'CRITICAL' ? '#fee2e2' : ticket.priority === 'HIGH' ? '#ffedd5' : ticket.priority === 'MEDIUM' ? '#fef3c7' : '#e0f2fe'}; 
                                                 color: ${ticket.priority === 'CRITICAL' ? '#dc2626' : ticket.priority === 'HIGH' ? '#ea580c' : ticket.priority === 'MEDIUM' ? '#d97706' : '#0284c7'}; 
                                                 padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                                        ${ticket.priority}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="margin-bottom: 15px;">
                            <h3 style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Judul</h3>
                            <h4 style="color: #0f172a; margin: 0; font-size: 16px;">${ticket.title}</h4>
                        </div>
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px;">
                            <h3 style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Deskripsi Singkat</h3>
                            <p style="color: #475569; line-height: 1.6; margin: 0; white-space: pre-wrap; font-size: 14px;">${ticket.description || 'Tidak ada deskripsi.'}</p>
                        </div>
                    </div>
                    
                    ${htmlAttachments ? `
                    <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-top: 20px;">
                        <h3 style="margin-top: 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Lampiran Dokumen</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #475569;">${htmlAttachments}</ul>
                    </div>
                    ` : ''}
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tickets/${ticket.id}" 
                           style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: 600;">
                           Lihat Detail Tiket
                        </a>
                    </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
                    Ini adalah email otomatis dari Sistem IT Ticketing. Mohon tidak membalas email ini.
                </div>
            </div>
        `;

        await this.sendNotification(toEmails, subject, html, mailAttachments);
    }

    static async notifyTicketCreatedForUser(ticket: any, toEmail: string, userName: string) {
        const settings = await getSystemSettingsAsync();
        if (!settings.notification?.notifyOnCreate) return;

        const subject = `[Tiket Berhasil Dibuat] ${ticket.ticketNumber} - ${ticket.title}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0; font-size: 24px;">Tiket Anda Berhasil Dibuat</h2>
                    <p style="margin: 5px 0 0; opacity: 0.9;">No. ${ticket.ticketNumber}</p>
                </div>
                <div style="padding: 20px; background-color: #f8fafc;">
                    <p style="color: #334155; font-size: 16px;">Halo <strong>${userName}</strong>,</p>
                    <p style="color: #475569;">Terima kasih telah menghubungi kami. Tiket Anda dengan detail berikut telah kami terima dan akan segera ditindaklanjuti oleh tim IT Support.</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #1e293b;">Topik: ${ticket.title}</h4>
                        <p style="color: #64748b; margin: 0 0 5px 0; font-size: 14px;"><strong>Kategori:</strong> ${ticket.category || 'N/A'}</p>
                        <p style="color: #64748b; margin: 0; font-size: 14px;"><strong>Prioritas:</strong> ${ticket.priority || 'MEDIUM'}</p>
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tickets/${ticket.id}" 
                           style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: 600;">
                           Pantau Status Tiket
                        </a>
                    </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
                    Sistem IT Ticketing Support &copy; ${new Date().getFullYear()}
                </div>
            </div>
        `;

        await this.sendNotification(toEmail, subject, html);
    }

    static async notifyTicketAssigned(ticket: any, assigneeName: string, assignedByName: string) {
        const settings = await getSystemSettingsAsync();
        if (!settings.notification?.notifyOnAssign) return;

        let toEmail = null;
        if (ticket.assigneeId) {
            const assignee = await prisma.user.findUnique({ where: { id: ticket.assigneeId } });
            if (assignee && assignee.email) {
                toEmail = assignee.email;
            }
        }

        if (!toEmail) return;

        const subject = `[Penugasan Tiket] ${ticket.ticketNumber || ticket.id} - ${ticket.title}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #0284c7; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0; font-size: 24px;">Tiket Baru Ditugaskan Kepada Anda</h2>
                    <p style="margin: 5px 0 0; opacity: 0.9;">No. ${ticket.ticketNumber || ticket.id}</p>
                </div>
                <div style="padding: 20px; background-color: #f8fafc;">
                    <p style="color: #334155; font-size: 16px;">Halo <strong>${assigneeName}</strong>,</p>
                    <p style="color: #475569;">Anda telah ditunjuk oleh <strong>${assignedByName}</strong> untuk menangani tiket berikut:</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #1e293b;">${ticket.title}</h4>
                        <p style="color: #64748b; margin: 0; font-size: 14px;"><strong>Prioritas:</strong> ${ticket.priority || 'MEDIUM'}</p>
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tickets/${ticket.id}" 
                           style="display: inline-block; background-color: #0284c7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: 600;">
                           Mulai Tangani Tiket
                        </a>
                    </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
                    Sistem IT Ticketing Support &copy; ${new Date().getFullYear()}
                </div>
            </div>
        `;

        await this.sendNotification(toEmail, subject, html);
    }

    static async notifyTicketStatusChange(ticket: any, oldStatus: string, newStatus: string, changedByName: string) {
        const settings = await getSystemSettingsAsync();
        if (!settings.notification?.notifyOnStatusChange) return;

        let toEmail = null;
        if (ticket.creatorId) {
            const creator = await prisma.user.findUnique({ where: { id: ticket.creatorId } });
            if (creator && creator.email) {
                toEmail = creator.email;
            }
        }

        if (!toEmail) return;

        const subject = `[Update Status] ${ticket.ticketNumber || ticket.id} - ${ticket.title}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: ${newStatus === 'RESOLVED' || newStatus === 'CLOSED' ? '#16a34a' : '#ea580c'}; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0; font-size: 24px;">Status Tiket Diperbarui</h2>
                    <p style="margin: 5px 0 0; opacity: 0.9;">No. ${ticket.ticketNumber || ticket.id}</p>
                </div>
                <div style="padding: 20px; background-color: #f8fafc;">
                    <div style="background: white; padding: 20px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; font-size: 18px; font-weight: bold; color: #334155;">
                            <span style="color: #94a3b8; text-decoration: line-through;">${oldStatus}</span>
                            <span style="color: #cbd5e1;">➔</span>
                            <span style="color: ${newStatus === 'RESOLVED' || newStatus === 'CLOSED' ? '#16a34a' : '#ea580c'};">${newStatus}</span>
                        </div>
                    </div>
                    
                    <p style="color: #475569; margin: 0 0 15px 0;"><strong>Topik:</strong> ${ticket.title}</p>
                    <p style="color: #475569; margin: 0 0 20px 0;">Pembaruan dilakukan oleh: <strong>${changedByName}</strong></p>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tickets/${ticket.id}" 
                           style="display: inline-block; background-color: ${newStatus === 'RESOLVED' || newStatus === 'CLOSED' ? '#16a34a' : '#ea580c'}; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: 600;">
                           Cek Detail Lengkap
                        </a>
                    </div>
                </div>
            </div>
        `;

        await this.sendNotification(toEmail, subject, html);
    }

    static async notifyTicketComment(ticket: any, commenterName: string, commentContent: string) {
        const settings = await getSystemSettingsAsync();
        if (!settings.notification?.notifyOnComment) return;

        // Truncate comment if too long
        const shortContent = commentContent.length > 50 ? commentContent.substring(0, 50) + '...' : commentContent;

        let toEmails: string[] = [];

        if (ticket.creatorId) {
            const creator = await prisma.user.findUnique({ where: { id: ticket.creatorId } });
            // Only notify if the creator is not the one who commented (approx check by name)
            if (creator && creator.email && creator.name !== commenterName) {
                toEmails.push(creator.email);
            }
        }
        if (ticket.assigneeId) {
            const assignee = await prisma.user.findUnique({ where: { id: ticket.assigneeId } });
            if (assignee && assignee.email && assignee.name !== commenterName) {
                toEmails.push(assignee.email);
            }
        }

        const recipients = [...Array.from(new Set(toEmails))].join(',');

        if (!recipients) return;

        const subject = `[Komentar Baru] ${ticket.ticketNumber || ticket.id}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #fbbf24; color: #78350f; padding: 15px 20px; border-bottom: 1px solid #fcd34d;">
                    <h2 style="margin: 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                        💬 Komentar Baru pada Tiket #${ticket.ticketNumber || ticket.id}
                    </h2>
                </div>
                <div style="padding: 20px; background-color: #f8fafc;">
                    <p style="color: #475569; margin-top: 0;"><strong>${commenterName}</strong> menambahkan komentar:</p>
                    
                    <div style="background: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 6px 6px 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <p style="margin: 0; color: #334155; font-style: italic; white-space: pre-wrap;">"${shortContent}"</p>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px;"><strong>Judul Tiket:</strong> ${ticket.title}</p>
                    
                    <div style="margin-top: 25px;">
                        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tickets/${ticket.id}" 
                           style="display: inline-block; background-color: #f59e0b; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: 600; font-size: 14px;">
                           Balas Komentar
                        </a>
                    </div>
                </div>
            </div>
        `;

        await this.sendNotification(recipients, subject, html);
    }

    static async notifyShiftSwapRequest(targetEmail: string, targetName: string, requesterName: string, targetDate: string, requesterDate: string) {
        const settings = await getSystemSettingsAsync();
        if (!settings.notification?.emailEnabled) return;

        const subject = `[Tukar Shift] Permintaan Tukar Shift dari ${requesterName}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #8b5cf6; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0; font-size: 24px;">Permintaan Tukar Shift</h2>
                </div>
                <div style="padding: 20px; background-color: #f8fafc;">
                    <p style="color: #334155; font-size: 16px;">Halo <strong>${targetName}</strong>,</p>
                    <p style="color: #475569;">Rekan Anda <strong>${requesterName}</strong> mengajukan permintaan tukar shift kerja dengan detail berikut:</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;">
                        <ul style="color: #475569; padding-left: 20px;">
                            <li><strong>Jadwal Anda:</strong> ${targetDate}</li>
                            <li><strong>Jadwal Pengaju:</strong> ${requesterDate}</li>
                        </ul>
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/settings/schedule/swap" 
                           style="display: inline-block; background-color: #8b5cf6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: 600;">
                           Lihat & Proses Pengajuan
                        </a>
                    </div>
                </div>
            </div>
        `;

        await this.sendNotification(targetEmail, subject, html);
    }
}
