"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@wibestyle/ui";
import type { UserNotification } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";

export default function NotificationInboxBanner() {
  const { api, accessToken } = useAppSession();
  const [notification, setNotification] = useState<UserNotification | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    void api.getNotifications().then(({ items }) => {
      if (active) setNotification(items.find((item) => !item.read) ?? null);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [accessToken, api]);

  if (!notification) return null;

  async function close() {
    setNotification(null);
    await api.markNotificationRead(notification!.id).catch(() => undefined);
  }

  return (
    <section className="rounded-[24px] border border-[#a9d8ff] bg-[#eef7ff] p-5">
      <p className="text-eyebrow text-[#315d85]">Уведомление</p>
      <h2 className="text-display-md mt-2 text-xl">{notification.title}</h2>
      <p className="text-body mt-2">{notification.body}</p>
      <div className="mt-4 flex gap-3">
        {notification.actionUrl ? <Link href={notification.actionUrl}><Button size="sm">Открыть</Button></Link> : null}
        <Button size="sm" variant="ghost" onClick={() => void close()}>Понятно</Button>
      </div>
    </section>
  );
}
