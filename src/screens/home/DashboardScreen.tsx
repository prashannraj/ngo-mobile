import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { formatDateTimeYmdHms } from '../../lib/date';
import { useNavigation } from '@react-navigation/native';
import { AppCard, AppHeader, EmptyState, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';
import { useLanguage } from '../../context/LanguageContext';

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
    <AppCard style={{ flex: 1, margin: 6, padding: 16 }}>
      <Text style={[typography.muted, { fontWeight: '900' }]}>{label}</Text>
      <Text style={{ fontSize: 26, fontWeight: '900', marginTop: 8, color: colors.text }}>{value}</Text>
    </AppCard>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();

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
    { label: t('dashboard.stat.totalEmployees'), value: stats.employees ?? 0 },
    { label: t('dashboard.stat.activeProjects'), value: stats.projects ?? 0 },
    { label: t('dashboard.stat.pendingLeaves'), value: stats.pending_leaves ?? 0 },
    { label: t('dashboard.stat.todayAttendance'), value: stats.attendance_today ?? 0 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader
        title="Appan HRM Office Automation"
        titleNumberOfLines={2}
        left={
          <Image
            source={require('../../../assets/appan_logo.png')}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
          />
        }
        right={
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
                    backgroundColor: colors.danger,
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
        }
      />

      <ScrollView contentContainerStyle={{ padding: spacing.sm }}>
        <View style={{ flexDirection: 'row' }}>
          <StatCard label={statCards[0].label} value={statCards[0].value} />
          <StatCard label={statCards[1].label} value={statCards[1].value} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <StatCard label={statCards[2].label} value={statCards[2].value} />
          <StatCard label={statCards[3].label} value={statCards[3].value} />
        </View>

        <AppCard style={{ marginTop: spacing.sm, padding: 16 }}>
          <Text style={[typography.h2]}>{t('dashboard.recentActivity')}</Text>

          {activitiesQuery.isLoading ? (
            <LoadingState label={t('common.loading')} />
          ) : activities.length === 0 ? (
            <EmptyState title={t('dashboard.noRecentActivityTitle')} subtitle={t('dashboard.noRecentActivitySubtitle')} />
          ) : (
            <View style={{ marginTop: 10 }}>
              {activities.map((a) => (
                <View key={a.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <Text style={{ fontWeight: '900', color: colors.text }}>
                    {a.description || `${a.module} • ${a.action}`}
                  </Text>
                  <Text style={{ color: '#64748B', marginTop: 4, fontSize: 12, fontWeight: '700' }}>
                    {a.user?.name ? `${a.user.name} • ` : ''}
                    {String(a.module).toUpperCase()} • {String(a.action).toUpperCase()}
                  </Text>
                  <Text style={[typography.mono, { marginTop: 6 }]}>
                    {formatDateTimeYmdHms(a.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </AppCard>
      </ScrollView>
    </View>
  );
}

