'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home } from 'lucide-react';

export default function HomeButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/') return null;

  return (
    <button
      onClick={() => router.push('/')}
      aria-label="홈으로 이동"
      className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
    >
      <Home size={18} />
    </button>
  );
}
