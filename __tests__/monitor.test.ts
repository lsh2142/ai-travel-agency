import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserMonitor } from '@/lib/monitor/browser';
import { parseJalanAvailability, buildJalanUrl } from '@/lib/monitor/sites/jalan';
import { parseRakutenAvailability, buildRakutenUrl } from '@/lib/monitor/sites/rakuten';
import { parseHitouAvailability, buildHitouUrl } from '@/lib/monitor/sites/hitou';

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newContext: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockResolvedValue(null),
          waitForSelector: vi.fn().mockResolvedValue(null),
          $: vi.fn().mockResolvedValue(null),
          $$: vi.fn().mockResolvedValue([]),
          setDefaultTimeout: vi.fn(),
        }),
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  },
}));

describe('BrowserMonitor', () => {
  let monitor: BrowserMonitor;
  beforeEach(() => { monitor = new BrowserMonitor({ headless: true, timeout: 5000, retries: 1 }); });

  it('should initialize with default options', () => { expect(new BrowserMonitor()).toBeDefined(); });
  it('should return error result when browser not initialized', async () => {
    const result = await monitor.checkAvailability('https://example.com', 'jalan', '2024-04-01', '2024-04-03', 2);
    expect(result.available).toBe(false);
    expect(result.error).toBeTruthy();
  });
  it('should init and close browser', async () => { await monitor.init(); await monitor.close(); });
});

describe('parseJalanAvailability', () => {
  it('should detect available rooms', () => {
    const result = parseJalanAvailability('<div class="planList"><li class="plan-item">Plan 1</li></div>￥15,000');
    expect(result.available).toBe(true);
    expect(result.price).toBe(15000);
  });
  it('should detect no vacancy', () => {
    expect(parseJalanAvailability('<div class="no-vacancy">満室</div>').available).toBe(false);
  });
  it('should return checkedAt timestamp', () => {
    expect(parseJalanAvailability('<div></div>').checkedAt).toBeInstanceOf(Date);
  });
});

describe('buildJalanUrl', () => {
  it('should build correct URL', () => {
    const url = buildJalanUrl('12345', '2024-04-01', '2024-04-03', 2);
    expect(url).toContain('jalan.net');
    expect(url).toContain('12345');
    expect(url).toContain('adultNum=2');
  });
});

describe('parseRakutenAvailability', () => {
  it('should detect available plans', () => {
    const result = parseRakutenAvailability('<div class="plan-list-item">Plan</div>¥20,000');
    expect(result.available).toBe(true);
    expect(result.price).toBe(20000);
  });
  it('should detect no plan state', () => {
    expect(parseRakutenAvailability('<div class="noplan-area">No plans available</div>').available).toBe(false);
  });
});

describe('buildRakutenUrl', () => {
  it('should build correct URL', () => {
    const url = buildRakutenUrl('67890', '2024-04-01', '2024-04-03', 2);
    expect(url).toContain('rakuten.co.jp');
    expect(url).toContain('67890');
    expect(url).toContain('f_teiin=2');
  });
});

describe('parseHitouAvailability', () => {
  it('should detect available reservation button', () => {
    const result = parseHitouAvailability('<button class="reserve-btn">予約する</button>10,000円');
    expect(result.available).toBe(true);
    expect(result.price).toBe(10000);
  });
  it('should detect full booking', () => {
    expect(parseHitouAvailability('<div class="full-text">満室</div>').available).toBe(false);
  });
});

describe('buildHitouUrl', () => {
  it('should build correct URL', () => {
    const url = buildHitouUrl('facility-123', '2024-04-01', '2024-04-03', 2);
    expect(url).toContain('hitou.or.jp');
    expect(url).toContain('facility-123');
    expect(url).toContain('guests=2');
  });
});
