'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/types';
import type { FlightResult, FlightSearchParams } from '@/lib/flights/types';

export const MONITOR_JOBS_KEY = 'monitor_jobs';

export interface MonitorJob {
  jobId: string;
  accommodationName: string;
  url: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  telegramId: string;
  registeredAt: string;
}

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

function FlightCard({ flight }: { flight: FlightResult }) {
  const priceFormatted = new Intl.NumberFormat('ko-KR').format(flight.price);
  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <span>{flight.airline}</span>
            <span className="text-xs text-gray-400">{flight.flightNumber}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-bold">{flight.departureTime.split(' ')[1] ?? flight.departureTime}</span>
            <span className="text-xs text-gray-400">→</span>
            <span className="text-base font-bold">{flight.arrivalTime.split(' ')[1] ?? flight.arrivalTime}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{flight.origin} → {flight.destination}</span>
            <span>·</span>
            <span>{flight.duration}</span>
            <span>·</span>
            <span>{flight.stops === 0 ? '직항' : `경유 ${flight.stops}회`}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-blue-600">
            ₩{priceFormatted}
          </div>
          {flight.bookingUrl ? (
            <a
              href={flight.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs bg-blue-500 text-white rounded-lg px-3 py-1 hover:bg-blue-600 transition-colors"
            >
              예약하기
            </a>
          ) : (
            <span className="mt-1 inline-block text-xs bg-gray-100 text-gray-500 rounded-lg px-3 py-1">
              가격 확인
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [monitorForm, setMonitorForm] = useState<MonitorForm>(EMPTY_FORM);
  const [monitorSubmitting, setMonitorSubmitting] = useState(false);
  const [flightResults, setFlightResults] = useState<Record<number, FlightResult[]>>({});
  const [flightLoading, setFlightLoading] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

  // localStorage에서 메시지 로드 (마운트 시 1회)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }>;
        const restored: ChatMessage[] = parsed.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(restored);
      }
    } catch {
      // localStorage 접근 불가 또는 파싱 오류 시 무시
    }
  }, []);

  // messages 변경 시 localStorage 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // localStorage 저장 실패 시 무시
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, progressStep]);

  // 스트리밍 중이 아닐 때만 progress step 사이클 실행
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
    } catch {
      // 무시
    }
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

      // 스트리밍 시작 - 빈 assistant 메시지 추가 후 progressStep 숨기기
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

  // 스트리밍 완료 후 FLIGHTS_SEARCH 마커 감지 → 자동 항공권 검색
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

  const handleSubmit = useCallback(() => {
    sendMessage(input);
  }, [input, sendMessage]);

  const openMonitorModal = useCallback(() => {
    setMonitorForm(EMPTY_FORM);
    setMonitorOpen(true);
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
          <button
            onClick={handleClearMessages}
            disabled={isLoading || messages.length === 0}
            className="text-sm text-gray-400 hover:text-red-500 disabled:opacity-30 border border-gray-200 rounded-lg px-3 py-1 transition-colors"
          >
            대화 초기화
          </button>
        </div>
        <nav className="flex px-6 gap-1 border-t border-gray-100">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-500">
            💬 채팅
          </span>
          <Link
            href="/monitors"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 transition-colors"
          >
            🔔 모니터링
          </Link>
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-2xl mb-2">✈️</p>
            <p className="text-lg font-medium text-gray-500">어디로 여행을 떠나고 싶으신가요?</p>
            <p className="text-sm mt-2 mb-6">예: "다음 달 3박 4일로 교토 여행 계획 짜줘. 2명이고 예산은 50만원이야"</p>
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {[
                '🏯 교토 3박 4일 추천해줘',
                '🗼 도쿄 가족여행 코스 짜줘',
                '♨️ 홋카이도 온천 료칸 찾아줘',
                '🍜 오사카 맛집 투어 2박 3일',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
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
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white border border-gray-200 text-gray-800 shadow-sm prose prose-sm max-w-none">
                  <ReactMarkdown>{text}</ReactMarkdown>
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
              {/* 항공편 검색 결과 카드 */}
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
                      {msgFlights.map((flight, fi) => (
                        <FlightCard key={fi} flight={flight} />
                      ))}
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
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
              </div>
              {progressStep && (
                <span className="text-sm text-gray-500">{progressStep}</span>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

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

      <footer className="bg-white border-t px-4 py-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
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
      </footer>
    </div>
  );
}
