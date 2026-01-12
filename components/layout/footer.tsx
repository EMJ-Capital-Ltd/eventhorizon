export function Footer() {
  return (
    <footer>
      {/* Main footer content */}
      <div className="border-t border-zinc-800 bg-zinc-950 py-4">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs text-zinc-500">
            EventHorizon IQ is a read-only informational tool.
            Data shown reflects contributor beliefs, not financial advice.
          </p>
        </div>
      </div>

      {/* Legal status bar */}
      <div className="h-6 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center">
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
          System Status: Observation Only // Not a Prediction Market // No Profit Claims
        </p>
      </div>
    </footer>
  );
}
