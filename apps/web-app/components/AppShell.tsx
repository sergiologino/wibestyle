import AppTopBar from "@/components/AppTopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppTopBar />
      <main>{children}</main>
    </>
  );
}
