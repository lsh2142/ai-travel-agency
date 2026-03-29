'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/types';
import type { FlightResult, FlightSearchParams } from '@/lib/flights/types';
import { supabase } from '@/lib/db/supabase';
import { getItineraries, createItinerary, addItemToItinerary } from '@/lib/itinerary/store';
import { MONITOR_JOBS_KEY, type MonitorJob } from '@/lib/monitor/types';
import ItineraryTab from '@/components/ItineraryTab';
import MonitoringTab from '@/components/MonitoringTab';

export { MONITOR_JOBS_KEY };
export type { MonitorJob };

interface MonitorForm {
  accommodationName: string;
  url: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  telegramId: string;
}

const EMPTY_FORM: MonitorForm = {
  accommodationName: '',
  url: '',
  checkIn: '',
  checkOut: '',
  guests: '2',
  telegramId: '',
};

const PROGRESS_STEPS = [
  '여행 조건 분석 중...',
  '항공편 검색 중...',
  '숙소 검색 중...',
  '일정 생성 중...',
];

const STORAGE_KEY = 'travel_chat_messages';

const QUICK_ACTIONS = [
  { icon: '✈️', label: '항공편 더 보기', msg: '항공편 옵션을 더 자세히 보여줘' },
  { icon: '🏨', label: '숙소 추천', msg: '숙소를 더 자세히 추천해줘' },
  { icon: '📅', label: '상세 일정', msg: '일정을 더 자세하게 만들어줘' },
  { icon: '💡', label: '여행 팁', msg: '이 여행에서 유용한 팁을 알려줘' },
  { icon: '💰', label: '예산 정리', msg: '예상 여행 예산을 정리해줘' },
] as const;

const CONCEPTS = [
  { emoji: '🏯', label: '문화탐방' },
  { emoji: '🍜', label: '미식여행' },
  { emoji: '♨️', label: '온천·힐링' },
  { emoji: '🏄', label: '액티비티' },
  { emoji: '🛍', label: '쇼핑' },
  { emoji: '🌿', label: '자연·힐링' },
  { emoji: '👫', label: '커플여행' },
  { emoji: '👨‍👩‍👧', label: '가족여행' },
  { emoji: '🧳', label: '혼자여행' },
  { emoji: '💰', label: '알뜰여행' },
  { emoji: '💎', label: '프리미엄' },
];

type ActiveTab = 'chat' | 'itinerary' | 'monitoring';

function parseMessageContent(content: string): { text: string; options: string[]; flightParams: FlightSearchParams | null } {
  let text = content;
  const options: string[] = [];
  let flightParams: FlightSearchParams | null = null;

  const optionsMatch = text.match(/\[OPTIONS:\s*([^\]]+)\]/);
  if (optionsMatch) {
    options.push(...optionsMatch[1].split('|').map((s) => s.trim()).filter(Boolean));
    text = text.replace(optionsMatch[0], '').trim();
  }

  const flightMatch = text.match(/\[FLIGHTS_SEARCH:\s*(\{[^}]+\})\]/);
  if (flightMatch) {
    try {
      flightParams = JSON.parse(flightMatch[1]) as FlightSearchParams;
    } catch {
      // 파싱 실패 시 무시
    }
    text = text.replace(flightMatch[0], '').trim();
  }

  return { text, options, flightParams };
}

