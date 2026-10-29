import { SidebarNav } from "@/app/components/SidebarNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <SidebarNav />
      </aside>
      <div className="app-content">{children}</div>
    </div>
  );
}
