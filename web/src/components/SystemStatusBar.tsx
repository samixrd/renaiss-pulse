import { Cpu, Globe } from "lucide-react";

/**
 * SystemStatusBar — fixed slim footer showing QVAC model state and WDK network.
 *
 * Purely static labels, zero backend calls.
 * Sits at position:fixed bottom-0 so it never disrupts scroll or layout.
 */
export default function SystemStatusBar() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-edge bg-card/90 backdrop-blur-sm"
      style={{ height: "32px" }}
    >
      <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Left — QVAC status */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <Cpu className="w-3 h-3 text-faint" />
          <span className="text-[11px] font-medium text-subtle tracking-wide">
            QVAC: Model Ready
          </span>
        </div>

        {/* Right — WDK network */}
        <div className="flex items-center gap-2">
          <Globe className="w-3 h-3 text-teal" />
          <span className="text-[11px] font-medium text-teal tracking-wide">
            WDK: Nile Testnet
          </span>
        </div>
      </div>
    </div>
  );
}
