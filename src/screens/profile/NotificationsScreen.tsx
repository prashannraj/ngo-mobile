import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { formatDateTimeYmdHms } from '../../lib/date';
import { AppButton, AppCard, AppHeader, EmptyState, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

type NotificationRow = {
  id: number;
  title?: string;
  body?: string;
  read_at?: string | null;
  created_at: string;
};

async function fetchNotifications() {
  const res = await apiClient.get('/notifications?per_page=50');
  return res.data?.data ?? {};
}

async function markRead(id: number) {
  await apiClient.post(`/notifications/${id}/read`);
}

async function markAllRead() {
  await apiClient.post('/notifications/mark-all-read');
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const [optimisticTick, setOptimisticTick] = useState(0);

  const data = notificationsQuery.data ?? {};
  const notifications: NotificationRow[] = useMemo(() => data?.data ?? [], [data]);
  const pagination = data ?? null;

  const refetch = notificationsQuery.refetch;

  const handleMarkRead = async (id: number) => {
    await markRead(id);
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Notifications" />

      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <AppButton title="Mark all as read" onPress={handleMarkAllRead} />
      </View>

      {notificationsQuery.isLoading ? (
        <LoadingState />
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications" subtitle="When you receive notifications, they will appear here." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 30 }}>
          {notifications.map((n) => (
            <AppCard key={n.id} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '900', color: colors.text }}>{n.title || 'Notification'}</Text>
                <Text style={{ color: n.read_at ? '#64748B' : colors.danger, fontWeight: '900' }}>{n.read_at ? 'READ' : 'UNREAD'}</Text>
              </View>
              <Text style={{ marginTop: spacing.sm, color: '#334155', fontWeight: '600' }} numberOfLines={6}>
                {n.body || '-'}
              </Text>
              <Text style={[typography.mono, { marginTop: spacing.sm }]}>{formatDateTimeYmdHms(n.created_at)}</Text>
              {!n.read_at ? (
                <AppButton title="Mark read" variant="outline" onPress={() => handleMarkRead(n.id)} style={{ marginTop: spacing.md }} />
              ) : null}
            </AppCard>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

