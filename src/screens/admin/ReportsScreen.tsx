import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { formatDateTimeYmdHms } from '../../lib/date';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useQueryClient } from '@tanstack/react-query';

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function downloadExcel(url: string, token: string, filename: string) {
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) throw new Error('Storage is not available.');

  const fileUri = `${dir}${filename}`;
  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.uri;
}

export default function ReportsScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [busy, setBusy] = useState<string | null>(null);

  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 14);
    return { start: toYmd(start), end: toYmd(end) };
  }, []);

  const base = apiClient.defaults.baseURL || '';

  const handleDownload = async (key: string, endpoint: string, filename: string, qs?: string) => {
    if (!token) return;
    setBusy(key);
    try {
      const url = `${base}${endpoint}${qs ? `?${qs}` : ''}`;
      const uri = await downloadExcel(url, token, filename);
      await Sharing.shareAsync(uri);
      queryClient.invalidateQueries();
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Reports (Excel)</Text>
        <Text style={{ color: '#64748B', marginTop: 6 }}>
          Default range: {range.start} to {range.end}
        </Text>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '900', marginBottom: 10 }}>Export</Text>

          <Pressable
            onPress={() => handleDownload('leaves', '/reports/leaves/export-excel', `leave_requests.xlsx`)}
            disabled={!token || !!busy}
            style={{ backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10, opacity: busy ? 0.7 : 1 }}
          >
            <Text style={{ color: '#fff', fontWeight: '900' }}>{busy === 'leaves' ? 'Downloading...' : 'Leave Report'}</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              handleDownload(
                'attendance',
                '/reports/attendance/export-excel',
                `attendance.xlsx`,
                `start_date=${encodeURIComponent(range.start)}&end_date=${encodeURIComponent(range.end)}`,
              )
            }
            disabled={!token || !!busy}
            style={{ backgroundColor: '#16A34A', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10, opacity: busy ? 0.7 : 1 }}
          >
            <Text style={{ color: '#fff', fontWeight: '900' }}>{busy === 'attendance' ? 'Downloading...' : 'Attendance Report'}</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              handleDownload(
                'timesheets',
                '/reports/timesheets/export-excel',
                `timesheets.xlsx`,
                `start_date=${encodeURIComponent(range.start)}&end_date=${encodeURIComponent(range.end)}`,
              )
            }
            disabled={!token || !!busy}
            style={{ backgroundColor: '#F59E0B', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10, opacity: busy ? 0.7 : 1 }}
          >
            <Text style={{ color: '#fff', fontWeight: '900' }}>{busy === 'timesheets' ? 'Downloading...' : 'Timesheet Report'}</Text>
          </Pressable>

          <Pressable
            onPress={() => handleDownload('assets', '/reports/assets/export-excel', `assets.xlsx`)}
            disabled={!token || !!busy}
            style={{ backgroundColor: '#0EA5E9', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10, opacity: busy ? 0.7 : 1 }}
          >
            <Text style={{ color: '#fff', fontWeight: '900' }}>{busy === 'assets' ? 'Downloading...' : 'Assets Report'}</Text>
          </Pressable>

          <Pressable
            onPress={() => handleDownload('vehicles', '/reports/vehicles/export-excel', `vehicles.xlsx`)}
            disabled={!token || !!busy}
            style={{ backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10, opacity: busy ? 0.7 : 1 }}
          >
            <Text style={{ color: '#fff', fontWeight: '900' }}>{busy === 'vehicles' ? 'Downloading...' : 'Vehicles Report'}</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              handleDownload(
                'travel',
                '/reports/travel/export-excel',
                `travel_requests.xlsx`,
                `start_date=${encodeURIComponent(range.start)}&end_date=${encodeURIComponent(range.end)}`,
              )
            }
            disabled={!token || !!busy}
            style={{ backgroundColor: '#DC2626', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10, opacity: busy ? 0.7 : 1 }}
          >
            <Text style={{ color: '#fff', fontWeight: '900' }}>{busy === 'travel' ? 'Downloading...' : 'Travel Report'}</Text>
          </Pressable>
        </View>

        {busy ? (
          <View style={{ marginTop: 12 }}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

