import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { formatDateTimeYmdHms } from '../../lib/date';

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
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '900' }}>Notifications</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <Pressable
          onPress={handleMarkAllRead}
          style={{ backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>Mark all as read</Text>
        </Pressable>
      </View>

      {notificationsQuery.isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text style={{ color: '#6B7280', fontWeight: '700' }}>No notifications found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}>
          {notifications.map((n) => (
            <View key={n.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '900', color: '#0F172A' }}>{n.title || 'Notification'}</Text>
                <Text style={{ color: n.read_at ? '#64748B' : '#DC2626', fontWeight: '900' }}>{n.read_at ? 'READ' : 'UNREAD'}</Text>
              </View>
              <Text style={{ marginTop: 8, color: '#334155' }} numberOfLines={4}>
                {n.body || '-'}
              </Text>
              <Text style={{ marginTop: 10, color: '#64748B', fontWeight: '700', fontFamily: 'monospace' }}>
                {formatDateTimeYmdHms(n.created_at)}
              </Text>
              {!n.read_at ? (
                <Pressable
                  onPress={() => handleMarkRead(n.id)}
                  style={{ marginTop: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: '#2563EB', fontWeight: '800' }}>Mark read</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

