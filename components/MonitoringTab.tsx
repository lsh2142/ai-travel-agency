'use client';

import { useState, useEffect, useCallback } from 'react';
import { MONITOR_JOBS_KEY, type MonitorJob } from '@/lib/monitor/types';

export default function MonitoringTab({ onTabSwitch }: { onTabSwitch: (tab: 'chat') => void }) {
  const [jobs, setJobs] = useState<MonitorJob[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MONITOR_JOBS_KEY);
      if (stored) setJobs(JSON.parse(stored) as MonitorJob[]);
    } catch { /* 무시 */ }
  }, []);

  const handleDelete = useCallback(async (jobId: string) => {
    setDeletingId(jobId);
    try {
      await fetch(`/api/monitor?jobId=${encodeURIComponent(jobId)}`, { method: 'DELETE' });
    } catch { /* API 실패 시에도 로컬에서는 삭제 */ }
    const updated = jobs.filter((j) => j.jobId !== jobId);
    setJobs(updated);
    try {
      localStorage.setItem(MONITOR_JOBS_KEY, JSON.stringify(updated));
    } catch { /* 무시 */ }
    setDeletingId(null);
  }, [jobs]);

  if (jobs.length === 0) {
    return (
      <div className="text-center mt-24">
        <p className="text-4xl mb-4">🔔</p>
        <p className="text-lg font-medium text-zinc-600 mb-2">등록된 모니터링이 없어요.</p>
        <p className="text-sm text-zinc-400 mb-6">채팅에서 숙소를 찾아보세요!</p>
        <button
          onClick={() => onTabSwitch('chat')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
        >
          💬 채팅으로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto w-full">
      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.jobId}
            className="bg-white rounded-2xl border border-zinc-200 shadow-sm px-5 py-4 flex items-start justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base font-semibold text-zinc-800 truncate">{job.accommodationName}</span>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  모니터링 중
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-500">
                <span>📅 체크인: <span className="text-zinc-700">{job.checkIn}</span></span>
                <span>📅 체크아웃: <span className="text-zinc-700">{job.checkOut}</span></span>
                <span>👥 인원: <span className="text-zinc-700">{job.guests}명</span></span>
                <span>🕐 등록: <span className="text-zinc-700">{new Date(job.registeredAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></span>
              </div>
              {job.url && job.url !== 'https://www.jalan.net/' && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-xs text-blue-500 hover:underline truncate"
                >
                  🔗 {job.url}
                </a>
              )}
            </div>
            <button
              onClick={() => handleDelete(job.jobId)}
              disabled={deletingId === job.jobId}
              className="shrink-0 text-xs text-zinc-400 hover:text-red-500 border border-zinc-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              {deletingId === job.jobId ? '삭제 중...' : '삭제'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
