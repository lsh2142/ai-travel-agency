'use client'

import type { SortOption } from '@/lib/flights/sort-flights'

export type TimeFilter = 'all' | 'morning' | 'afternoon' | 'evening'
export type ClassFilter = 'economy' | 'business'
export type TripType = 'roundtrip' | 'oneway'

export interface FlightFilterState {
  tripType: TripType
  timeFilter: TimeFilter
  classFilter: ClassFilter
  sortBy: SortOption
}

interface FlightFilterProps {
  filter: FlightFilterState
  onChange: (next: FlightFilterState) => void
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-blue-600 text-white'
          : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
      }`}
    >
      {children}
    </button>
  )
}

export function FlightFilter({ filter, onChange }: FlightFilterProps) {
  function set<K extends keyof FlightFilterState>(key: K, value: FlightFilterState[K]) {
    onChange({ ...filter, [key]: value })
  }

  return (
    <div className="space-y-2 py-2">
      {/* 왕복 / 편도 */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        <Chip active={filter.tripType === 'roundtrip'} onClick={() => set('tripType', 'roundtrip')}>
          왕복 {filter.tripType === 'roundtrip' && '●'}
        </Chip>
        <Chip active={filter.tripType === 'oneway'} onClick={() => set('tripType', 'oneway')}>
          편도
        </Chip>
      </div>

      {/* 시간대 */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        <span className="flex-none text-xs text-zinc-500 self-center">시간대</span>
        <Chip active={filter.timeFilter === 'all'} onClick={() => set('timeFilter', 'all')}>전체 ✓</Chip>
        <Chip active={filter.timeFilter === 'morning'} onClick={() => set('timeFilter', 'morning')}>오전 6-12</Chip>
        <Chip active={filter.timeFilter === 'afternoon'} onClick={() => set('timeFilter', 'afternoon')}>오후 12-18</Chip>
        <Chip active={filter.timeFilter === 'evening'} onClick={() => set('timeFilter', 'evening')}>저녁 18-24</Chip>
      </div>

      {/* 좌석 등급 */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        <span className="flex-none text-xs text-zinc-500 self-center">등급</span>
        <Chip active={filter.classFilter === 'economy'} onClick={() => set('classFilter', 'economy')}>이코노미 ✓</Chip>
        <Chip active={filter.classFilter === 'business'} onClick={() => set('classFilter', 'business')}>비즈니스</Chip>
      </div>

      {/* 정렬 */}
      <div className="flex items-center gap-2">
        <span className="flex-none text-xs text-zinc-500">정렬</span>
        <select
          value={filter.sortBy}
          onChange={(e) => set('sortBy', e.target.value as SortOption)}
          className="text-xs border border-zinc-300 rounded-lg px-2 py-1.5 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="price">최저가 ↑</option>
          <option value="departure">출발시간</option>
          <option value="duration">비행시간</option>
        </select>
      </div>
    </div>
  )
}
