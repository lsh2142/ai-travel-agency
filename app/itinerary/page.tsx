'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { TripItinerary, ItineraryItem, BookingStatus } from '@/lib/itinerary/types';
import { getItineraries, updateItemStatus, deleteItem } from '@/lib/itinerary/store';

type Filter = 'all' | 'pending' | 'booked';

const TYPE_ICON: Record<string, string> = {
  flight: '✈️',
  accommodation: '🏨',
  car_rental: '🚗',
  activity: '🎯',
};

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  planned: { label: '계획중', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  booked:  { label: '예약완료', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  confirmed: { label: '확정됨', className: 'bg-blue-50 text-blue-700 border-blue-200' },
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-0.5 ${cfg.className}`}>
      {status === 'booked' || status === 'confirmed' ? (
        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full border border-current inline-block" />
      )}
      {cfg.label}
    </span>
  );
}

function ItemCard({
  item,
  itineraryId,
  onStatusChange,
  onDelete,
}: {
  item: ItineraryItem;
  itineraryId: string;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onDelete: (id: string) => void;
}) {
  const priceFormatted = item.price
    ? new Intl.NumberFormat('ko-KR').format(item.price)
    : null;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm px-4 py-3 flex items-start gap-3">
      <span className="text-xl pt-0.5">{TYPE_ICON[item.type] ?? '📌'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <span className="text-sm font-semibold text-zinc-800">{item.title}</span>
          <StatusBadge status={item.bookingStatus} />
        </div>
        {item.description && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{item.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {priceFormatted && (
            <span className="text-xs text-zinc-600 font-medium">₩{priceFormatted}</span>
          )}
          {item.bookingReference && (
            <span className="text-xs text-zinc-500">예약번호: {item.bookingReference}</span>
          )}
          {item.bookingUrl && item.bookingStatus === 'planned' && (
            <a
              href={item.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              예약하기 →
            </a>
          )}
          {item.bookingStatus === 'planned' && (
            <button
              onClick={() => onStatusChange(item.id, 'booked')}
              className="text-xs text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded-full px-2 py-0.5 transition-colors"
            >
              예약완료로 표시
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="text-xs text-zinc-400 hover:text-red-500 ml-auto"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryPage() {
  const [itineraries, setItineraries] = useState<TripItinerary[]>([]);
  const [activeTrip, setActiveTrip] = useState<TripItinerary | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const all = getItineraries();
    setItineraries(all);
    if (all.length > 0) setActiveTrip(all[all.length - 1]);
  }, []);

  const handleStatusChange = useCallback((itemId: string, status: BookingStatus) => {
    if (!activeTrip) return;
    updateItemStatus(activeTrip.id, itemId, status);
    const all = getItineraries();
    setItineraries(all);
    setActiveTrip(all.find((t) => t.id === activeTrip.id) ?? null);
  }, [activeTrip]);

  const handleDelete = useCallback((itemId: string) => {
    if (!activeTrip) return;
    deleteItem(activeTrip.id, itemId);
    const all = getItineraries();
    setItineraries(all);
    setActiveTrip(all.find((t) => t.id === activeTrip.id) ?? null);
  }, [activeTrip]);

  // 날짜별 그룹
  const filteredItems = (activeTrip?.items ?? []).filter((item) => {
    if (filter === 'pending') return item.bookingStatus === 'planned';
    if (filter === 'booked')  return item.bookingStatus === 'booked' || item.bookingStatus === 'confirmed';
    return true;
  });

  const itemsByDate = filteredItems.reduce<Record<string, ItineraryItem[]>>((acc, item) => {
    (acc[item.date] ??= []).push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(itemsByDate).sort();

  const totalItems    = activeTrip?.items.length ?? 0;
  const bookedItems   = activeTrip?.items.filter((i) => i.bookingStatus !== 'planned').length ?? 0;
  const pendingCount  = activeTrip?.items.filter((i) => i.bookingStatus === 'planned').length ?? 0;
  const totalBudget   = activeTrip?.items.reduce((s, i) => s + (i.price ?? 0), 0) ?? 0;
  const progressPct   = totalItems > 0 ? Math.round((bookedItems / totalItems) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">AI 여행 플래닝 에이전트</h1>
          {activeTrip && (
            <span className="text-sm text-zinc-400">
              {bookedItems}/{totalItems} 예약완료
            </span>
          )}
        </div>
        <nav className="flex px-6 gap-1 border-t border-gray-100">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 transition-colors"
          >
            💬 채팅
          </Link>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-500">
            🗓 일정
            {pendingCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs bg-amber-400 text-white rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </span>
          <Link
            href="/monitors"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 transition-colors"
          >
            🔔 모니터링
          </Link>
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full">
        {!activeTrip ? (
          /* 빈 상태 */
          <div className="text-center mt-24">
            <p className="text-4xl mb-4">🗓</p>
            <p className="text-lg font-medium text-zinc-600 mb-2">등록된 여행 일정이 없어요.</p>
            <p className="text-sm text-zinc-400 mb-6">채팅에서 항공편을 찾아 일정에 추가해보세요!</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
              💬 채팅으로 이동
            </Link>
          </div>
        ) : (
          <>
            {/* 여행 개요 카드 */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm px-5 py-4 mb-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-800">{activeTrip.title}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {activeTrip.startDate} ~ {activeTrip.endDate}
                  </p>
                </div>
                {totalBudget > 0 && (
                  <span className="text-sm font-semibold text-zinc-700">
                    총 ₩{new Intl.NumberFormat('ko-KR').format(totalBudget)}
                  </span>
                )}
              </div>
              {/* 진행률 */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500 shrink-0">
                  {bookedItems}/{totalItems} 예약완료
                </span>
              </div>
            </div>

            {/* 필터 탭 */}
            <div className="flex items-center gap-2 mb-4">
              {(['all', 'pending', 'booked'] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                    filter === f
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {{ all: '전체', pending: `미예약 ${pendingCount}`, booked: '완료' }[f]}
                </button>
              ))}
            </div>

            {/* 날짜별 타임라인 */}
            {sortedDates.length === 0 ? (
              <p className="text-center text-sm text-zinc-400 py-10">해당 조건의 항목이 없어요.</p>
            ) : (
              <div className="space-y-5">
                {sortedDates.map((date) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                        📅 {new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </span>
                      <div className="flex-1 h-px bg-zinc-200" />
                    </div>
                    <div className="space-y-2">
                      {itemsByDate[date].map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          itineraryId={activeTrip.id}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
