import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="mt-auto border-t bg-background p-4 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} PRIMARY Platform. All rights reserved.
      <p className="text-xs mt-2">
        상호명: 스프레디 | 대표자명: 김성은<br />
        사업장주소: 강원도 춘천시 동면 소양강로 104 | 사업자등록번호: 296-22-01960
      </p>
      <div className="mt-2 text-xs">
        <Link href="/terms" className="hover:underline">
          이용약관
        </Link>
        <span className="mx-2">|</span>
        <Link href="/privacy" className="hover:underline">
          개인정보 처리방침
        </Link>
      </div>
    </footer>
  );
};

export default Footer;