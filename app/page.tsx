'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { TravelParams, TripPlan } from '@/lib/types/travel'

const THEMES = [
  { emoji: '🏯', label: '문화탐방' },
  { emoji: '🍜', label: '미식여행' },
  { emoji: '♨️', label: '온천·힐링' },
  { emoji: '🏄', label: '액티비티' },
  { emoji: '🛍', label: '쇼핑' },
  { emoji: '🌿', label: '자연경관' },
  { emoji: '💎', label: '럭셔리' },
  { emoji: '💰', label: '가성비' },
]

const INITIAL_PARAMS: TravelParams = {
  destination: '',
  people: 1,
  dates: null,
  themes: [],
  freeText: '',
}

interface RecentTrip {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
}

export default function HomePage() {
  const router = useRouter()
  const [params, setParams] = useState<TravelParams>(INITIAL_PARAMS)
  const [chatInput, setChatInput] = useState('')
  const [isParsingChat, setIsParsingChat] = useState(false)
  const [chatParsed, setChatParsed] = useState(false)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null) // null = loading
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([])

  const canSubmit = params.destination.trim() !== '' || chatInput.trim() !== ''

  useEffect(() => {
    // Check auth and load recent trips
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(({ user }: { user: { id: string; email: string } | null }) => {
        if (!user) {
          // 미인증 사용자: 로그인 CTA 표시 (proxy.ts가 보호된 경로 리다이렉트 담당)
          setLoggedIn(false)
          return
        }
        setLoggedIn(true)

        // Load up to 2 most recent trips from localStorage
        const stored = JSON.parse(localStorage.getItem('trips') ?? '[]') as Array<{
          id: string
          plan: TripPlan
        }>
        const recent = stored.slice(-2).reverse().map((entry) => ({
          id: entry.id,
          title: `${entry.plan.params.destination || '여행'} 일정`,
          destination: entry.plan.params.destination || '미정',
          startDate: entry.plan.params.dates?.start ?? entry.plan.createdAt.split('T')[0],
          endDate: entry.plan.params.dates?.end ?? entry.plan.createdAt.split('T')[0],
        }))
        setRecentTrips(recent)
      })
      .catch(() => {
        setLoggedIn(false)
      })
  }, [router])

  function toggleTheme(label: string) {
    setParams((prev) => {
      const has = prev.themes.includes(label)
      if (has) return { ...prev, themes: prev.themes.filter((t) => t !== label) }
      if (prev.themes.length >= 3) return prev
      return { ...prev, themes: [...prev.themes, label] }
    })
  }

  async function handleChatSend() {
    if (!chatInput.trim()) return
    setIsParsingChat(true)
    setChatParsed(false)
    try {
      const res = await fetch('/api/parse-travel-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chatInput }),
      })
      if (res.ok) {
        const parsed = (await res.json()) as TravelParams
        setParams((prev) => ({
          destination: parsed.destination || prev.destination,
          people: parsed.people || prev.people,
          dates: parsed.dates ?? prev.dates,
          themes: parsed.themes.length > 0 ? parsed.themes : prev.themes,
          freeText: chatInput,
        }))
        setChatParsed(true)
      }
    } finally {
      setIsParsingChat(false)
    }
  }

  function handleSubmit() {
    const finalParams: TravelParams = {
      ...params,
      freeText: chatInput || params.freeText,
    }
    sessionStorage.setItem('travelParams', JSON.stringify(finalParams))
    // 새 여행 시작 시 이전 플랜 캐시 초기화
    sessionStorage.removeItem('tripPlan')
    router.push('/plan')
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-zinc-900">✈️ AI 여행 플래너</span>
        {loggedIn ? (
          <a href="/trips" className="text-sm text-blue-600 hover:underline font-medium">내 여행</a>
        ) : (
          <a href="/auth" className="text-sm text-blue-600 hover:underline font-medium">로그인</a>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">어디로 떠나고 싶으세요?</h1>
          <p className="text-sm text-zinc-500">AI가 최적 일정과 예약 가이드를 만들어드립니다</p>
        </div>

        {/* My Trips Section */}
        {loggedIn !== null && (
          <div className="mb-6">
            {recentTrips.length > 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-zinc-900">내 여행</h2>
                  <button
                    type="button"
                    onClick={() => router.push('/trips')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    전체 보기 →
                  </button>
                </div>
                <div className="space-y-2">
                  {recentTrips.map((trip) => (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => router.push(`/trips/${trip.id}`)}
                      className="w-full flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 hover:border-zinc-300 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{trip.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {trip.startDate} ~ {trip.endDate}
                        </p>
                      </div>
                      <span className="text-zinc-400 text-xs">›</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : loggedIn ? (
              <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">내 여행</p>
                  <p className="text-xs text-zinc-500 mt-0.5">완성한 일정이 여기에 저장됩니다</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/trips')}
                  className="text-xs text-blue-600 hover:underline flex-none"
                >
                  보러가기 →
                </button>
              </div>
            ) : (
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">여행 기록을 저장하세요</p>
                  <p className="text-xs text-zinc-500 mt-0.5">로그인하면 일정이 자동 저장됩니다</p>
                </div>
                <a
                  href="/auth"
                  className="flex-none px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  로그인
                </a>
              </div>
            )}
          </div>
        )}

        {/* Structured Form */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">🌍 목적지</label>
            <input
              type="text"
              value={params.destination}
              onChange={(e) => setParams((p) => ({ ...p, destination: e.target.value }))}
              placeholder="예: 도쿄, 오사카, 교토"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">👥 인원</label>
              <input
                type="number"
                min={1}
                max={20}
                value={params.people}
                onChange={(e) => setParams((p) => ({ ...p, people: parseInt(e.target.value) || 1 }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>{/* spacer */}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">📅 출발일</label>
              <input
                type="date"
                value={params.dates?.start ?? ''}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    dates: { start: e.target.value, end: p.dates?.end ?? e.target.value },
                  }))
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">📅 귀국일</label>
              <input
                type="date"
                value={params.dates?.end ?? ''}
                min={params.dates?.start}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    dates: { start: p.dates?.start ?? '', end: e.target.value },
                  }))
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-2">
              🎯 여행 테마 <span className="text-zinc-400">(최대 3개)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {THEMES.map(({ emoji, label }) => {
                const selected = params.themes.includes(label)
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleTheme(label)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-blue-400'
                    }`}
                  >
                    {emoji} {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-zinc-200" />
          <span className="text-xs text-zinc-400">또는 자유롭게 말씀해 주세요</span>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        {/* Chat Input */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleChatSend()
                }
              }}
              placeholder="예: 도쿄로 3박4일 혼자 여행, 미식 위주로  (Enter로 제출)"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {chatParsed && (
            <p className="mt-2 text-xs text-emerald-600">
              입력 내용이 위 폼에 자동으로 반영됐습니다.
            </p>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isParsingChat ? '분석 중...' : '일정 만들기 →'}
        </button>

        <p className="text-center text-xs text-zinc-400 mt-3">
          목적지 또는 자유입력 중 하나만 입력해도 시작할 수 있어요
        </p>
      </main>
    </div>
  )
}
