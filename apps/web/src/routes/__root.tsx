import { createRootRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { config } from '../lib/wagmi'
import '../App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
})

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const location = useLocation()

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="app">
            <header className="header">
              <div className="header-left">
                <h1 className="logo">
                  <Link to="/" className="logo-link">
                    <span className="logo-event">Event</span>
                    <span className="logo-horizon">Horizon</span>
                  </Link>
                </h1>
                <nav className="nav">
                  <Link
                    to="/"
                    className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                  >
                    Markets
                  </Link>
                  <Link
                    to="/leaderboard"
                    className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}
                  >
                    Leaderboard
                  </Link>
                </nav>
              </div>
              <div className="header-right">
                <ConnectButton showBalance={false} />
              </div>
            </header>

            <Outlet />

            <footer className="footer">
              <div className="footer-content">
                <p className="footer-statement">
                  EventHorizon - Numerai for Prediction Markets. Submit predictions, earn reputation.
                </p>
                <div className="footer-links">
                  <a href="https://domeapi.io" target="_blank" rel="noopener noreferrer">
                    Powered by Dome
                  </a>
                  <span className="divider">|</span>
                  <a href="https://github.com/EMJ-Capital-Ltd/eventhorizon" target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                </div>
              </div>
            </footer>
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
          <TanStackRouterDevtools position="bottom-left" />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
