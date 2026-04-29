import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, BarChart3, CalendarDays,
  Upload, Settings, ChevronLeft, ChevronRight,
  FlaskConical, RotateCcw, Calculator, LineChart, LogOut
} from "lucide-react";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { path: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/Journal", label: "Journal", icon: BookOpen },
  { path: "/Markets", label: "Markets", icon: LineChart },
  { path: "/RiskCalculator", label: "Risk Calc", icon: Calculator },
  { path: "/Backtesting", label: "Backtesting", icon: FlaskConical },
  { path: "/Analytics", label: "Analytics", icon: BarChart3 },
  { path: "/Calendar", label: "Calendar", icon: CalendarDays },
  { path: "/ImportTrades", label: "Import & Sync", icon: Upload },
  { path: "/Settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => appClient.auth.me(),
  });

  const handleReset = async () => {
    const shouldReset = window.confirm("Reset all local trades, tags, reviews, and backtesting data?");
    if (!shouldReset) return;

    await appClient.system.reset();
    queryClient.clear();
    toast.success("Local data reset");
    window.location.href = "/Dashboard";
  };

  const handleLogout = async () => {
    try {
      await logout();
      queryClient.clear();
      toast.success("Logged out");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error?.message || "Could not log out.");
    }
  };

  return (
    <aside className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[16px_0_38px_-32px_rgba(168,108,51,0.18)] transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-primary/30">
          <img src="/brand/tradetrack-pro-mark.svg" alt="TradeTrack Pro" className="w-8 h-8 object-cover" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-base tracking-tight text-sidebar-accent-foreground">
              Trade <span className="text-primary">Track</span> Pro
            </span>
            <p className="text-[10px] text-sidebar-foreground/50 leading-none mt-0.5">Trading Journal</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon className={`w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-white" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* User profile card */}
      {!collapsed && user && (
        <div className="mx-3 mb-2 p-3 rounded-xl bg-sidebar-accent border border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/25">
              {(user.full_name || user.email || "T")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-sidebar-accent-foreground">{user.full_name || "Trader"}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-2.5 py-3 border-t border-sidebar-border shrink-0 space-y-0.5">
        <button
          onClick={handleReset}
          title={collapsed ? "Reset Data" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-all w-full ${collapsed ? "justify-center" : ""}`}
        >
          <RotateCcw className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Reset Data</span>}
        </button>
        <button
          onClick={handleLogout}
          title={collapsed ? "Log Out" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-primary transition-all w-full ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all w-full ${collapsed ? "justify-center" : ""}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
