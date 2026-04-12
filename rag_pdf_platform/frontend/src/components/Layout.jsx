import { NavLink, useLocation } from "react-router-dom";
import { Brain, FolderOpen, MessageSquare, GitCompare, Settings, Zap } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { to: "/", icon: Brain, label: "Home" },
  { to: "/library", icon: FolderOpen, label: "Library" },
  { to: "/compare", icon: GitCompare, label: "Compare" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-void">
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Sidebar */}
      <aside className="relative z-10 w-56 flex-shrink-0 flex flex-col bg-surface border-r border-border">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: "0 4px 14px rgba(92, 82, 212, 0.35)" }}
            >
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <span className="font-display font-700 text-ink text-base tracking-tight">DocLensAI</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Zap size={9} className="text-accent" />
                <span className="text-[10px] text-muted font-mono">DocLensAI v1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                clsx("nav-item", isActive && "active")
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Status indicator */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse-slow" />
            <span className="text-xs text-muted font-mono">Backend connected</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
