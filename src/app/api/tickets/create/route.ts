import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateTicketNumber } from '@/lib/ticket-number';
import { WhatsAppService } from '@/lib/whatsapp';
import { EmailService } from '@/lib/email';
import { getSystemSettings } from '@/lib/settings';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, priority: manualPriority, category, attachments, ahpScores } = body;
        const settings = getSystemSettings();

        if (!title || !description) {
            return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
        }

        if (settings.ticket?.requireCategory && !category) {
            return NextResponse.json({ error: 'Kategori tiket harus diisi sesuai pengaturan sistem.' }, { status: 400 });
        }

        if (settings.ticket?.requirePriority && !manualPriority && !ahpScores) {
            return NextResponse.json({ error: 'Prioritas tiket harus diisi sesuai pengaturan sistem.' }, { status: 400 });
        }

        let finalPriority = manualPriority || settings.ticket?.defaultPriority || 'MEDIUM';
        let calculatedAhpScore = null;

        // AHP Calculation Logic
        if (ahpScores) {
            try {
                const criteria = await prisma.aHPCriteria.findMany();
                if (criteria.length > 0) {
                    let totalScore = 0;
                    let totalWeight = 0;
                    let maxUserScore = 0;

                    // Normalize keys for matching (lowercase, trimmed) to avoid mismatches
                    const normalizedScores: Record<string, number> = {};
                    if (ahpScores) {
                        Object.keys(ahpScores).forEach(k => {
                            normalizedScores[k.trim().toLowerCase()] = parseFloat(ahpScores[k]);
                        });
                    }

                    console.log('--- AHP DEBUG START ---');
                    console.log('Incoming Scores:', ahpScores);
                    console.log('Normalized Scores:', normalizedScores);

                    // Score = Sum(Weight * UserInput)
                    // UserInput is 1-5
                    for (const c of criteria) {
                        // Robust matching: Try exact match first, then normalized
                        const dbName = c.name.trim().toLowerCase();
                        let rawScore = ahpScores[c.name];

                        if (rawScore === undefined) {
                            rawScore = normalizedScores[dbName];
                        }

                        const userScore = rawScore ? parseFloat(rawScore.toString()) : 1;

                        console.log(`Criterion: "${c.name}", UserScore: ${userScore} (Weight: ${c.weight})`);

                        totalScore += c.weight * userScore;
                        totalWeight += c.weight;
                        if (userScore > maxUserScore) maxUserScore = userScore;
                    }

                    console.log(`Raw Total Score: ${totalScore}, Total Weight: ${totalWeight}`);

                    // Normalize if weights are off (e.g. user manually edited DB or partial data)
                    if (totalWeight > 0 && Math.abs(totalWeight - 1) > 0.1) {
                        totalScore = totalScore / totalWeight;
                        console.log(`Normalized Score: ${totalScore}`);
                    }

                    calculatedAhpScore = totalScore;

                    // Determine Priority based on Weighted Score (Scale 1-5)
                    // Thresholds:
                    if (totalScore >= 3.8) finalPriority = 'CRITICAL';
                    else if (totalScore >= 2.8) finalPriority = 'HIGH';
                    else if (totalScore >= 1.5) finalPriority = 'MEDIUM';
                    else finalPriority = 'LOW';

                    // FAILSAFE: If any single input is "Sangat Tinggi" (5), result CANNOT be Low.
                    // It should be at least High.
                    if (maxUserScore >= 5) {
                        if (finalPriority === 'LOW' || finalPriority === 'MEDIUM') {
                            finalPriority = 'HIGH';
                            console.log('Create Ticket AHP: Override triggered. Max score is 5, forcing HIGH.');
                        }
                    } else if (maxUserScore >= 4) {
                        // If any is 4, ensure at least Medium
                        if (finalPriority === 'LOW') {
                            finalPriority = 'MEDIUM';
                            console.log('Create Ticket AHP: Override triggered. Max score is 4, forcing MEDIUM.');
                        }
                    }

                    console.log(`AHP Calculation: Score=${totalScore.toFixed(2)} Priority=${finalPriority}`);
                }
            } catch (e) {
                console.error("Error calculating AHP score", e);
            }
        }

        const ticketCategory = category || 'IT_SUPPORT';
        const ticketNumber = await generateTicketNumber(ticketCategory);

        let autoAssignId = null;
        if (settings.ticket?.autoAssignEnabled) {
            // Find a user with IT_SUPPORT role randomly or first one
            const supportUsers = await prisma.user.findMany({
                where: { role: 'IT_SUPPORT' }
            });
            if (supportUsers.length > 0) {
                const randomSupportIndex = Math.floor(Math.random() * supportUsers.length);
                autoAssignId = supportUsers[randomSupportIndex].id;
            }
        }

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                priority: finalPriority,
                category: ticketCategory,
                ticketNumber,
                attachments: attachments || [],
                creatorId: session.user.id,
                assigneeId: autoAssignId,
                status: autoAssignId ? 'IN_PROGRESS' : 'OPEN',
                ahpScore: calculatedAhpScore,
            },
        });

        const admins = await prisma.user.findMany({
            where: { role: { in: ['SUPER_ADMIN', 'IT_SUPPORT', 'MANAGER'] } }
        });

        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map(admin => ({
                    userId: admin.id,
                    title: `Tiket Baru: #${ticketNumber}`,
                    message: `${session.user.name || "User"} membuat tiket baru: ${title}`,
                    type: "NEW_TICKET",
                    link: `/tickets/${ticket.id}`,
                    ticketId: ticket.id
                }))
            });
        }

        // Send WhatsApp Notification (Async - fire and forget)
        WhatsAppService.notifyNewTicket(ticket, session.user.name || "User")
            .catch(err => console.error("Failed to trigger WA notification", err));

        // Send Email Notification (Async - fire and forget)
        EmailService.notifyNewTicket(ticket, session.user.name || "User")
            .catch(err => console.error("Failed to trigger Email notification", err));

        return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
        console.error('Error creating ticket:', error);
        return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }
}
