// src/pages/Profile/SeniorAnalytics.tsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Layout/Header';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserAnalytics, type UserAnalytics } from '../../api';

function msToFriendly(ms: number | null | undefined) {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60), sec = s % 60;
  const h = Math.floor(m / 60), min = m % 60;
  if (h) return `${h}h ${min}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default function SeniorAnalytics() {
  const nav = useNavigate();
  const { user } = useAuth();
  const isSenior = user?.role === 'senior' || user?.role?.includes?.('senior');

  const { search } = useLocation();
  const params = new URLSearchParams(search);

  // Seniors can target a user by ID or email via ?userId=... (email is fine).
  // Students ignore this and always load "me".
  const initialSelector = isSenior ? (params.get('userId') ?? '') : 'me';
  const initialDays = (() => {
    const d = params.get('days');
    return d ? parseInt(d, 10) : 90;
  })();

  const [selector, setSelector] = useState<string>(initialSelector); // 'me', userId, or email
  const [days, setDays] = useState<number>(initialDays);
  const [data, setData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // If not senior, force "me".
    const target = isSenior ? (selector || undefined) : undefined;

    setLoading(true);
    setErr(null);

    fetchUserAnalytics(target, days)
      .then(setData)
      .catch(e => setErr(e.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSenior, selector, days]);

  const maxCount = useMemo(
    () => data?.topWords.reduce((m, w) => Math.max(m, w.count), 1) ?? 1,
    [data]
  );
  const scale = (c: number) => 12 + Math.round((c / maxCount) * 24); // 12px..36px

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-end gap-3 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isSenior ? 'Student Analytics' : 'Your Analytics'}
          </h2>
          {isSenior && <span className="text-gray-500">(Senior-only)</span>}
        </div>

        {/* Controls (seniors only): can enter user ID or email and change window */}
        {isSenior && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Student User ID or Email</label>
                <input
                  className="border rounded px-3 py-2 w-80"
                  placeholder="e.g., 65f... OR student@example.com"
                  value={selector === 'me' ? '' : selector}
                  onChange={e => setSelector(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Window (days)</label>
                <input
                  type="number"
                  className="border rounded px-3 py-2 w-28"
                  value={days}
                  min={7}
                  max={365}
                  onChange={e => setDays(parseInt(e.target.value || '90', 10))}
                />
              </div>
              <button
                onClick={() => {
                  const q = new URLSearchParams();
                  if (selector && selector !== 'me') q.set('userId', selector);
                  q.set('days', String(days));
                  nav(`/profile/analytics?${q.toString()}`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Permalink
              </button>
            </div>
          </div>
        )}

        {loading && <div className="bg-white rounded-lg shadow p-6">Loading…</div>}
        {err && <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">Error: {err}</div>}

        {data && (
          <>
            {/* Duration cards (p50/p90 removed) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Conversation Duration (start → last activity)</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    Count<br /><b>{data.stats.fullDuration.count}</b>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    Avg<br /><b>{msToFriendly(data.stats.fullDuration.avgMs)}</b>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Time to First Validation (Step 5)</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    Count<br /><b>{data.stats.timeToValidation.count}</b>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    Avg<br /><b>{msToFriendly(data.stats.timeToValidation.avgMs)}</b>
                  </div>
                </div>
              </div>
            </div>

            {/* Top words */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Top Words</h3>
              {data.topWords.length === 0 ? (
                <div className="text-gray-500">No words found in this period.</div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {data.topWords.map(w => (
                    <span
                      key={w.word}
                      title={`${w.word}: ${w.count}`}
                      className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-800"
                      style={{ fontSize: `${scale(w.count)}px`, lineHeight: 1.1 }}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Per-conversation rows */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Per-conversation rows</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4">Conversation ID</th>
                      <th className="py-2 pr-4">Start</th>
                      <th className="py-2 pr-4">Last Activity</th>
                      <th className="py-2 pr-4">Duration</th>
                      <th className="py-2 pr-4">Time to Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.durations.map(d => (
                      <tr key={d.conversationId} className="border-t">
                        <td className="py-2 pr-4">{d.conversationId}</td>
                        <td className="py-2 pr-4">{new Date(d.startedAt).toLocaleString()}</td>
                        <td className="py-2 pr-4">{new Date(d.lastActivityAt).toLocaleString()}</td>
                        <td className="py-2 pr-4">{msToFriendly(d.fullDurationMs)}</td>
                        <td className="py-2 pr-4">{msToFriendly(d.timeToValidationMs ?? null)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
