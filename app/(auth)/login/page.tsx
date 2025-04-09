import { KakaoLoginButton } from '../../../components/feature/auth/KakaoLoginButton'; // 경로 확인

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-xs space-y-4">
        <h1 className="text-2xl font-semibold text-center">로그인</h1>
        <KakaoLoginButton />
        {/* 다른 로그인 옵션 (이메일 등) 추가 가능 */}
      </div>
    </div>
  );
}