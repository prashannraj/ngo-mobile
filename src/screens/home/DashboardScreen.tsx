import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { formatDateTimeYmdHms } from '../../lib/date';
import { useNavigation } from '@react-navigation/native';

async function fetchStats() {
  const res = await apiClient.get('/dashboard/stats');
  return res.data?.data ?? {};
}

async function fetchRecentActivities() {
  const res = await apiClient.get('/activity-logs?per_page=10');
  return res.data?.data?.data ?? [];
}

async function fetchUnreadCount() {
  const res = await apiClient.get('/notifications/unread-count');
  return Number(res.data?.data?.unread_count ?? 0);
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, margin: 4 }}>
      <Text style={{ color: '#6B7280', fontWeight: '700' }}>{label}</Text>
      <Text style={{ fontSize: 26, fontWeight: '900', marginTop: 8 }}>{value}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();

  const statsQuery = useQuery({ queryKey: ['dashboardStats'], queryFn: fetchStats });
  const activitiesQuery = useQuery({ queryKey: ['recentActivities'], queryFn: fetchRecentActivities });
  const unreadQuery = useQuery({
    queryKey: ['unreadNotificationsCount'],
    queryFn: fetchUnreadCount,
    refetchInterval: 15000,
  });

  const unreadCount = unreadQuery.data ?? 0;
  const stats = statsQuery.data ?? { employees: 0, projects: 0, pending_leaves: 0, attendance_today: 0 };
  const activities = (activitiesQuery.data ?? []) as any[];

  const statCards = [
    { label: 'Total Employees', value: stats.employees ?? 0 },
    { label: 'Active Projects', value: stats.projects ?? 0 },
    { label: 'Pending Leaves', value: stats.pending_leaves ?? 0 },
    { label: 'Today Attendance', value: stats.attendance_today ?? 0 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: '900', flex: 1 }}>Dashboard</Text>
        <Pressable onPress={() => navigation.navigate('Notifications')}>
          <View style={{ width: 42, height: 42, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="notifications-outline" size={22} color="#64748B" />
            {unreadCount > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: 2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: '#DC2626',
                  paddingHorizontal: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11 }}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 8 }}>
        <View style={{ flexDirection: 'row' }}>
          <StatCard label={statCards[0].label} value={statCards[0].value} />
          <StatCard label={statCards[1].label} value={statCards[1].value} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <StatCard label={statCards[2].label} value={statCards[2].value} />
          <StatCard label={statCards[3].label} value={statCards[3].value} />
        </View>

        <View style={{ marginTop: 10, backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Recent Activity</Text>

          {activitiesQuery.isLoading ? (
            <Text style={{ color: '#6B7280', marginTop: 10 }}>Loading recent activity...</Text>
          ) : activities.length === 0 ? (
            <Text style={{ color: '#6B7280', marginTop: 10 }}>No recent activity found.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {activities.map((a) => (
                <View key={a.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <Text style={{ fontWeight: '800', color: '#0F172A' }}>
                    {a.description || `${a.module} • ${a.action}`}
                  </Text>
                  <Text style={{ color: '#64748B', marginTop: 4, fontSize: 12 }}>
                    {a.user?.name ? `${a.user.name} • ` : ''}
                    {String(a.module).toUpperCase()} • {String(a.action).toUpperCase()}
                  </Text>
                  <Text style={{ color: '#64748B', marginTop: 6, fontSize: 12, fontWeight: '700', fontFamily: 'monospace' }}>
                    {formatDateTimeYmdHms(a.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

