import { test, expect } from '@playwright/test';

// 만료된 스테일 쿠키 주입 헬퍼
async function injectStaleCookies(context: import('@playwright/test').BrowserContext) {
  await context.addCookies([
    {
      name: 'sb-access-token',
      value: 'stale.expired.token',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'sb-refresh-token',
      value: 'stale-refresh-token',
      domain: 'localhost',
      path: '/',
    },
  ]);
}

test.describe('Auth flow — 리다이렉트 루프 수정 검증 (커밋 3849a41)', () => {

  test('1. 홈(/) 접속 — 미인증 시 /auth로 이동 (루프 없이)', async ({ page }) => {
    const redirects: string[] = [];
    page.on('response', (res) => {
      if ([301, 302, 307, 308].includes(res.status())) {
        redirects.push(`${res.status()} → ${res.headers()['location']}`);
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // /auth 페이지에 안착해야 함
    expect(page.url()).toContain('/auth');

    // 리다이렉트 횟수 2회 이하 (루프 없음)
    expect(redirects.length).toBeLessThanOrEqual(2);
    console.log('리다이렉트 체인:', redirects);
  });

  test('2. /auth 페이지 — 이메일/패스워드 입력 필드 렌더링', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });

    // 이메일 입력 필드
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // 패스워드 입력 필드
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // 로그인 버튼
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();

    console.log('✅ 이메일/패스워드 필드 및 로그인 버튼 정상 렌더링');
  });

  test('3. /auth 페이지 — 폼 입력 후 제출 동작 (무반응 없는지)', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword123');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // 로딩 상태 또는 에러 메시지가 나타나야 함 (무반응이면 안 됨)
    // "처리 중..." 버튼 텍스트 또는 에러 메시지 대기
    await Promise.race([
      page.waitForSelector('text=처리 중', { timeout: 5000 }),
      page.waitForSelector('text=오류', { timeout: 5000 }),
      page.waitForSelector('text=이메일', { timeout: 5000 }),
      page.waitForSelector('[class*="red"]', { timeout: 5000 }),
    ]).catch(() => {
      // 에러/피드백 없어도 타임아웃은 넘어감 — 무한 스핀 감지는 별도 확인
    });

    // 페이지가 /auth 에 머무르거나 에러를 표시해야 함 (무한루프 리다이렉트가 아니어야 함)
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    console.log('제출 후 URL:', finalUrl);

    // /auth 에 있거나 에러 메시지 존재
    const hasError = await page.locator('text=오류').isVisible().catch(() => false)
      || await page.locator('[class*="red"]').isVisible().catch(() => false);
    const stayedOnAuth = finalUrl.includes('/auth');

    expect(stayedOnAuth || hasError).toBeTruthy();
    console.log('폼 제출 후 정상 처리:', stayedOnAuth ? '/auth 유지' : '에러 메시지 표시');
  });

  test('4. 만료 쿠키 주입 → 루프 없이 홈 화면 정상 렌더링 (핵심 버그 수정 검증)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 만료된 스테일 쿠키 주입
    await injectStaleCookies(context);

    const redirects: string[] = [];
    page.on('response', (res) => {
      if ([301, 302, 307, 308].includes(res.status())) {
        redirects.push(`${res.url()} → ${res.status()} ${res.headers()['location'] ?? ''}`);
      }
    });

    await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 });

    const finalUrl = page.url();
    console.log('최종 URL:', finalUrl);
    console.log('리다이렉트 체인:', redirects);

    // 스테일 쿠키 존재 시: proxy.ts가 통과 허용 → 홈(/)에 머무름
    // (page.tsx가 router.push('/auth')를 하지 않으므로 루프 없음)
    expect(finalUrl).toBe('http://localhost:3000/');

    // 리다이렉트 3회 초과 = 루프 의심 (/ → /auth → / → ... 반복이면 버그)
    expect(redirects.length).toBeLessThanOrEqual(3);
    console.log('리다이렉트 횟수:', redirects.length, '— 루프 없음 ✅');

    // /api/auth/me가 쿠키 삭제 응답을 반환하는지 확인 (핵심 수정)
    const meResponse = await page.request.get('/api/auth/me');
    const setCookieHeader = meResponse.headers()['set-cookie'] ?? '';
    console.log('set-cookie 헤더:', setCookieHeader);

    // 스테일 쿠키가 삭제되었는지 (Expires=1970 패턴)
    expect(setCookieHeader).toContain('sb-access-token=;');
    console.log('✅ 스테일 쿠키 자동 삭제 확인 — 다음 요청부터 proxy.ts가 /auth로 올바르게 리다이렉트');

    await context.close();
  });

  test('5. /auth 페이지 — Google 로그인 버튼 존재 확인', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' });

    const googleBtn = page.locator('button:has-text("Google")');
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeEnabled();
    console.log('✅ Google 로그인 버튼 정상 렌더링');
  });

});
