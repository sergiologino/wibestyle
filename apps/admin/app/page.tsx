import Link from "next/link";
import { Card, Pill } from "@wibestyle/ui";
import { adminSections } from "@/lib/admin-sections";

export default function AdminHomePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <Pill>Admin skeleton</Pill>
      <h1 className="text-4xl font-black tracking-tight text-[#ff1fa2]">Я на стиле · Admin</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {adminSections.map((section) => (
          <Card key={section.id}>
            <h2 className="text-2xl font-black">{section.title}</h2>
            <p className="mt-2 font-bold text-[#6d6273]">{section.description}</p>
            <p className="mt-4 text-sm font-black uppercase tracking-wide text-[#782cff]">{section.status}</p>
            {"href" in section && section.href ? (
              <Link href={section.href} className="mt-4 inline-block font-bold text-[#ff1fa2]">
                Открыть →
              </Link>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
