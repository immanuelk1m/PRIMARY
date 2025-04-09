import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Shadcn UI Table import 경로 확인
import { Database } from '@/types/database.types'; // 경로 확인

type TokenLog = Database['public']['Tables']['tokens_log']['Row'];

interface TokenHistoryTableProps {
  logs: TokenLog[] | null; // null도 허용하도록 수정
}

const reasonMap: { [key: string]: string } = {
  initial_grant: '초기 지급',
  view_post_cost: '게시물 열람',
  post_approved_reward: '게시물 승인 보상',
  // TODO: 필요한 다른 사유 추가 (예: 'admin_adjustment': '관리자 조정')
  default: '기타',
};

export function TokenHistoryTable({ logs }: TokenHistoryTableProps) {
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '날짜 정보 없음'; // null 체크 추가
    try {
      // 'ko-KR' 로케일과 옵션을 사용하여 'YYYY.MM.DD HH:MM' 형식과 유사하게 포맷
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    } catch (e) {
      console.error('날짜 포맷팅 오류:', e); // 오류 로깅 추가
      return '유효하지 않은 날짜';
    }
  };

  const getDisplayReason = (reason: string | null) => {
    if (!reason) return reasonMap.default; // null 체크 추가
    return reasonMap[reason] || reasonMap.default;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px]">날짜</TableHead>
          <TableHead>사유</TableHead>
          <TableHead className="text-right">변동량</TableHead>
          <TableHead className="text-right">최종 잔액</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs && logs.length > 0 ? (
          logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{formatDateTime(log.created_at)}</TableCell>
              <TableCell>{getDisplayReason(log.reason)}</TableCell>
              <TableCell className={`text-right ${log.change_amount > 0 ? 'text-blue-600' : log.change_amount < 0 ? 'text-red-600' : ''}`}>
                {/* change_amount가 null일 경우 0으로 처리 */}
                {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount ?? 0}
              </TableCell>
              <TableCell className="text-right">
                {/* balance_after_change가 null일 경우 '-' 표시 또는 다른 값 */}
                {log.balance_after_change ?? '-'}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center"> {/* 높이 추가 */}
              토큰 내역이 없습니다.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}