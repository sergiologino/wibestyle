import Link from "next/link";
import HashLink from "@/components/HashLink";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" href="/">
            <span className="spark">✦</span> Я на стиле
          </Link>
          <p>AI-примерочная одежды с маркетплейсов.</p>
        </div>
        <div>
          <b>Навигация</b>
          <Link href="/kak-rabotaet">Как работает</Link>
          <HashLink href="/#examples">Примеры</HashLink>
          <Link href="/makiyazh">Макияж и причёски</Link>
        </div>
        <div>
          <b>Приложение</b>
          <HashLink href="/#lead">Ранний доступ</HashLink>
          <Link href="/ai-primerka">AI-примерка</Link>
        </div>
        <div>
          <b>Поддержка</b>
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/terms">Пользовательское соглашение</Link>
        </div>
      </div>
    </footer>
  );
}
