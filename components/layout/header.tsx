import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-zinc-100">
              EventHorizon<span className="text-blue-500">IQ</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/events"
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Events
            </Link>
            <Link
              href="/contribute"
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Contribute
            </Link>
            <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-zinc-800">
              <div
                className="flex items-center gap-2 text-sm text-zinc-400"
                title="This is an intelligence layer. No execution or trading capabilities."
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Operational</span>
              </div>
              <span
                className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider"
                title="This is an intelligence layer. No execution or trading capabilities."
              >
                Mode: Read-Only
              </span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
