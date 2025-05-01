// app/api/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
  const { gmcNumber } = await req.json();

  if (!gmcNumber) {
    return NextResponse.json({ error: 'GMC number is required' }, { status: 400 });
  }

  try {
    const data = await verifyGMC(gmcNumber);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API ERROR:', error);
    return NextResponse.json({ error: error.message || 'Scraping failed' }, { status: 500 });
  }
}

async function verifyGMC(gmcNumber: string) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    );
    await page.setDefaultNavigationTimeout(60000);
    await page.setDefaultTimeout(30000);

    await page.goto(https://www.gmc-uk.org/registrants/${gmcNumber}, {
      waitUntil: 'networkidle2',
    });

    await page.waitForSelector('#registrantNameId', { timeout: 15000 });
    await page.waitForSelector('#gmcNumberId', { timeout: 15000 });

    const data = await page.evaluate(() => {
      const registrantNameId = document.querySelector('#registrantNameId')?.textContent?.trim() || '';
      const gmcNumberId = document.querySelector('#gmcNumberId')?.textContent?.trim() || '';
      return { registrantNameId, gmcNumberId };
    });

    if (!data.registrantNameId || !data.gmcNumberId) {
      throw new Error('Unable to extract name or number');
    }

    return data;
  } finally {
    await browser.close();
  }
}
