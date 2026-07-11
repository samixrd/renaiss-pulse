import { Terminal, LayoutDashboard } from "lucide-react";

interface NavbarProps {
  tab: "command" | "dashboard";
  onTabChange: (tab: "command" | "dashboard") => void;
}

export default function Navbar({ tab, onTabChange }: NavbarProps) {
  return (
    <nav className="border-b border-edge bg-card/80 backdrop-blur-sm sticky top-0 z-10 relative">
      {/* Subtle Kit/Stadium Strip */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/80 via-accent/40 to-white/20" />

      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <img src="/logo.png" alt="Renaiss Pulse Logo" className="w-6 h-6 object-contain" /> Renaiss Pulse
        </span>

        <div className="flex gap-1 bg-surface rounded-lg p-1">
          <button
            onClick={() => onTabChange("command")}
            className={`flex items-center px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              tab === "command"
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-subtle hover:text-content"
            }`}
          >
            <Terminal className="w-4 h-4 mr-2" /> Command
          </button>
          <button
            onClick={() => onTabChange("dashboard")}
            className={`flex items-center px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              tab === "dashboard"
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-subtle hover:text-content"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
          </button>
        </div>
      </div>
    </nav>
  );
}
