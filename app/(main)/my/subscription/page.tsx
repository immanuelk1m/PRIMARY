import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SubscriptionPage = () => {
  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>구독 정보</CardTitle>
          <CardDescription>프리미엄 플랜 구독 정보를 확인하고 관리하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 구독 플랜 정보 (예시) */}
            <div>
              <h3 className="text-lg font-medium">프리미엄 플랜</h3>
              <p className="text-sm text-muted-foreground">모든 기능 무제한 이용</p>
            </div>

            {/* 가격 정보 */}
            <p className="text-lg font-semibold">가격: <span className="font-bold">월 4,900원</span></p>

            {/* 서비스 제공 기간 정보 */}
            <p className="text-sm text-gray-600 mt-1">서비스 제공 기간: <span className="font-bold">온라인 상품으로 결제 후 즉시 유료 회원 혜택이 적용되어 다음 결제일까지 유지됩니다.</span></p>

            {/* 구독 버튼 (예시) */}
            <Button className="w-full mt-6">
              구독하기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPage;