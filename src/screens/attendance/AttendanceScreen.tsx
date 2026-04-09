import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { formatDateTimeYmdHms } from '../../lib/date';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

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
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Attendance</Text>
        <Text style={{ color: '#64748B', marginTop: 6 }}>Mobile check-in/out + last records.</Text>

        <View style={{ marginTop: 14, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
          {attendanceQuery.isLoading ? (
            <ActivityIndicator color="#2563EB" />
          ) : todayRecord?.check_in && !todayRecord?.check_out ? (
            <View>
              <Text style={{ color: '#6B7280', fontWeight: '900' }}>Shift Started</Text>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#2563EB', marginTop: 6 }}>{todayRecord.check_in}</Text>
              <Pressable
                onPress={() => handleMobileCheck('out')}
                disabled={busy}
                style={{
                  marginTop: 14,
                  backgroundColor: '#DC2626',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: busy ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '900' }}>{busy ? 'Checking out...' : 'Check Out Now'}</Text>
              </Pressable>
            </View>
          ) : todayRecord?.check_out ? (
            <View>
              <Text style={{ color: '#16A34A', fontWeight: '900', fontSize: 20 }}>Day Completed</Text>
              <Text style={{ color: '#64748B', marginTop: 8 }}>
                {todayRecord.check_in} - {todayRecord.check_out}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={{ color: '#6B7280', fontWeight: '600' }}>Welcome! Start your work session below.</Text>
              <Pressable
                onPress={() => handleMobileCheck('in')}
                disabled={busy}
                style={{
                  marginTop: 14,
                  backgroundColor: '#2563EB',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: busy ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '900' }}>{busy ? 'Checking in...' : 'Check In Now'}</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Attendance Records</Text>
        </View>

        {attendanceQuery.isLoading ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator color="#2563EB" />
          </View>
        ) : rows.length === 0 ? (
          <Text style={{ marginTop: 12, color: '#6B7280', fontWeight: '700' }}>No attendance records found.</Text>
        ) : (
          <View style={{ marginTop: 10 }}>
            {rows.map((r: any) => (
              <View
                key={r.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: '#F1F5F9',
                }}
              >
                <Text style={{ fontWeight: '900' }}>{formatDateTimeYmdHms(r.date)}</Text>
                <Text style={{ marginTop: 6, color: '#64748B' }}>
                  Check In: {r.check_in || '-'} | Check Out: {r.check_out || '-'}
                </Text>
                <Text style={{ marginTop: 6, color: '#64748B' }}>
                  Status: {String(r.status).toUpperCase()} | Source: {r.source || '-'}
                </Text>
                <Text style={{ marginTop: 6, color: '#64748B', fontFamily: 'monospace' }}>
                  Origin: {originLocation(r)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

