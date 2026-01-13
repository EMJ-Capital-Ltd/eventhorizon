export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-zinc-100">Access Denied</h1>
          <p className="text-xl text-zinc-400">UAT Environment</p>
        </div>

        <div className="space-y-4 text-zinc-300">
          <p>
            This UAT environment is restricted to <span className="font-mono text-amber-400">@emjx.ai</span> email addresses only.
          </p>
          <p className="text-sm text-zinc-500">
            Please contact your administrator if you believe you should have access.
          </p>
        </div>

        <div className="pt-4">
          <a
            href="/api/auth/logout"
            className="inline-block px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
          >
            Return to Login
          </a>
        </div>
      </div>
    </div>
  );
}
