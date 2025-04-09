'use client';

import { useUser } from '@/hooks/useUser';
import { Skeleton } from '@/components/ui/skeleton';
// import { Coins } from 'lucide-react'; // 예시 아이콘 (필요 시 설치 및 import)

export function TokenBalanceDisplay() {
  const { profile, isLoading } = useUser();

  if (isLoading) {
    // 로딩 중 스켈레톤 UI
    return <Skeleton className="h-5 w-20" />;
  }

  // profile이 로드되었는지, token_balance가 숫자인지 확인 후 표시, 아니면 0
  const balance = (profile && typeof profile.token_balance === 'number') ? profile.token_balance : 0;

  return (
    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
      {/* <Coins className="h-4 w-4 text-yellow-500" /> */}
      <span>토큰:</span>
      <span className="font-semibold text-primary">{balance}</span>
    </div>
  );
}