function FlightCard({
  flight,
  onAddToItinerary,
  added,
}: {
  flight: FlightResult;
  onAddToItinerary: () => void;
  added: boolean;
}) {
  const depTime = flight.departureTime.split(' ')[1] ?? flight.departureTime;
  const arrTime = flight.arrivalTime.split(' ')[1] ?? flight.arrivalTime;
  const priceFormatted = new Intl.NumberFormat('ko-KR').format(flight.price);
  const stopLabel = flight.stops === 0 ? '직항' : `경유 ${flight.stops}회`;

  return (
    <div className="border border-zinc-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-800">✈ {flight.airline}</span>
          <span className="text-xs text-zinc-400 font-mono">{flight.flightNumber}</span>
          <span className="text-xs bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">{stopLabel}</span>
        </div>
        <span className="text-base font-bold text-blue-600">₩{priceFormatted}</span>
      </div>
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="text-center">
          <div className="text-lg font-bold text-zinc-900">{depTime}</div>
          <div className="text-xs text-zinc-500 font-mono">{flight.origin}</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <div className="text-xs text-zinc-400">{flight.duration}</div>
          <div className="w-full flex items-center gap-1">
            <div className="h-px flex-1 bg-zinc-300" />
            <div className="text-zinc-300 text-xs">›</div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-zinc-900">{arrTime}</div>
          <div className="text-xs text-zinc-500 font-mono">{flight.destination}</div>
        </div>
      </div>
      <div className="px-4 pb-3 flex items-center gap-2 justify-end">
        {added ? (
          <>
            <span className="text-xs text-emerald-600 font-medium">✅ 일정 추가됨</span>
            {flight.bookingUrl && (
              <a
                href={flight.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-500 text-white rounded-lg px-3 py-1.5 hover:bg-blue-600 transition-colors"
              >
                지금 예약하기 →
              </a>
            )}
          </>
        ) : (
          <>
            {flight.bookingUrl && (
              <a
                href={flight.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs border border-zinc-200 text-zinc-600 rounded-lg px-3 py-1.5 hover:bg-zinc-50 transition-colors"
              >
                예약하기
              </a>
            )}
            <button
              onClick={onAddToItinerary}
              className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors"
            >
              ✈ 일정에 추가
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  // 로그인 여부 확인 후 미인증 시 /auth로 리다이렉트
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/auth');
    });
  }, [router]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }>;
          return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      } catch { /* 무시 */ }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [monitorForm, setMonitorForm] = useState<MonitorForm>(EMPTY_FORM);
  const [monitorSubmitting, setMonitorSubmitting] = useState(false);
  const [flightResults, setFlightResults] = useState<Record<number, FlightResult[]>>({});
  const [flightLoading, setFlightLoading] = useState<Record<number, boolean>>({});
  const [addedFlights, setAddedFlights] = useState<Set<string>>(new Set());
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [pendingDates, setPendingDates] = useState<{ depart: string; return: string }>({ depart: '', return: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [suggestedAccommodations, setSuggestedAccommodations] = useState<Array<{ name: string; url?: string; checkIn?: string; checkOut?: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/auth');
  }, [router]);

  // messages 변경 시 localStorage 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch { /* 무시 */ }
  }, [messages]);

  // 일정 탭 전환 시 pending count 갱신
  useEffect(() => {
    const all = getItineraries();
    const count = all.flatMap((t) => t.items).filter((i) => i.bookingStatus === 'planned').length;
    setPendingCount(count);
  }, [activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, progressStep]);

  useEffect(() => {
    if (!isLoading || isStreamingRef.current) {
      if (!isLoading) setProgressStep(null);
      return;
    }
    let i = 0;
    setProgressStep(PROGRESS_STEPS[0]);
    const interval = setInterval(() => {
      i = (i + 1) % PROGRESS_STEPS.length;
      setProgressStep(PROGRESS_STEPS[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleClearMessages = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* 무시 */ }
  }, []);

  const toggleConcept = useCallback((label: string) => {
    setSelectedConcepts((prev) => {
      if (prev.includes(label)) return prev.filter((c) => c !== label);
      if (prev.length >= 3) return prev;
      return [...prev, label];
    });
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: ChatMessage = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    isStreamingRef.current = false;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userMessage: text.trim() }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json() as { error?: string };
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `오류가 발생했습니다: ${data.error ?? '알 수 없는 오류'}`, timestamp: new Date() },
        ]);
        return;
      }

      isStreamingRef.current = true;
      setProgressStep(null);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', timestamp: new Date() },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '네트워크 오류가 발생했습니다. 다시 시도해주세요.', timestamp: new Date() },
      ]);
    } finally {
      isStreamingRef.current = false;
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  useEffect(() => {
    if (isLoading) return;
    const lastIdx = messages.length - 1;
    const last = messages[lastIdx];
    if (!last || last.role !== 'assistant') return;
    if (flightResults[lastIdx] !== undefined || flightLoading[lastIdx]) return;

    const { flightParams } = parseMessageContent(last.content);
    if (!flightParams) return;

    setFlightLoading((prev) => ({ ...prev, [lastIdx]: true }));
    fetch('/api/flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flightParams),
    })
      .then((res) => res.json() as Promise<{ flights?: FlightResult[]; error?: string }>)
      .then((data) => {
        setFlightResults((prev) => ({ ...prev, [lastIdx]: data.flights ?? [] }));
      })
      .catch((err) => {
        console.error('Flight search error:', err);
        setFlightResults((prev) => ({ ...prev, [lastIdx]: [] }));
      })
      .finally(() => {
        setFlightLoading((prev) => ({ ...prev, [lastIdx]: false }));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // AI 응답 완료 후 날짜 필요 여부 감지 + 숙소명 추출
  useEffect(() => {
    if (isLoading) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content) return;
    const content = lastMsg.content;

    // 날짜 피커 트리거
    const needsDate =
      (content.includes('[FLIGHTS_SEARCH:') && !/departureDate/.test(content)) ||
      /날짜.{0,10}(알려주|입력해|있으시면|알아야|필요)/.test(content);
    if (needsDate) setShowDatePicker(true);

    // 숙소명 추출: [ACCOMMODATION:{...}] 마크업 우선, 없으면 텍스트 패턴
    const extracted: Array<{ name: string; url?: string }> = [];
    const markupMatches = content.match(/\[ACCOMMODATION:\s*(\{[^}]+\})\]/g) ?? [];
    for (const m of markupMatches) {
      try {
        const json = m.replace(/^\[ACCOMMODATION:\s*/, '').replace(/\]$/, '');
        extracted.push(JSON.parse(json) as { name: string; url?: string });
      } catch { /* 무시 */ }
    }
    if (extracted.length === 0) {
      const textMatches = content.match(/(?:호텔|료칸|旅館|inn|hotel|resort)[^\n,。！!?]{1,25}/gi) ?? [];
      for (const m of textMatches) {
        const name = m.trim();
        if (name.length >= 4) extracted.push({ name });
      }
    }
    if (extracted.length > 0) {
      setSuggestedAccommodations(extracted.slice(0, 3));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleSubmit = useCallback(() => {
    sendMessage(input);
  }, [input, sendMessage]);

  const openMonitorModal = useCallback(() => {
    setMonitorForm(EMPTY_FORM);
    setMonitorOpen(true);
  }, []);

  const handleAddFlightToItinerary = useCallback((flight: FlightResult, key: string) => {
    const itineraries = getItineraries();
    const flightDate = flight.departureTime.split(' ')[0] ?? new Date().toISOString().split('T')[0];
    let itineraryId: string;
    if (itineraries.length === 0) {
      const created = createItinerary({
        title: `${flight.origin} → ${flight.destination}`,
        startDate: flightDate,
        endDate: flightDate,
        items: [],
      });
      itineraryId = created.id;
    } else {
      itineraryId = itineraries[itineraries.length - 1].id;
    }
    addItemToItinerary(itineraryId, {
      type: 'flight',
      date: flightDate,
      title: `${flight.airline} ${flight.flightNumber}`,
      description: `${flight.origin} → ${flight.destination}  ${flight.departureTime.split(' ')[1] ?? ''} ~ ${flight.arrivalTime.split(' ')[1] ?? ''}`,
      bookingStatus: 'planned',
      bookingUrl: flight.bookingUrl,
      price: flight.price,
      currency: flight.currency,
      flightData: flight,
    });
    setAddedFlights((prev) => new Set(prev).add(key));
  }, []);

  const handleMonitorSubmit = useCallback(async () => {
    const { accommodationName, url, checkIn, checkOut, guests, telegramId } = monitorForm;
    if (!accommodationName || !checkIn || !checkOut) return;
    setMonitorSubmitting(true);
    try {
      const siteMap: Record<string, string> = { jalan: 'jalan', rakuten: 'rakuten', hitou: 'hitou' };
      const detectedSite = Object.keys(siteMap).find((k) => url.includes(k)) ?? 'jalan';
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accommodationId: crypto.randomUUID(),
          accommodationName,
          url: url || `https://www.jalan.net/`,
          site: detectedSite,
          checkIn,
          checkOut,
          guests: Number(guests) || 2,
          userId: telegramId,
        }),
      });
      const data = await res.json() as { success?: boolean; jobId?: string; error?: string };
      setMonitorOpen(false);
      if (data.success && data.jobId) {
        const job: MonitorJob = {
          jobId: data.jobId,
          accommodationName,
          url: url || 'https://www.jalan.net/',
          checkIn,
          checkOut,
          guests: Number(guests) || 2,
          telegramId,
          registeredAt: new Date().toISOString(),
        };
        try {
          const existing = JSON.parse(localStorage.getItem(MONITOR_JOBS_KEY) ?? '[]') as MonitorJob[];
          localStorage.setItem(MONITOR_JOBS_KEY, JSON.stringify([...existing, job]));
        } catch { /* 무시 */ }
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.success
            ? `✅ 모니터링이 등록됐어요! **${accommodationName}** (${checkIn} ~ ${checkOut}, ${guests}명)\n빈방 발생 시 텔레그램으로 알림을 보내드립니다.`
            : `❌ 등록 실패: ${data.error ?? '알 수 없는 오류'}`,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMonitorOpen(false);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ 모니터링 등록 중 오류가 발생했습니다.', timestamp: new Date() },
      ]);
    } finally {
      setMonitorSubmitting(false);
    }
  }, [monitorForm]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">AI 여행 플래닝 에이전트</h1>
          <div className="flex items-center gap-2">
            {activeTab === 'chat' && (
              <button
                onClick={handleClearMessages}
                disabled={isLoading || messages.length === 0}
                className="text-sm text-gray-400 hover:text-red-500 disabled:opacity-30 border border-gray-200 rounded-lg px-3 py-1 transition-colors"
              >
                대화 초기화
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
        <nav className="flex px-6 gap-1 border-t border-gray-100">
          <button
            onClick={() => setActiveTab('chat')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'font-medium text-blue-600 border-blue-500'
                : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-gray-300'
            }`}
          >
            💬 채팅
          </button>
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === 'itinerary'
                ? 'font-medium text-blue-600 border-blue-500'
                : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-gray-300'
            }`}
          >
            🗓 일정
            {pendingCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs bg-amber-400 text-white rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === 'monitoring'
                ? 'font-medium text-blue-600 border-blue-500'
                : 'text-gray-500 hover:text-gray-800 border-transparent hover:border-gray-300'
            }`}
          >
            🔔 모니터링
          </button>
        </nav>
      </header>

      {/* 채팅 탭 */}
      <div className={`flex flex-col flex-1 overflow-hidden ${activeTab !== 'chat' ? 'hidden' : ''}`}>
        <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center mt-16 px-4">
              <p className="text-3xl mb-3">✈️</p>
              <p className="text-lg font-medium text-gray-700">어떤 여행을 원하시나요?</p>
              <p className="text-sm text-gray-400 mt-1 mb-6">여행 컨셉을 선택하면 맞춤 계획을 세워드려요 (최대 3개)</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto mb-6">
                {CONCEPTS.map(({ emoji, label }) => {
                  const isSelected = selectedConcepts.includes(label);
                  const isDisabled = !isSelected && selectedConcepts.length >= 3;
                  return (
                    <button
                      key={label}
                      onClick={() => toggleConcept(label)}
                      disabled={isDisabled}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : isDisabled
                          ? 'bg-zinc-100 border-zinc-200 text-zinc-400 opacity-40 cursor-not-allowed'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedConcepts.length > 0 && (
                <button
                  onClick={() => {
                    sendMessage(`${selectedConcepts.join(', ')} 스타일로 여행 계획해줘`);
                    setSelectedConcepts([]);
                  }}
                  disabled={isLoading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  이 컨셉으로 여행 시작 →
                </button>
              )}
              {selectedConcepts.length === 0 && (
                <p className="text-xs text-zinc-400">또는 아래 입력창에 직접 목적지를 입력하세요</p>
              )}
            </div>
          )}

          {messages.map((msg, idx) => {
            if (msg.role === 'user') {
              return (
                <div key={idx} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-blue-500 text-white shadow-sm">
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              );
            }

            const { text, options, flightParams } = parseMessageContent(msg.content);
            const msgFlights = flightResults[idx];
            const msgFlightLoading = flightLoading[idx];
            return (
              <div key={idx} className="flex flex-col items-start gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span>🤖</span>
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white border border-gray-200 text-gray-800 shadow-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3">
                            <table className="w-full border-collapse text-sm">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-zinc-100 text-zinc-700">{children}</thead>
                        ),
                        th: ({ children }) => (
                          <th className="border border-zinc-300 px-3 py-2 text-left font-medium">{children}</th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-zinc-200 px-3 py-2">{children}</td>
                        ),
                        tr: ({ children }) => (
                          <tr className="even:bg-zinc-50">{children}</tr>
                        ),
                        code: ({ children, className }) => {
                          const isBlock = className?.includes('language-');
                          return isBlock ? (
                            <pre className="bg-zinc-100 rounded p-3 overflow-x-auto text-xs my-2">
                              <code>{children}</code>
                            </pre>
                          ) : (
                            <code className="bg-zinc-100 rounded px-1 text-xs">{children}</code>
                          );
                        },
                        p: ({ children }) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-sm">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-sm">{children}</ol>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      }}
                    >
                      {text}
                    </ReactMarkdown>
                    {showDatePicker && idx === messages.length - 1 && (
                      <div className="mt-3 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                        <p className="text-xs text-zinc-500 mb-3">✈️ 출발일과 귀국일을 선택하면 항공편을 검색할게요</p>
                        <div className="flex gap-3 flex-wrap items-end">
                          <div className="flex-1 min-w-[130px]">
                            <label className="text-xs text-zinc-500 mb-1 block">출발일</label>
                            <input
                              type="date"
                              value={pendingDates.depart}
                              onChange={(e) => setPendingDates((p) => ({ ...p, depart: e.target.value }))}
                              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1 min-w-[130px]">
                            <label className="text-xs text-zinc-500 mb-1 block">귀국일</label>
                            <input
                              type="date"
                              value={pendingDates.return}
                              onChange={(e) => setPendingDates((p) => ({ ...p, return: e.target.value }))}
                              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (pendingDates.depart) {
                                sendMessage(`출발일 ${pendingDates.depart}, 귀국일 ${pendingDates.return || '미정'}으로 항공편과 숙소를 찾아줘`);
                                setShowDatePicker(false);
                              }
                            }}
                            disabled={!pendingDates.depart || isLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-lg text-sm transition-colors"
                          >
                            검색하기
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={openMonitorModal}
                        disabled={isLoading}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
                      >
                        🔔 빈방 모니터링 등록
                      </button>
                    </div>
                  </div>
                </div>
                {flightParams && (msgFlightLoading || msgFlights) && (
                  <div className="pl-10 w-full max-w-2xl">
                    <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                      ✈️ 항공편 검색 결과
                      <span className="text-gray-400">
                        ({flightParams.origin} → {flightParams.destination}, {flightParams.departureDate})
                      </span>
                    </div>
                    {msgFlightLoading ? (
                      <div className="text-sm text-gray-400 py-2">항공편 검색 중...</div>
                    ) : msgFlights && msgFlights.length > 0 ? (
                      <div className="space-y-2">
                        {msgFlights.map((flight, fi) => {
                          const flightKey = `${idx}-${flight.flightNumber}`;
                          return (
                            <FlightCard
                              key={fi}
                              flight={flight}
                              added={addedFlights.has(flightKey)}
                              onAddToItinerary={() => handleAddFlightToItinerary(flight, flightKey)}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 py-2">검색 결과가 없습니다.</div>
                    )}
                  </div>
                )}
                {options.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-10">
                    {options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => sendMessage(opt)}
                        disabled={isLoading}
                        className="rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100 hover:border-blue-400 disabled:opacity-50 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && !isStreamingRef.current && (
            <div className="flex justify-start pl-10">
              <div className="bg-white border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-sm text-zinc-600">{progressStep ?? '처리 중...'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {PROGRESS_STEPS.map((step, i) => {
                    const currentIdx = progressStep ? PROGRESS_STEPS.indexOf(progressStep) : 0;
                    return (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-500 ${
                          i <= currentIdx ? 'bg-blue-500 flex-[2]' : 'bg-zinc-200 flex-1'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        <footer className="bg-white border-t px-4 py-4">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
          {messages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_ACTIONS.map(({ icon, label, msg }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(msg)}
                  disabled={isLoading}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-sm text-zinc-600 hover:text-zinc-900 transition-colors border border-zinc-200 hover:border-zinc-300 disabled:opacity-40"
                >
                  <span>{icon}</span>
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="여행 조건을 입력하세요... (Enter로 전송)"
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
              rows={2}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="bg-blue-500 text-white px-6 rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              전송
            </button>
          </div>
          </div>
        </footer>
      </div>

      {/* 일정 탭 */}
      <div className={`flex-1 overflow-y-auto bg-zinc-50 ${activeTab !== 'itinerary' ? 'hidden' : ''}`}>
        <ItineraryTab onTabSwitch={setActiveTab} />
      </div>

      {/* 모니터링 탭 */}
      <div className={`flex-1 overflow-y-auto bg-zinc-50 ${activeTab !== 'monitoring' ? 'hidden' : ''}`}>
        <MonitoringTab
          onTabSwitch={setActiveTab}
          suggestedAccommodations={suggestedAccommodations}
          pendingDates={pendingDates}
        />
      </div>

      {/* 모니터링 등록 모달 */}
      {monitorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🔔 빈방 모니터링 등록</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">호텔명 *</label>
                <input
                  type="text"
                  value={monitorForm.accommodationName}
                  onChange={(e) => setMonitorForm((f) => ({ ...f, accommodationName: e.target.value }))}
                  placeholder="예: 료칸 하나노유"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">예약 사이트 URL (선택)</label>
                <input
                  type="url"
                  value={monitorForm.url}
                  onChange={(e) => setMonitorForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://www.jalan.net/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">체크인 *</label>
                  <input
                    type="date"
                    value={monitorForm.checkIn}
                    onChange={(e) => setMonitorForm((f) => ({ ...f, checkIn: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">체크아웃 *</label>
                  <input
                    type="date"
                    value={monitorForm.checkOut}
                    onChange={(e) => setMonitorForm((f) => ({ ...f, checkOut: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">인원 수</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={monitorForm.guests}
                  onChange={(e) => setMonitorForm((f) => ({ ...f, guests: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">텔레그램 채팅 ID</label>
                <input
                  type="text"
                  value={monitorForm.telegramId}
                  onChange={(e) => setMonitorForm((f) => ({ ...f, telegramId: e.target.value }))}
                  placeholder="예: 123456789"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setMonitorOpen(false)}
                disabled={monitorSubmitting}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleMonitorSubmit}
                disabled={monitorSubmitting || !monitorForm.accommodationName || !monitorForm.checkIn || !monitorForm.checkOut}
                className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {monitorSubmitting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
