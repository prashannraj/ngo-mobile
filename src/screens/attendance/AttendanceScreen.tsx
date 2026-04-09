import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { formatDateTimeYmdHms } from '../../lib/date';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppButton, AppCard, AppHeader, EmptyState, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

function originLocation(r: any) {
  const hasGps =
    r?.latitude != null &&
    r?.longitude != null &&
    String(r.latitude) !== '' &&
    String(r.longitude) !== '';
  if (hasGps) return `GPS: ${r.latitude}, ${r.longitude}`;
  const ip = r?.check_in_ip || r?.check_out_ip;
  if (ip) return `IP: ${ip}`;
  return '-';
}

async function fetchAttendance() {
  const res = await apiClient.get('/attendance?per_page=20');
  return res.data?.data?.data ?? [];
}

async function getCurrentLatLng() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission denied');

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest,
  });
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
}

export default function AttendanceScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [busy, setBusy] = useState(false);

  const attendanceQuery = useQuery({
    queryKey: ['attendance'],
    queryFn: fetchAttendance,
  });

  const rows = (attendanceQuery.data ?? []) as any[];

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const todayRecord = rows.find((r: any) => String(r.date).startsWith(todayStr));

  const handleMobileCheck = async (type: 'in' | 'out') => {
    if (busy) return;
    setBusy(true);
    try {
      const { latitude, longitude } = await getCurrentLatLng();
      await apiClient.post('/attendance/mobile', { type, latitude, longitude });
      await attendanceQuery.refetch();
    } catch (e: any) {
      // Backend usually returns a useful message; surface it.
      alert(e?.response?.data?.message || e?.message || 'Failed to perform check-in/out');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Attendance" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.muted]}>Mobile check-in/out + last records.</Text>

        <AppCard style={{ marginTop: spacing.lg }}>
          {attendanceQuery.isLoading ? (
            <LoadingState />
          ) : todayRecord?.check_in && !todayRecord?.check_out ? (
            <View>
              <Text style={[typography.muted, { fontWeight: '900' }]}>Shift Started</Text>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.primary, marginTop: spacing.xs }}>{todayRecord.check_in}</Text>
              <AppButton
                title={busy ? 'Checking out...' : 'Check Out Now'}
                variant="danger"
                onPress={() => handleMobileCheck('out')}
                loading={busy}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : todayRecord?.check_out ? (
            <View>
              <Text style={{ color: colors.success, fontWeight: '900', fontSize: 20 }}>Day Completed</Text>
              <Text style={[typography.muted, { marginTop: spacing.sm }]}>
                {todayRecord.check_in} - {todayRecord.check_out}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={[typography.muted]}>Welcome! Start your work session below.</Text>
              <AppButton
                title={busy ? 'Checking in...' : 'Check In Now'}
                onPress={() => handleMobileCheck('in')}
                loading={busy}
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}
        </AppCard>

        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h2]}>Attendance Records</Text>
        </View>

        {attendanceQuery.isLoading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState title="No attendance records" subtitle="Your attendance history will appear here." />
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            {rows.map((r: any) => (
              <AppCard key={r.id} style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontWeight: '900', color: colors.text }}>{formatDateTimeYmdHms(r.date)}</Text>
                <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                  Check In: {r.check_in || '-'} | Check Out: {r.check_out || '-'}
                </Text>
                <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                  Status: {String(r.status).toUpperCase()} | Source: {r.source || '-'}
                </Text>
                <Text style={[typography.mono, { marginTop: spacing.xs }]}>Origin: {originLocation(r)}</Text>
              </AppCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

