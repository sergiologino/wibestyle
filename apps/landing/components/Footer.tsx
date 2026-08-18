import Link from "next/link";
import HashLink from "@/components/HashLink";
import { siteConfig } from "@/lib/site";
import { maxChannelUrl, telegramChannelUrl } from "@/lib/community";

export default function Footer() {
  const telegramUrl = telegramChannelUrl();
  const maxUrl = maxChannelUrl();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" href="/">
            <span className="spark">✦</span> Я на стиле
          </Link>
          <p>Примерочная одежды с маркетплейсов.</p>
        </div>
        <div>
          <b>Навигация</b>
          <Link href="/kak-rabotaet">Как работает</Link>
          <HashLink href="/#examples">Примеры</HashLink>
          <Link href="/makiyazh">Макияж и причёски</Link>
        </div>
        <div>
          <b>Приложение</b>
          <Link href={siteConfig.appUrl}>Веб-версия</Link>
          <Link href="/ai-primerka">Примерка</Link>
        </div>
        <div>
          <b>Поддержка</b>
          <Link href="/privacy">Политика конфиденциальности</Link>
          <Link href="/terms">Пользовательское соглашение</Link>
        </div>
        <div>
          <b>Реквизиты</b>
          <p className="footer-legal">ООО «АЛЬТАКОД»</p>
          <p className="footer-legal">ИНН 4000002848</p>
          <a href="mailto:admin@altacod.com">admin@altacod.com</a>
          {telegramUrl ? (
            <a className="footer-telegram" href={telegramUrl} rel="noopener noreferrer" target="_blank">
              Пишите в Telegram ↗
            </a>
          ) : (
            <p className="footer-legal footer-legal-muted">Telegram</p>
          )}
          {maxUrl ? (
            <a className="footer-telegram" href={maxUrl} rel="noopener noreferrer" target="_blank">
              Пишите в MAX ↗
            </a>
          ) : (
            <p className="footer-legal footer-legal-muted">MAX</p>
          )}
        </div>
      </div>
    </footer>
  );
}
