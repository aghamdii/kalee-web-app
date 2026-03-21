'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { fetchAllInsights } from '../../actions/admin-actions';

// Label mappings
const ACQUISITION_SOURCE_LABELS: Record<string, string> = {
  app_store: 'App Store',
  friend_family: 'Friend or Family',
  influencer: 'Influencer',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x_twitter: 'X (Twitter)',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  other: 'Other',
};

const MOTIVATION_LABELS: Record<string, string> = {
  live_longer: 'Live longer & healthier',
  feel_confident: 'Feel confident in clothes',
  more_energy: 'Have more energy',
  medical_conditions: 'Improve health conditions',
  feel_attractive: 'Feel attractive & confident',
};

const TRACKING_METHOD_LABELS: Record<string, string> = {
  other_apps: 'Other apps',
  pen_paper: 'Pen and paper',
  mental_tracking: 'Mental tracking',
  no_tracking: "Don't track at all",
  tried_failed: 'Tried but always quit',
};

const EATING_HABITS_LABELS: Record<string, string> = {
  very_healthy: 'Very healthy',
  mostly_healthy: 'Mostly healthy',
  balanced: 'Balanced',
  need_improvement: 'Could use improvement',
  unsure: "I'm not sure",
};

const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  ko: 'Korean',
  ja: 'Japanese',
};

const PLATFORM_LABELS: Record<string, string> = {
  iOS: 'iOS',
  Android: 'Android',
};

function label(map: Record<string, string>, key: string | null): string {
  if (!key) return '-';
  return map[key] || key;
}

interface Insight {
  userId: string;
  acquisitionSource: string | null;
  acquisitionSourceOther: string | null;
  influencerName: string | null;
  primaryMotivation: string | null;
  currentTrackingMethod: string | null;
  trackingAppName: string | null;
  eatingHabits: string | null;
  locale: string;
  platform: string;
  appVersion: string;
  completedAt: string | null;
}

type FilterKey = 'acquisitionSource' | 'primaryMotivation' | 'currentTrackingMethod' | 'eatingHabits' | 'locale' | 'platform';

const FILTER_OPTIONS: { key: FilterKey; label: string; options: Record<string, string> }[] = [
  { key: 'acquisitionSource', label: 'Acquisition Source', options: ACQUISITION_SOURCE_LABELS },
  { key: 'primaryMotivation', label: 'Motivation', options: MOTIVATION_LABELS },
  { key: 'currentTrackingMethod', label: 'Tracking Method', options: TRACKING_METHOD_LABELS },
  { key: 'eatingHabits', label: 'Eating Habits', options: EATING_HABITS_LABELS },
  { key: 'locale', label: 'Language', options: LOCALE_LABELS },
  { key: 'platform', label: 'Platform', options: PLATFORM_LABELS },
];

const PAGE_SIZE = 30;

