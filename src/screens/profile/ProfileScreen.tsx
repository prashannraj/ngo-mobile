import React from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

async function fetchProfile() {
  const res = await apiClient.get('/user');
  return res.data?.data?.user ?? res.data?.data ?? null;
}

export default function ProfileScreen() {
  const { user, clearSession } = useAuth();
  const navigation = useNavigation<any>();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  const profile = profileQuery.data ?? user;

  const roles = (profile?.roles ?? []) as string[];

  const isAdminArea =
    roles.some((r) => ['Admin', 'HR', 'Project Manager', 'Line Manager'].includes(r)) ||
    roles.some((r) => r === 'Super Admin');

  const logout = async () => {
    await clearSession();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>{profile?.name ?? 'User'}</Text>
        <Text style={{ color: '#64748B', marginTop: 4 }}>{profile?.email ?? '-'}</Text>

        <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
          <Text style={{ fontWeight: '800' }}>Roles</Text>
          {roles.length === 0 ? (
            <Text style={{ color: '#6B7280', marginTop: 6 }}>-</Text>
          ) : (
            roles.map((r) => (
              <Text key={r} style={{ marginTop: 6 }}>
                • {r}
              </Text>
            ))
          )}
        </View>

        <View style={{ marginTop: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
          <Text style={{ fontWeight: '800' }}>Employee Details</Text>
          <Text style={{ color: '#334155', marginTop: 6 }}>
            {profile?.employee?.designation?.name ? `Designation: ${profile.employee.designation.name}` : 'Designation: -'}
          </Text>
          <Text style={{ color: '#334155', marginTop: 6 }}>
            {profile?.employee?.department?.name ? `Department: ${profile.employee.department.name}` : 'Department: -'}
          </Text>
        </View>

        {isAdminArea ? (
          <View style={{ marginTop: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
            <Text style={{ fontWeight: '900' }}>Admin / Manager Tools</Text>
            <View style={{ marginTop: 12 }}>
              <Pressable onPress={() => navigation.navigate('AdminEmployees')} style={{ backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8 }}>
                <Text style={{ color: '#3730A3', fontWeight: '900' }}>Employees</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('AdminDesignations')} style={{ backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8 }}>
                <Text style={{ color: '#3730A3', fontWeight: '900' }}>Designations</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('AdminPayroll')} style={{ backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8 }}>
                <Text style={{ color: '#3730A3', fontWeight: '900' }}>Payroll</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('AdminAssets')} style={{ backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8 }}>
                <Text style={{ color: '#3730A3', fontWeight: '900' }}>Assets</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('AdminFleet')} style={{ backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8 }}>
                <Text style={{ color: '#3730A3', fontWeight: '900' }}>Fleet</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('OfficeSettings')} style={{ backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8 }}>
                <Text style={{ color: '#3730A3', fontWeight: '900' }}>Office Settings</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('AdminActivityLogs')} style={{ backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8 }}>
                <Text style={{ color: '#3730A3', fontWeight: '900' }}>Activity Logs</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Reports')} style={{ backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12 }}>
                <Text style={{ color: '#3730A3', fontWeight: '900' }}>Reports (Excel)</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={logout}
          style={{
            marginTop: 18,
            backgroundColor: '#DC2626',
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '900' }}>Logout</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

