import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContributePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-100 mb-2">
            Contribute to EventHorizon IQ
          </h1>
          <p className="text-zinc-400">
            Help improve our risk sensors by contributing data, events, and analysis.
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">What You Can Contribute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-300">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>New Events:</strong> Define new risk events with outcomes, date windows, and sources.
              </li>
              <li>
                <strong>Probability Trajectories:</strong> Update CSV files with daily probability estimates.
              </li>
              <li>
                <strong>Dispersion Bands:</strong> Add confidence intervals (low/high) to existing signals.
              </li>
              <li>
                <strong>Historical Replays:</strong> Backfill data for past events to train future models.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">How to Contribute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-300">
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Fork the repository</strong> on GitHub.
              </li>
              <li>
                <strong>Add or edit data files:</strong>
                <div className="mt-2 space-y-2">
                  <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
                    <code className="text-sm text-zinc-400">
                      data/events.json
                    </code>
                    <span className="text-zinc-500 text-sm ml-2">— Event definitions</span>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
                    <code className="text-sm text-zinc-400">
                      data/signals/&lt;slug&gt;.csv
                    </code>
                    <span className="text-zinc-500 text-sm ml-2">— Signal data</span>
                  </div>
                </div>
              </li>
              <li>
                <strong>Open a Pull Request</strong> with your changes.
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">CSV Format</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-300">
              Signal files use a simple CSV format with daily probability data:
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-4 overflow-x-auto">
              <pre className="font-mono text-sm text-zinc-300">
{`date,p,low,high
2026-01-02,0.42,0.35,0.50
2026-01-03,0.45,0.38,0.52
2026-01-04,0.48,0.40,0.55`}
              </pre>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-4">
                <code className="text-blue-400 w-16">date</code>
                <span className="text-zinc-400">ISO date format (YYYY-MM-DD) — Required</span>
              </div>
              <div className="flex gap-4">
                <code className="text-blue-400 w-16">p</code>
                <span className="text-zinc-400">Probability of primary outcome (0.0 to 1.0) — Required</span>
              </div>
              <div className="flex gap-4">
                <code className="text-blue-400 w-16">low</code>
                <span className="text-zinc-400">Lower bound of confidence interval — Optional</span>
              </div>
              <div className="flex gap-4">
                <code className="text-blue-400 w-16">high</code>
                <span className="text-zinc-400">Upper bound of confidence interval — Optional</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Attribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-300">
            <p>
              All contributors are credited in the event metadata. When adding or updating data,
              include your name and optional handle in the <code className="text-blue-400">contributors</code> array:
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-4 overflow-x-auto">
              <pre className="font-mono text-sm text-zinc-300">
{`"contributors": [
  { "name": "Your Name", "handle": "@yourhandle" }
]`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-center">
          <p className="text-zinc-400 mb-2">
            Future: Contributor reputation system coming soon.
          </p>
          <p className="text-zinc-500 text-sm">
            Track your contributions and build credibility in the community.
          </p>
        </div>
      </div>
    </div>
  );
}
