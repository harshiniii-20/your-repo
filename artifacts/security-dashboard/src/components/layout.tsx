import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Activity, 
  Fingerprint, 
  Link as LinkIcon, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/logins", label: "Login Attempts", icon: Activity },
  { href: "/emotions", label: "Emotion Analysis", icon: ShieldAlert },
  { href: "/anomalies", label: "Anomalies", icon: Fingerprint },
  { href: "/blockchain", label: "Audit Logs", icon: LinkIcon },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated && location === "/login") {
    return <>{children}</>;
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!isAuthenticated && location !== "/login") {
    window.location.href = "/login";
    return null;
  }

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3 border-b border-white/10 bg-black/20">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
          <ShieldAlert className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-display font-bold text-2xl tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent glow-text-primary">
          SECUREWATCH
        </h1>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-display text-muted-foreground uppercase tracking-widest mb-4 px-4">Modules</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:text-primary transition-colors")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-destructive hover:border hover:border-destructive/30 transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:text-destructive transition-colors" />
          <span className="font-medium">Disconnect</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex cyber-grid">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-72 glass-panel border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar for mobile */}
        <header className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-white/10 z-30">
          <div className="flex items-center gap-2">
             <ShieldAlert className="w-6 h-6 text-primary" />
             <span className="font-display font-bold text-xl text-primary">SECUREWATCH</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-white" />
          </Button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
