'use client'; // 클라이언트 컴포넌트로 지정 (usePathname 사용)

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // cn 유틸리티 import (shadcn/ui)
import { Users, FileText, ShieldAlert } from 'lucide-react'; // 아이콘 import

// 관리자 메뉴 항목 정의
const adminNavItems = [
  { name: '사용자 관리', href: '/admin/users', icon: Users },
  { name: '콘텐츠 관리', href: '/admin/posts', icon: FileText },
  { name: '신고 관리', href: '/admin/reports', icon: ShieldAlert },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <Link href="/admin" className="text-xl font-semibold text-gray-800 dark:text-white">
          관리자 페이지
        </Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {adminNavItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150',
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' // 활성 상태
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700' // 비활성 상태
            )}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
      {/* 필요시 하단에 추가 메뉴나 정보 표시 */}
    </aside>
  );
}