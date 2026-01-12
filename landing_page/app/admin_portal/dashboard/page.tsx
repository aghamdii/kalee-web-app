'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listPromoCodes } from '../actions/admin-actions';

interface Stats {
  activePromoCodes: number;
  usedPromoCodes: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    activePromoCodes: 0,
    usedPromoCodes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await listPromoCodes({ pageSize: 100 });

        if (result.error) {
          console.error('Error:', result.error);
          setLoading(false);
          return;
        }

        const activeCount = result.promoCodes.filter((p) => p.status === 'active').length;
        const usedCount = result.promoCodes.filter((p) => p.status === 'used').length;

        setStats({
          activePromoCodes: activeCount,
          usedPromoCodes: usedCount,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      label: 'Active Promo Codes',
      value: stats.activePromoCodes,
      href: '/admin_portal/dashboard/promo-codes',
      color: 'bg-green-100 text-green-800',
    },
    {
      label: 'Used Promo Codes',
      value: stats.usedPromoCodes,
      href: '/admin_portal/dashboard/promo-codes',
      color: 'bg-gray-100 text-gray-800',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-sm font-medium text-gray-500">{card.label}</div>
                <div className={`text-3xl font-bold mt-2 ${card.color.split(' ')[1]}`}>
                  {card.value}
                </div>
              </Link>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/admin_portal/dashboard/promo-codes"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Generate Promo Code</div>
                <div className="text-sm text-gray-500">
                  Create a new single-use promo code for customers
                </div>
              </Link>
              <Link
                href="/admin_portal/dashboard/users"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">View Users</div>
                <div className="text-sm text-gray-500">Browse and search all registered users</div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
