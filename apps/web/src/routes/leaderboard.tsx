import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { leaderboardQueryOptions } from '../lib/queries'

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardPage,
})

function LeaderboardPage() {
  const { data: leaderboard, isLoading, error } = useQuery(leaderboardQueryOptions(50))

  if (isLoading) {
    return (
      <main className="main-content">
        <div className="loading">Loading leaderboard...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="main-content">
        <div className="error">Failed to load leaderboard: {error.message}</div>
      </main>
    )
  }

  return (
    <main className="main-content">
      <div className="leaderboard-container">
        <h2 className="section-title">Trader Leaderboard</h2>
        <p className="section-subtitle">Top traders by reputation score</p>

        <div className="leaderboard-table">
          <div className="leaderboard-header">
            <span className="col-rank">Rank</span>
            <span className="col-wallet">Wallet</span>
            <span className="col-reputation">Reputation</span>
            <span className="col-predictions">Predictions</span>
            <span className="col-brier">Avg Brier Score</span>
            <span className="col-stake">Total Stake</span>
          </div>

          {leaderboard && leaderboard.length > 0 ? (
            leaderboard.map((entry) => (
              <div key={entry.walletAddress} className="leaderboard-row">
                <span className="col-rank">
                  {entry.rank <= 3 ? (
                    <span className={`medal medal-${entry.rank}`}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    `#${entry.rank}`
                  )}
                </span>
                <span className="col-wallet">
                  {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                </span>
                <span className="col-reputation">
                  <div className="reputation-bar">
                    <div
                      className="reputation-fill"
                      style={{ width: `${entry.reputation * 100}%` }}
                    />
                    <span className="reputation-value">{(entry.reputation * 100).toFixed(1)}%</span>
                  </div>
                </span>
                <span className="col-predictions">{entry.predictionCount}</span>
                <span className="col-brier">
                  <span className={entry.avgBrierScore < 0.25 ? 'good' : entry.avgBrierScore < 0.5 ? 'medium' : 'poor'}>
                    {entry.avgBrierScore.toFixed(3)}
                  </span>
                </span>
                <span className="col-stake">${entry.totalStake.toFixed(0)}</span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No traders yet. Be the first to submit a prediction!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
