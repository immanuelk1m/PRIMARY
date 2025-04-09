'use client';

import { Profile } from '@/types'; // 타입 import
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns'; // 날짜 포맷팅

interface AdminUserTableProps {
  users: Profile[];
}

export default function AdminUserTable({ users }: AdminUserTableProps) {

  const getRoleBadgeVariant = (role: string | null): "default" | "secondary" | "destructive" | "outline" => {
    return role === 'admin' ? 'destructive' : 'secondary';
  };

  const getTierBadgeVariant = (tier: string | null): "default" | "secondary" | "destructive" | "outline" => {
    return tier === 'paid' ? 'default' : 'outline';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>닉네임</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>역할</TableHead>
          <TableHead>티어</TableHead>
          <TableHead>가입일</TableHead>
          {/* TODO: 필요한 경우 추가 컬럼 (예: 마지막 로그인, 상태 등) */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">사용자가 없습니다.</TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-mono text-xs">{user.id}</TableCell>
              <TableCell className="font-medium">{user.nickname}</TableCell>
              <TableCell>{user.email ?? '-'}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role ?? 'unknown'}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getTierBadgeVariant(user.tier)}>{user.tier ?? 'unknown'}</Badge>
              </TableCell>
              <TableCell>{user.created_at ? format(new Date(user.created_at), 'yyyy-MM-dd') : '-'}</TableCell>
              {/* TODO: 사용자 관리 작업 버튼 (예: 역할 변경, 비활성화) */}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}