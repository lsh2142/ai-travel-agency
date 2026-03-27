import { chromium, Browser, BrowserContext, Page } from 'playwright';
import type { AvailabilityResult, BookingSite } from '@/types';

export interface BrowserMonitorOptions {
  headless?: boolean;
  timeout?: number;
  retries?: number;
}

export class BrowserMonitor {
  private browser: Browser | null = null;
  private options: Required<BrowserMonitorOptions>;

  constructor(options: BrowserMonitorOptions = {}) {
    this.options = {
      headless: options.headless ?? true,
      timeout: options.timeout ?? 30000,
      retries: options.retries ?? 3,
    };
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.options.headless,
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async checkAvailability(
    url: string,
    site: BookingSite,
    checkIn: string,
    checkOut: string,
    guests: number
  ): Promise<AvailabilityResult> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.options.retries; attempt++) {
      try {
        return await this.checkWithSite(url, site, checkIn, checkOut, guests);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.options.retries - 1) {
          await this.sleep(1000 * (attempt + 1));
        }
      }
    }

    return {
      available: false,
      checkedAt: new Date(),
      error: lastError?.message ?? 'Unknown error',
    };
  }

  private async checkWithSite(
    url: string,
    site: BookingSite,
    checkIn: string,
    checkOut: string,
    guests: number
  ): Promise<AvailabilityResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    try {
      const page = await context.newPage();
      page.setDefaultTimeout(this.options.timeout);

      switch (site) {
        case 'jalan':
          return await this.checkJalan(page, url, checkIn, checkOut, guests);
        case 'rakuten':
          return await this.checkRakuten(page, url, checkIn, checkOut, guests);
        case 'hitou':
          return await this.checkHitou(page, url, checkIn, checkOut, guests);
        default:
          throw new Error(`Unsupported booking site: ${site}`);
      }
    } finally {
      await context.close();
    }
  }

  private async checkJalan(
    page: Page,
    url: string,
    checkIn: string,
    checkOut: string,
    guests: number
  ): Promise<AvailabilityResult> {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const availabilitySelector = '.planList, .empty-plan, [data-plan-available]';
    try {
      await page.waitForSelector(availabilitySelector, { timeout: 10000 });
    } catch {
      // Selector not found - check for empty state
    }

    const isEmpty = await page.$('.empty-plan, .no-vacancy, [data-vacancy="0"]');
    if (isEmpty) {
      return { available: false, checkedAt: new Date() };
    }

    const planItems = await page.$$('.planList li, .plan-item');
    const priceEl = await page.$('.planList .price, .plan-price');
    let price: number | undefined;

    if (priceEl) {
      const priceText = await priceEl.textContent();
      const match = priceText?.replace(/[,¥￥]/g, '').match(/\d+/);
      if (match) price = parseInt(match[0], 10);
    }

    return {
      available: planItems.length > 0,
      price,
      rooms: planItems.length,
      checkedAt: new Date(),
    };
  }

  private async checkRakuten(
    page: Page,
    url: string,
    checkIn: string,
    checkOut: string,
    guests: number
  ): Promise<AvailabilityResult> {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    try {
      await page.waitForSelector('.plan-list, .noplan-area', { timeout: 10000 });
    } catch {
      // continue
    }

    const noPlan = await page.$('.noplan-area, .no-plan');
    if (noPlan) {
      return { available: false, checkedAt: new Date() };
    }

    const plans = await page.$$('.plan-list .plan-item, .plan-list-item');
    const priceEl = await page.$('.plan-price .price, .plan-price-num');
    let price: number | undefined;

    if (priceEl) {
      const priceText = await priceEl.textContent();
      const match = priceText?.replace(/[,¥￥]/g, '').match(/\d+/);
      if (match) price = parseInt(match[0], 10);
    }

    return {
      available: plans.length > 0,
      price,
      rooms: plans.length,
      checkedAt: new Date(),
    };
  }

  private async checkHitou(
    page: Page,
    url: string,
    checkIn: string,
    checkOut: string,
    guests: number
  ): Promise<AvailabilityResult> {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    try {
      await page.waitForSelector('.reserve-btn, .full-text', { timeout: 10000 });
    } catch {
      // continue
    }

    const fullText = await page.$('.full-text, .満室');
    if (fullText) {
      return { available: false, checkedAt: new Date() };
    }

    const reserveBtn = await page.$('.reserve-btn:not([disabled]), .btn-reserve');
    const priceEl = await page.$('.price-num, .plan-price');
    let price: number | undefined;

    if (priceEl) {
      const priceText = await priceEl.textContent();
      const match = priceText?.replace(/[,¥￥]/g, '').match(/\d+/);
      if (match) price = parseInt(match[0], 10);
    }

    return {
      available: !!reserveBtn,
      price,
      checkedAt: new Date(),
    };
  }

  async checkWithFallback(
    url: string,
    primarySite: BookingSite,
    checkIn: string,
    checkOut: string,
    guests: number,
    fallbackSites: BookingSite[] = ['jalan', 'rakuten']
  ): Promise<AvailabilityResult & { site: BookingSite }> {
    const result = await this.checkAvailability(url, primarySite, checkIn, checkOut, guests);

    if (!result.error) {
      return { ...result, site: primarySite };
    }

    // Try fallback sites
    for (const fallbackSite of fallbackSites) {
      if (fallbackSite === primarySite) continue;
      const fallbackResult = await this.checkAvailability(url, fallbackSite, checkIn, checkOut, guests);
      if (!fallbackResult.error) {
        return { ...fallbackResult, site: fallbackSite };
      }
    }

    return { ...result, site: primarySite };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
