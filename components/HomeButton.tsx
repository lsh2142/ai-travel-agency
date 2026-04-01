'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home } from 'lucide-react';

export default function HomeButton() {
  const pathname = usePathname();
  const router = useRouter();

  // / 페이지에서는 스페이서만 반환 (UserMenu 우측 고정 유지)
  if (pathname === '/') {
    return <div className="w-10 h-10" />;
  }

  return (
    <button
      onClick={() => router.push('/')}
      aria-label="홈으로 이동"
      className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 shadow-md border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
    >
      <Home size={18} />
    </button>
  );
}
