import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppCard, AppHeader, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Reports (Excel)" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.muted]}>
          Default range: {range.start} to {range.end}
        </Text>

        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h2]}>Export</Text>

          <View style={{ marginTop: spacing.md, gap: 10 }}>
            <AppButton
              title={busy === 'leaves' ? 'Downloading...' : 'Leave Report'}
              leftIcon={<Ionicons name="calendar-outline" size={18} color="#fff" />}
              onPress={() => handleDownload('leaves', '/reports/leaves/export-excel', `leave_requests.xlsx`)}
              disabled={!token || !!busy}
              loading={busy === 'leaves'}
            />

            <AppButton
              title={busy === 'attendance' ? 'Downloading...' : 'Attendance Report'}
              leftIcon={<Ionicons name="finger-print-outline" size={18} color="#fff" />}
              onPress={() =>
                handleDownload(
                  'attendance',
                  '/reports/attendance/export-excel',
                  `attendance.xlsx`,
                  `start_date=${encodeURIComponent(range.start)}&end_date=${encodeURIComponent(range.end)}`,
                )
              }
              disabled={!token || !!busy}
              loading={busy === 'attendance'}
              style={{ backgroundColor: colors.success }}
            />

            <AppButton
              title={busy === 'timesheets' ? 'Downloading...' : 'Timesheet Report'}
              leftIcon={<Ionicons name="time-outline" size={18} color="#fff" />}
              onPress={() =>
                handleDownload(
                  'timesheets',
                  '/reports/timesheets/export-excel',
                  `timesheets.xlsx`,
                  `start_date=${encodeURIComponent(range.start)}&end_date=${encodeURIComponent(range.end)}`,
                )
              }
              disabled={!token || !!busy}
              loading={busy === 'timesheets'}
              style={{ backgroundColor: colors.warning }}
            />

            <AppButton
              title={busy === 'assets' ? 'Downloading...' : 'Assets Report'}
              leftIcon={<Ionicons name="cube-outline" size={18} color="#fff" />}
              onPress={() => handleDownload('assets', '/reports/assets/export-excel', `assets.xlsx`)}
              disabled={!token || !!busy}
              loading={busy === 'assets'}
              style={{ backgroundColor: '#0EA5E9' }}
            />

            <AppButton
              title={busy === 'vehicles' ? 'Downloading...' : 'Vehicles Report'}
              leftIcon={<Ionicons name="car-outline" size={18} color="#fff" />}
              onPress={() => handleDownload('vehicles', '/reports/vehicles/export-excel', `vehicles.xlsx`)}
              disabled={!token || !!busy}
              loading={busy === 'vehicles'}
              style={{ backgroundColor: '#7C3AED' }}
            />

            <AppButton
              title={busy === 'travel' ? 'Downloading...' : 'Travel Report'}
              leftIcon={<Ionicons name="airplane-outline" size={18} color="#fff" />}
              onPress={() =>
                handleDownload(
                  'travel',
                  '/reports/travel/export-excel',
                  `travel_requests.xlsx`,
                  `start_date=${encodeURIComponent(range.start)}&end_date=${encodeURIComponent(range.end)}`,
                )
              }
              disabled={!token || !!busy}
              loading={busy === 'travel'}
              variant="danger"
            />
          </View>
        </AppCard>

        {busy ? <LoadingState label="Preparing download..." /> : null}
      </ScrollView>
    </View>
  );
}

