'use client';

import { useState, useEffect, useCallback } from 'react';
import { functions, db } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
} from 'firebase/firestore';

interface SyncProgress {
  status: 'running' | 'completed' | 'failed';
  total: number;
  processed: number;
  proCount: number;
  freeCount: number;
  skipped: number;
  errorCount: number;
  failedUserIds: string[];
  startedAt: { seconds: number };
  updatedAt: { seconds: number };
  completedAt: { seconds: number } | null;
  adminEmail: string;
  forceResync: boolean;
}

interface SyncResult {
  success: boolean;
  syncId: string;
  total: number;
  skipped: number;
  processed: number;
  proCount: number;
  freeCount: number;
  errorCount: number;
}

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [syncId, setSyncId] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [lastSync, setLastSync] = useState<SyncProgress | null>(null);
  const [forceResync, setForceResync] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the most recent sync on mount
  useEffect(() => {
    if (!db) return;

    const q = query(
      collection(db, 'adminSyncProgress'),
      orderBy('startedAt', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as SyncProgress;
        setLastSync(data);

        // If there's a running sync, attach to it
        if (data.status === 'running') {
          setSyncing(true);
          setSyncId(snapshot.docs[0].id);
          setProgress(data);
        }
      }
    });

    return () => unsub();
  }, []);

  // Listen to progress updates for active sync
  useEffect(() => {
    if (!syncId || !db) return;

    const unsub = onSnapshot(doc(db, 'adminSyncProgress', syncId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SyncProgress;
        setProgress(data);

        if (data.status === 'completed' || data.status === 'failed') {
          setSyncing(false);
          setLastSync(data);
        }
      }
    });

    return () => unsub();
  }, [syncId]);

  const startSync = useCallback(async () => {
    if (!functions) return;

    setShowConfirm(false);
    setSyncing(true);
    setError(null);
    setProgress(null);

    try {
      const syncFn = httpsCallable<{ forceResync: boolean }, SyncResult>(
        functions,
        'syncRevenueCatDataFunction'
      );

      const result = await syncFn({ forceResync });
      setSyncId(result.data.syncId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setError(msg);
      setSyncing(false);
    }
  }, [forceResync]);

  const formatTimestamp = (ts: { seconds: number } | null) => {
    if (!ts) return '-';
    return new Date(ts.seconds * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const progressPct =
    progress && progress.total > 0
      ? Math.round((progress.processed / progress.total) * 100)
      : 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sync RevenueCat Data</h2>
        <p className="text-sm text-gray-500 mt-1">
          Backfill subscription data from RevenueCat into Firestore for all users
        </p>
      </div>

      {/* Last Sync Info */}
      {lastSync && !syncing && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Last Sync</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="font-medium">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    lastSync.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : lastSync.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {lastSync.status}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Date</div>
              <div className="text-sm font-medium text-gray-900">
                {formatTimestamp(lastSync.completedAt || lastSync.updatedAt)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Processed</div>
              <div className="text-sm font-medium text-gray-900">
                {lastSync.processed} users
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">By</div>
              <div className="text-sm font-medium text-gray-900 truncate">
                {lastSync.adminEmail}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-3 pt-3 border-t">
            <div>
              <div className="text-xs text-gray-500">Pro</div>
              <div className="text-lg font-bold text-green-600">{lastSync.proCount}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Free</div>
              <div className="text-lg font-bold text-gray-600">{lastSync.freeCount}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Skipped</div>
              <div className="text-lg font-bold text-blue-600">{lastSync.skipped}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Errors</div>
              <div className="text-lg font-bold text-red-600">{lastSync.errorCount}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Mode</div>
              <div className="text-sm font-medium text-gray-900">
                {lastSync.forceResync ? 'Force re-sync' : 'Skip existing'}
              </div>
            </div>
          </div>

          {/* Show failed user IDs if any */}
          {lastSync.failedUserIds && lastSync.failedUserIds.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs font-medium text-red-600 mb-1">
                Failed User IDs ({lastSync.failedUserIds.length}):
              </div>
              <div className="bg-red-50 rounded p-2 max-h-32 overflow-y-auto">
                {lastSync.failedUserIds.map((id) => (
                  <div key={id} className="text-xs font-mono text-red-700">
                    {id}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Starting state (before progress doc is available) */}
      {syncing && !progress && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
            <span className="text-sm text-gray-600">Starting sync — reading user profiles...</span>
          </div>
        </div>
      )}

      {/* Progress Section (during sync) */}
      {syncing && progress && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Sync in Progress</h3>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>
                {progress.processed} / {progress.total} users
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="bg-green-50 rounded p-3 text-center">
              <div className="text-xs text-green-600">Pro</div>
              <div className="text-xl font-bold text-green-700">{progress.proCount}</div>
            </div>
            <div className="bg-gray-50 rounded p-3 text-center">
              <div className="text-xs text-gray-500">Free</div>
              <div className="text-xl font-bold text-gray-700">{progress.freeCount}</div>
            </div>
            <div className="bg-blue-50 rounded p-3 text-center">
              <div className="text-xs text-blue-600">Skipped</div>
              <div className="text-xl font-bold text-blue-700">{progress.skipped}</div>
            </div>
            <div className="bg-red-50 rounded p-3 text-center">
              <div className="text-xs text-red-600">Errors</div>
              <div className="text-xl font-bold text-red-700">{progress.errorCount}</div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Processing ~400 users/minute. This may take up to 20 minutes.
          </p>
        </div>
      )}

      {/* Sync Button Section */}
      {!syncing && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Start Sync
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Fetches subscription data from RevenueCat for all users in the{' '}
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">profiles</code>{' '}
                collection and writes it to{' '}
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                  revenuecatCustomersInfo
                </code>
                . This is safe to run multiple times — by default it skips users who
                already have data.
              </p>

              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceResync}
                  onChange={(e) => setForceResync(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">
                  Force re-sync all users (overwrite existing data)
                </span>
              </label>

              <button
                onClick={() => setShowConfirm(true)}
                className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                Sync RevenueCat Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-800">Sync Error</div>
          <div className="text-sm text-red-600 mt-1">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Sync
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              This will sync subscription data for all users from RevenueCat.
            </p>
            <p className="text-sm text-gray-600 mb-1">
              Estimated time: <strong>~20 minutes</strong> for ~8,000 users.
            </p>
            {forceResync && (
              <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mt-2 mb-2">
                Force re-sync is enabled — this will overwrite all existing data.
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2 mb-4">
              You can navigate away and come back — progress is tracked in real time.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={startSync}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Start Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
