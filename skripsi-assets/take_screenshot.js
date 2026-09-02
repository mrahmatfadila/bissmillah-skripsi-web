const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function main() {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

    console.log('Using browser:', executablePath);

    const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setViewport({
        width: 1000,
        height: 1400,
        deviceScaleFactor: 3 // Ultra Crisp 3x DPI for printing & skripsi report
    });

    const htmlPath = path.resolve(__dirname, 'render_modal.html');
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');

    const modalElement = await page.$('#modal-container');
    if (!modalElement) {
        throw new Error('Modal container not found');
    }

    const outputDir = path.resolve(__dirname);
    const outputPath1 = path.join(outputDir, 'modal-buat-tiket-permintaan-hd.png');
    
    // Also save into public/screenshots/
    const publicDir = path.resolve(__dirname, '..', 'public', 'screenshots');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    const outputPath2 = path.join(publicDir, 'modal-buat-tiket-permintaan-hd.png');

    // Also save into brain artifacts dir
    const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\1bef2e3d-7c7d-4431-9df7-302d31bbc570';
    const outputPath3 = path.join(artifactDir, 'modal-buat-tiket-permintaan-hd.png');

    // Screenshot just the modal element with transparent padding or exact border
    await modalElement.screenshot({
        path: outputPath1,
        omitBackground: true
    });
    
    fs.copyFileSync(outputPath1, outputPath2);
    if (fs.existsSync(artifactDir)) {
        fs.copyFileSync(outputPath1, outputPath3);
    }

    console.log('HD Screenshot successfully saved to:');
    console.log('1.', outputPath1);
    console.log('2.', outputPath2);
    console.log('3.', outputPath3);

    await browser.close();
}

main().catch(err => {
    console.error('Error generating screenshot:', err);
    process.exit(1);
});
