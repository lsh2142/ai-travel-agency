import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import HomeButton from '@/components/HomeButton';
import UserMenu from '@/components/UserMenu';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI 여행 플래닝 에이전트',
  description: 'AI가 여행 코스를 추천하고 숙소 예약을 도와드립니다',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <header className="flex items-center px-6 py-4 border-b border-gray-200 bg-white">
          {/* flex-1로 왼쪽 영역 고정 — HomeButton null 반환 여부와 무관하게 UserMenu 우측 고정 */}
          <div className="flex-1">
            <HomeButton />
          </div>
          <UserMenu />
        </header>
        {children}
      </body>
    </html>
  );
}
