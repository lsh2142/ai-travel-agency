import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 현재 환경의 사이트 URL을 반환합니다.
 * 우선순위: NEXT_PUBLIC_SITE_URL → NEXT_PUBLIC_VERCEL_URL → window.location.origin (클라이언트)
 *
 * 배포 환경에서 localhost:3000이 하드코딩되는 것을 방지하기 위해
 * redirectTo, 이메일 확인 링크 등 절대 URL이 필요한 곳에서 사용하세요.
 */
export function getSiteUrl(): string {
  // 1. 명시적 환경변수 (Vercel 대시보드 또는 .env.local에 직접 설정)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  // 2. Vercel 자동 주입 환경변수 (프리뷰 배포 포함)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  // 3. 클라이언트사이드 폴백
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // 4. 서버사이드 개발 환경 폴백
  return 'http://localhost:3000';
}
