import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { formatDateTimeYmdHms } from '../../lib/date';

async function fetchActivityLogs(params: {
  per_page: number;
  search?: string;
  module?: string;
  action?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
}) {
  const res = await apiClient.get('/activity-logs', { params });
  return res.data?.data?.data ?? res.data?.data ?? [];
}

export default function ActivityLogsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const roles = (user?.roles ?? []) as string[];
  const isSuperAdmin = useMemo(() => roles.includes('Super Admin'), [roles]);

  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const logsQuery = useQuery({
    queryKey: ['activityLogs', search, module, action, userId, startDate, endDate],
    queryFn: () =>
      fetchActivityLogs({
        per_page: 20,
        search: search || undefined,
        module: module || undefined,
        action: action || undefined,
        user_id: userId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={{ color: '#2563EB', fontWeight: '800' }}>Back</Text>
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '900' }}>Activity Logs</Text>
        </View>

        {isSuperAdmin ? (
          <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
            <Text style={{ fontWeight: '900' }}>Filters</Text>
            <Text style={{ marginTop: 10, color: '#64748B' }}>Search</Text>
            <TextInput value={search} onChangeText={setSearch} placeholder="e.g. login" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} />
            <Text style={{ marginTop: 10, color: '#64748B' }}>Module</Text>
            <TextInput value={module} onChangeText={setModule} placeholder="e.g. Leave" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} />
            <Text style={{ marginTop: 10, color: '#64748B' }}>Action</Text>
            <TextInput value={action} onChangeText={setAction} placeholder="e.g. approve" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} />
            <Text style={{ marginTop: 10, color: '#64748B' }}>User ID</Text>
            <TextInput value={userId} onChangeText={setUserId} placeholder="e.g. 1" keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} />
            <Text style={{ marginTop: 10, color: '#64748B' }}>Start Date (YYYY-MM-DD)</Text>
            <TextInput value={startDate} onChangeText={setStartDate} placeholder="2026-04-01" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} />
            <Text style={{ marginTop: 10, color: '#64748B' }}>End Date (YYYY-MM-DD)</Text>
            <TextInput value={endDate} onChangeText={setEndDate} placeholder="2026-04-30" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} />
          </View>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Logs</Text>
          {logsQuery.isLoading ? (
            <View style={{ marginTop: 12 }}>
              <ActivityIndicator color="#2563EB" />
            </View>
          ) : logsQuery.data?.length ? (
            <View style={{ marginTop: 12 }}>
              {logsQuery.data.map((l: any) => (
                <View key={l.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '900' }}>{l.description || `${l.module} • ${l.action}`}</Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>
                    {l.user?.name ? `${l.user.name} • ` : ''}
                    {String(l.module).toUpperCase()} • {String(l.action).toUpperCase()}
                  </Text>
                  <Text style={{ marginTop: 6, color: '#64748B', fontFamily: 'monospace' }}>
                    {formatDateTimeYmdHms(l.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ marginTop: 12, color: '#6B7280', fontWeight: '700' }}>No logs found.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

