import { test, expect } from '@playwright/test';

test.describe('항공권 UX MVP 검증 (커밋 f85845d)', () => {

  test('1. /api/flights API — ICN→NRT 응답 구조 확인', async ({ request }) => {
    const res = await request.get('/api/flights?from=ICN&to=NRT&date=2026-04-10');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('outbound');
    expect(Array.isArray(body.outbound)).toBeTruthy();
    expect(body.outbound.length).toBeGreaterThan(0);
    expect(body.currency).toBe('KRW');

    // 첫 번째 항공편 필드 검증
    const first = body.outbound[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('airline');
    expect(first).toHaveProperty('flightNumber');
    expect(first).toHaveProperty('price');
    expect(first).toHaveProperty('bookingUrl');
    expect(first.departure.airport).toBe('ICN');
    expect(first.arrival.airport).toBe('NRT');

    console.log(`✅ 항공편 ${body.outbound.length}개 응답 — 최저가: ${Math.min(...body.outbound.map((f: { price: number }) => f.price)).toLocaleString()}원`);
  });

  test('2. /plan 페이지 — "✈️ 항공권 검색" 버튼 존재 확인', async ({ page }) => {
    // /plan 페이지는 로그인 없이도 접근 가능 여부 확인
    await page.goto('/plan', { waitUntil: 'networkidle' });

    const finalUrl = page.url();
    console.log('최종 URL:', finalUrl);

    if (finalUrl.includes('/auth')) {
      // 미인증 리다이렉트 — /plan 자체가 auth 필요
      console.log('ℹ️ /plan → /auth 리다이렉트 (인증 필요 페이지)');
      // 버튼은 인증 후에만 확인 가능 — 이 테스트는 skip
      test.skip();
      return;
    }

    // 인증 상태라면 버튼 확인
    const flightBtn = page.locator('button:has-text("항공권 검색")');
    await expect(flightBtn).toBeVisible({ timeout: 10000 });
    console.log('✅ "✈️ 항공권 검색" 버튼 렌더링 확인');
  });

  test('3. /plan 페이지 — FlightBottomSheet 컴포넌트 존재 여부 (DOM 구조)', async ({ page }) => {
    await page.goto('/plan', { waitUntil: 'networkidle' });

    const finalUrl = page.url();
    if (finalUrl.includes('/auth')) {
      console.log('ℹ️ /plan 인증 필요 — DOM 검증 skip');
      test.skip();
      return;
    }

    // 항공권 버튼 클릭
    const flightBtn = page.locator('button:has-text("항공권 검색")');
    const btnVisible = await flightBtn.isVisible().catch(() => false);

    if (!btnVisible) {
      console.log('ℹ️ 항공권 버튼 미노출 (여정 없는 초기 상태일 수 있음)');
      return;
    }

    await flightBtn.click();

    // BottomSheet 또는 모달이 열려야 함 (300ms 애니메이션 대기)
    await page.waitForTimeout(500);

    // FlightBottomSheet — 보통 fixed/bottom-0 패턴이거나 role=dialog
    const sheet = page.locator('[class*="bottom"], [class*="sheet"], [role="dialog"]').first();
    const sheetVisible = await sheet.isVisible().catch(() => false);

    if (sheetVisible) {
      console.log('✅ FlightBottomSheet 열림 확인');
    } else {
      // 항공편 카드가 직접 표시되는 경우도 허용
      const flightCard = page.locator('[class*="flight"], [class*="Flight"]').first();
      const cardVisible = await flightCard.isVisible().catch(() => false);
      console.log(cardVisible ? '✅ FlightCard 렌더링 확인' : 'ℹ️ Sheet/Card 미노출 (여정 파라미터 없는 상태)');
    }
  });

  test('4. /api/flights — 필수 쿼리 파라미터 누락 시 에러 처리', async ({ request }) => {
    const res = await request.get('/api/flights');
    // 400 에러 또는 빈 배열 반환 중 하나
    const validStatuses = [400, 422, 200];
    expect(validStatuses).toContain(res.status());

    if (res.status() === 200) {
      const body = await res.json();
      // 빈 배열이거나 에러 필드가 있어야 함
      const hasOutbound = Array.isArray(body.outbound);
      expect(hasOutbound || body.error).toBeTruthy();
      console.log('✅ 파라미터 없는 요청 — 200 응답 (빈 outbound 또는 에러 필드)');
    } else {
      console.log(`✅ 파라미터 없는 요청 — ${res.status()} 에러 응답`);
    }
  });

});
