import AppTopBar from "@/components/AppTopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppTopBar />
      <main className="pb-24 md:pb-0">{children}</main>
    </>
  );
}
