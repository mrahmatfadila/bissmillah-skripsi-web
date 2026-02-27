import { WhatsAppService } from './whatsapp';
import { getSystemSettings } from './settings';
import * as dotenv from 'dotenv';
dotenv.config();

console.log("TESTING WHATSAPP");
const runTest = async () => {
    const dummyTicket = {
        ticketNumber: "TKT-TEST-001",
        title: "Test Pengiriman WhatsApp",
        priority: "CRITICAL"
    }
    console.log("Settings Enable WhatsApp: ", getSystemSettings().notification?.whatsappEnabled)
    await WhatsAppService.notifyNewTicket(dummyTicket, "Tester");
    console.log("DONE");
}

runTest();
