'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { listUsers, grantUserEntitlement } from '../../actions/admin-actions';
import UserDetailPanel from '@/components/admin/UserDetailPanel';

interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string | null;
  notificationsEnabled: boolean;
  languageSelected: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'userId'>('email');
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [grantingUserId, setGrantingUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadUsers = async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await listUsers({
        pageSize: 20,
        lastDocId: reset ? null : lastDocId,
        searchQuery: searchQuery.trim() || null,
        searchType,
      });

      if (result.error) {
        console.error('Error:', result.error);
        return;
      }

      if (reset) {
        setUsers(result.users);
      } else {
        setUsers((prev) => [...prev, ...result.users]);
      }

      setLastDocId(result.nextPageToken);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadUsers(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(true);
  };

  const handleGrantEntitlement = async (userId: string) => {
    if (!confirm('Grant 1-year Pro entitlement to this user?')) {
      return;
    }

    setGrantingUserId(userId);
    try {
      const result = await grantUserEntitlement({
        userId,
        entitlementId: 'Pro',
        duration: 'yearly',
      });

      if (result.success) {
        alert('Entitlement granted successfully!');
      } else {
        alert(`Failed to grant entitlement: ${result.error}`);
      }
    } catch (error) {
      console.error('Error granting entitlement:', error);
      alert('An error occurred');
    } finally {
      setGrantingUserId(null);
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>

        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'email' | 'userId')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="email">Email</option>
            <option value="userId">User ID</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchType === 'email' ? 'Search by email...' : 'Enter user ID...'}
            className="flex-1 sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            Search
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notifications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">{user.email || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.displayName || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.languageSelected.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.notificationsEnabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {user.notificationsEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGrantEntitlement(user.id);
                            }}
                            disabled={grantingUserId === user.id}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            {grantingUserId === user.id ? 'Granting...' : 'Grant Pro'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {hasMore && (
            <div className="text-center py-4">
              <Button onClick={() => loadUsers(false)} disabled={loadingMore} variant="outline">
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* User Detail Panel */}
      {selectedUserId && (
        <UserDetailPanel
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
