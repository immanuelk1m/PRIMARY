import AdminSidebar from '@/components/layout/AdminSidebar'; // 경로 수정: @ 사용
// import AdminHeader from '@/components/layout/AdminHeader'; // 필요시 주석 해제
import { ReactNode } from 'react'; // ReactNode 타입 import

export default function AdminLayout({ children }: { children: ReactNode }) {
  // 이 레이아웃은 미들웨어(Story 6.3) 통과 후 렌더링됨
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <AdminHeader /> */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-800 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}