import { prisma } from './db';
import { getSystemSettings } from './settings';

/**
 * Generate a unique ticket number based on category and date
 * Format: {PREFIX}-{CATEGORY_CODE}-YYYYMMDD-XXX
 * Examples:
 * - TKT-IT-20260118-001
 * - TKT-FIN-20260118-001
 * - TKT-SEC-20260118-001
 */
export async function generateTicketNumber(category: string): Promise<string> {
    const settings = getSystemSettings();
    const prefixStr = settings.ticket?.ticketPrefix || 'TKT';
    // Map category to code
    const categoryCodeMap: Record<string, string> = {
        'IT_SUPPORT': 'IT',
        'FINANCE': 'FIN',
        'EDC': 'FIN',
        'SECURITY': 'SEC',
        'CCTV': 'SEC',
        'GENERAL': 'GEN'
    };

    const categoryCode = categoryCodeMap[category] || 'GEN';

    // Get current date in YYYYMMDD format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Find the last ticket number for this category and date
    const prefix = `${prefixStr}-${categoryCode}-${dateStr}-`;

    const lastTicket = await prisma.ticket.findFirst({
        where: {
            ticketNumber: {
                startsWith: prefix
            }
        },
        orderBy: {
            ticketNumber: 'desc'
        }
    });

    let sequenceNumber = 1;

    if (lastTicket && lastTicket.ticketNumber) {
        // Extract the sequence number from the last ticket
        const lastSequence = parseInt(lastTicket.ticketNumber.split('-').pop() || '0');
        sequenceNumber = lastSequence + 1;
    }

    // Format: TKT-IT-20260118-001
    const ticketNumber = `${prefix}${String(sequenceNumber).padStart(3, '0')}`;

    return ticketNumber;
}
