'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '@/types';

const PROGRESS_STEPS = [
  '여행 조건 분석 중...',
  '항공편 검색 중...',
  '숙소 검색 중...',
  '일정 생성 중...',
];

const STORAGE_KEY = 'travel_chat_messages';

function parseMessageContent(content: string): { text: string; options: string[] } {
  const match = content.match(/\[OPTIONS:\s*([^\]]+)\]/);
  if (!match) return { text: content, options: [] };
  const options = match[1].split('|').map((s) => s.trim()).filter(Boolean);
  const text = content.replace(match[0], '').trim();
  return { text, options };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
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

  const handleSubmit = useCallback(() => {
    sendMessage(input);
  }, [input, sendMessage]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">AI 여행 플래닝 에이전트</h1>
          <p className="text-sm text-gray-500">여행 조건을 알려주시면 최적의 코스와 숙소를 찾아드립니다</p>
        </div>
        <button
          onClick={handleClearMessages}
          disabled={isLoading || messages.length === 0}
          className="text-sm text-gray-400 hover:text-red-500 disabled:opacity-30 border border-gray-200 rounded-lg px-3 py-1 transition-colors"
        >
          대화 초기화
        </button>
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

          const { text, options } = parseMessageContent(msg.content);
          return (
            <div key={idx} className="flex flex-col items-start gap-2">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span>🤖</span>
                </div>
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white border border-gray-200 text-gray-800 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm">{text}</p>
                </div>
              </div>
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
