'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/db/supabase';

export default function CallbackClientInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setErrorMsg(errorParam);
      setStatus('error');
      return;
    }

    if (!code) {
      setErrorMsg('인증 코드가 없습니다. 다시 시도해주세요.');
      setStatus('error');
      return;
    }

    const exchangeCode = async () => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.session) {
          throw error ?? new Error('세션을 가져올 수 없습니다.');
        }

        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          }),
        });

        router.replace('/plan');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Google 로그인에 실패했습니다.');
        setStatus('error');
      }
    };

    exchangeCode();
  }, [searchParams, router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <p className="text-3xl mb-3">⚠️</p>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">로그인에 실패했습니다</h2>
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {errorMsg}
          </p>
          <button
            onClick={() => router.replace('/auth')}
            className="text-sm text-blue-600 hover:underline"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Google 계정 연결 중...</p>
      </div>
    </div>
  );
}
