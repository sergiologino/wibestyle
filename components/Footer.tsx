import Link from "next/link";

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
          <Link href="/#examples">Примеры</Link>
          <Link href="/makiyazh">Макияж и причёски</Link>
        </div>
        <div>
          <b>Приложение</b>
          <Link href="/#lead">Ранний доступ</Link>
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
