import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useNavigation } from '@react-navigation/native';

async function fetchEmployees() {
  const res = await apiClient.get('/employees?per_page=50');
  return res.data?.data?.data ?? res.data?.data?.data?.data ?? [];
}

export default function EmployeesScreen() {
  const query = useQuery({ queryKey: ['employeesList'], queryFn: fetchEmployees });
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={{ color: '#2563EB', fontWeight: '800' }}>Back</Text>
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '900' }}>Employees</Text>
        </View>

        {query.isLoading ? (
          <View style={{ marginTop: 16 }}>
            <ActivityIndicator color="#2563EB" />
          </View>
        ) : query.data?.length ? (
          <View style={{ marginTop: 12 }}>
            {query.data.map((e: any) => (
              <View key={e.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}>
                <Text style={{ fontWeight: '900' }}>{e.first_name} {e.last_name}</Text>
                <Text style={{ marginTop: 6, color: '#64748B' }}>
                  ID: {e.employee_id} | Designation: {e.designation?.name ?? '-'}
                </Text>
                <Text style={{ marginTop: 6, color: '#64748B' }}>Dept: {e.department?.name ?? '-'}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ marginTop: 16, color: '#6B7280', fontWeight: '700' }}>No employees found.</Text>
        )}
      </View>
    </ScrollView>
  );
}