// Bar chart component
function DistributionChart({
  title,
  data,
  labelMap,
  total,
}: {
  title: string;
  data: Record<string, number>;
  labelMap: Record<string, string>;
  total: number;
}) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
        <p className="text-sm text-gray-400">No data</p>
      </div>
    );
  }
  const max = sorted[0][1];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="space-y-2">
        {sorted.map(([key, count]) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          return (
            <div key={key}>
              <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                <span className="truncate mr-2">{labelMap[key] || key}</span>
                <span className="whitespace-nowrap font-medium">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Ranked list component for free-text fields
function RankedList({
  title,
  items,
}: {
  title: string;
  items: Array<{ name: string; count: number }>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">
              <span className="text-gray-400 mr-2">{i + 1}.</span>
              {item.name}
            </span>
            <span className="text-gray-500 font-medium">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compute aggregates from filtered data
function computeAggregates(data: Insight[]) {
  const agg = {
    total: data.length,
    acquisitionSource: {} as Record<string, number>,
    primaryMotivation: {} as Record<string, number>,
    currentTrackingMethod: {} as Record<string, number>,
    eatingHabits: {} as Record<string, number>,
    locale: {} as Record<string, number>,
    platform: {} as Record<string, number>,
    topInfluencers: [] as Array<{ name: string; count: number }>,
    topTrackingApps: [] as Array<{ name: string; count: number }>,
  };

  const influencerCounts: Record<string, number> = {};
  const trackingAppCounts: Record<string, number> = {};

  for (const d of data) {
    if (d.acquisitionSource) agg.acquisitionSource[d.acquisitionSource] = (agg.acquisitionSource[d.acquisitionSource] || 0) + 1;
    if (d.primaryMotivation) agg.primaryMotivation[d.primaryMotivation] = (agg.primaryMotivation[d.primaryMotivation] || 0) + 1;
    if (d.currentTrackingMethod) agg.currentTrackingMethod[d.currentTrackingMethod] = (agg.currentTrackingMethod[d.currentTrackingMethod] || 0) + 1;
    if (d.eatingHabits) agg.eatingHabits[d.eatingHabits] = (agg.eatingHabits[d.eatingHabits] || 0) + 1;
    if (d.locale) agg.locale[d.locale] = (agg.locale[d.locale] || 0) + 1;
    if (d.platform) agg.platform[d.platform] = (agg.platform[d.platform] || 0) + 1;
    if (d.influencerName) {
      const name = d.influencerName.trim().toLowerCase();
      influencerCounts[name] = (influencerCounts[name] || 0) + 1;
    }
    if (d.trackingAppName) {
      const name = d.trackingAppName.trim().toLowerCase();
      trackingAppCounts[name] = (trackingAppCounts[name] || 0) + 1;
    }
  }

  agg.topInfluencers = Object.entries(influencerCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  agg.topTrackingApps = Object.entries(trackingAppCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return agg;
}

export default function InsightsPage() {
  const [allInsights, setAllInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'table'>('overview');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    acquisitionSource: '',
    primaryMotivation: '',
    currentTrackingMethod: '',
    eatingHabits: '',
    locale: '',
    platform: '',
  });

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;

  // Fetch all data once
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await fetchAllInsights();
        if (!result.error) {
          setAllInsights(result.insights);
        }
      } catch (error) {
        console.error('Error loading insights:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter + sort client-side
  const filtered = useMemo(() => {
    let data = allInsights;

    if (filters.acquisitionSource) data = data.filter((d) => d.acquisitionSource === filters.acquisitionSource);
    if (filters.primaryMotivation) data = data.filter((d) => d.primaryMotivation === filters.primaryMotivation);
    if (filters.currentTrackingMethod) data = data.filter((d) => d.currentTrackingMethod === filters.currentTrackingMethod);
    if (filters.eatingHabits) data = data.filter((d) => d.eatingHabits === filters.eatingHabits);
    if (filters.locale) data = data.filter((d) => d.locale === filters.locale);
    if (filters.platform) data = data.filter((d) => d.platform === filters.platform);

    // Sort by completedAt descending
    return [...data].sort((a, b) => {
      const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return tb - ta;
    });
  }, [allInsights, filters]);

  // Aggregates computed from filtered data
  const aggregates = useMemo(() => computeAggregates(filtered), [filtered]);

  // Paginated slice for the table
  const visibleInsights = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      acquisitionSource: '',
      primaryMotivation: '',
      currentTrackingMethod: '',
      eatingHabits: '',
      locale: '',
      platform: '',
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Insights</h2>
          <p className="text-sm text-gray-500 mt-1">
            Onboarding survey responses from app users
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'table'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Records
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Responses</div>
          <div className="text-2xl font-bold text-gray-900">{aggregates.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">iOS</div>
          <div className="text-2xl font-bold text-gray-900">
            {aggregates.platform['iOS'] || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Android</div>
          <div className="text-2xl font-bold text-gray-900">
            {aggregates.platform['Android'] || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Languages</div>
          <div className="text-lg font-bold text-gray-900">
            {Object.entries(aggregates.locale)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => `${LOCALE_LABELS[k] || k}: ${v}`)
              .join(', ') || '-'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Filters{' '}
            {activeFilterCount > 0 && (
              <span className="text-green-600">
                ({activeFilterCount} active — {filtered.length} of {allInsights.length} records)
              </span>
            )}
          </h3>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {FILTER_OPTIONS.map((f) => (
            <select
              key={f.key}
              value={filters[f.key]}
              onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">{f.label}</option>
              {Object.entries(f.options).map(([val, lbl]) => (
                <option key={val} value={val}>
                  {lbl}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : activeTab === 'overview' ? (
        /* Overview Tab */
        <div>
          {aggregates.total === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No insights data found
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <DistributionChart
                  title="How did you find Kalee?"
                  data={aggregates.acquisitionSource}
                  labelMap={ACQUISITION_SOURCE_LABELS}
                  total={aggregates.total}
                />
                <DistributionChart
                  title="Why health matters to you"
                  data={aggregates.primaryMotivation}
                  labelMap={MOTIVATION_LABELS}
                  total={aggregates.total}
                />
                <DistributionChart
                  title="How do you currently track meals?"
                  data={aggregates.currentTrackingMethod}
                  labelMap={TRACKING_METHOD_LABELS}
                  total={aggregates.total}
                />
                <DistributionChart
                  title="Your eating habits"
                  data={aggregates.eatingHabits}
                  labelMap={EATING_HABITS_LABELS}
                  total={aggregates.total}
                />
              </div>

              {(aggregates.topInfluencers.length > 0 || aggregates.topTrackingApps.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RankedList title="Top Influencers Mentioned" items={aggregates.topInfluencers} />
                  <RankedList title="Top Tracking Apps Mentioned" items={aggregates.topTrackingApps} />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Records Tab */
        <div>
          {filtered.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No records found
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          User ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Source
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Motivation
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tracking
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Eating Habits
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Locale
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Platform
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {visibleInsights.map((insight) => (
                        <Fragment key={insight.userId}>
                          <tr
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              setExpandedId(
                                expandedId === insight.userId ? null : insight.userId
                              )
                            }
                          >
                            <td className="px-4 py-3 text-sm font-mono text-gray-700 max-w-[120px] truncate">
                              {insight.userId}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {label(ACQUISITION_SOURCE_LABELS, insight.acquisitionSource)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {label(MOTIVATION_LABELS, insight.primaryMotivation)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {label(TRACKING_METHOD_LABELS, insight.currentTrackingMethod)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {label(EATING_HABITS_LABELS, insight.eatingHabits)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {LOCALE_LABELS[insight.locale] || insight.locale}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  insight.platform === 'iOS'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {insight.platform}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                              {formatDate(insight.completedAt)}
                            </td>
                          </tr>
                          {expandedId === insight.userId && (
                            <tr>
                              <td colSpan={8} className="px-4 py-4 bg-gray-50 border-t">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500 block text-xs mb-0.5">
                                      Full User ID
                                    </span>
                                    <span className="font-mono text-gray-800 break-all">
                                      {insight.userId}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 block text-xs mb-0.5">
                                      App Version
                                    </span>
                                    <span className="text-gray-800">
                                      {insight.appVersion || '-'}
                                    </span>
                                  </div>
                                  {insight.influencerName && (
                                    <div>
                                      <span className="text-gray-500 block text-xs mb-0.5">
                                        Influencer Name
                                      </span>
                                      <span className="text-gray-800">
                                        {insight.influencerName}
                                      </span>
                                    </div>
                                  )}
                                  {insight.trackingAppName && (
                                    <div>
                                      <span className="text-gray-500 block text-xs mb-0.5">
                                        Tracking App
                                      </span>
                                      <span className="text-gray-800">
                                        {insight.trackingAppName}
                                      </span>
                                    </div>
                                  )}
                                  {insight.acquisitionSourceOther && (
                                    <div>
                                      <span className="text-gray-500 block text-xs mb-0.5">
                                        Other Source
                                      </span>
                                      <span className="text-gray-800">
                                        {insight.acquisitionSourceOther}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="px-6 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Load More ({filtered.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
