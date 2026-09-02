const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function generatePdf() {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

    console.log('Launching browser for PDF generation:', executablePath);

    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    const htmlPath = path.resolve(__dirname, 'ahp_tutorial_doc.html');

    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');

    const outputDir = path.resolve(__dirname);
    const pdfPath1 = path.join(outputDir, 'Tutorial_Perhitungan_AHP_IT_Ticketing.pdf');

    const publicDir = path.resolve(__dirname, '..', 'public', 'documents');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    const pdfPath2 = path.join(publicDir, 'Tutorial_Perhitungan_AHP_IT_Ticketing.pdf');

    const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\1bef2e3d-7c7d-4431-9df7-302d31bbc570';
    const pdfPath3 = path.join(artifactDir, 'Tutorial_Perhitungan_AHP_IT_Ticketing.pdf');

    await page.pdf({
        path: pdfPath1,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '16mm',
            bottom: '18mm',
            left: '16mm',
            right: '16mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 8pt; color: #94a3b8; width: 100%; text-align: right; padding-right: 16mm; font-family: 'Plus Jakarta Sans', sans-serif;">
            Tutorial & Panduan Perhitungan AHP — Sistem IT Ticketing Support
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 8pt; color: #94a3b8; width: 100%; text-align: center; font-family: 'Plus Jakarta Sans', sans-serif;">
            Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span>
          </div>
        `
    });

    fs.copyFileSync(pdfPath1, pdfPath2);
    if (fs.existsSync(artifactDir)) {
        fs.copyFileSync(pdfPath1, pdfPath3);
    }

    console.log('PDF Generated Successfully!');
    console.log('1.', pdfPath1);
    console.log('2.', pdfPath2);
    console.log('3.', pdfPath3);

    await browser.close();
}

generatePdf().catch(err => {
    console.error('Error generating PDF:', err);
    process.exit(1);
});
