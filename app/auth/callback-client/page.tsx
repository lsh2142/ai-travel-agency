import { Suspense } from 'react';
import CallbackClientInner from './callback-client-inner';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Google 계정 연결 중...</p>
      </div>
    </div>
  );
}

export default function CallbackClientPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackClientInner />
    </Suspense>
  );
}
