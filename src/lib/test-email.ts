import { EmailService } from './email';
import { getSystemSettings } from './settings';
import { prisma } from './db';
import * as dotenv from 'dotenv';
dotenv.config();

console.log("TESTING EMAIL");
const runTest = async () => {
    const dummyTicket = {
        id: "999",
        ticketNumber: "TKT-TEST-001",
        title: "Test Pengiriman WhatsApp",
        priority: "CRITICAL"
    }
    console.log("Settings Enable Email: ", getSystemSettings().notification?.emailEnabled)

    console.log("Sending Status Change...")

    // We need to pass valid parameters
    // ticket: any, oldStatus: string, newStatus: string, changedByName: string
    await EmailService.notifyTicketStatusChange(dummyTicket, "OPEN", "IN_PROGRESS", "SuperAdmin");

    console.log("DONE");
}

runTest();
