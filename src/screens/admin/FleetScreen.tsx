import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

async function fetchVehicles() {
  const res = await apiClient.get('/vehicles?per_page=50');
  return res.data?.data?.data ?? res.data?.data ?? [];
}

async function fetchVehicleRequests() {
  const res = await apiClient.get('/vehicle-requests?per_page=50');
  return res.data?.data?.data ?? res.data?.data ?? [];
}

export default function FleetScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const roles = (user?.roles ?? []) as string[];
  const isApprover = useMemo(() => roles.some((r) => ['Admin', 'HR', 'Fleet Manager'].includes(r) || r === 'Line Manager'), [roles]);

  const vehiclesQuery = useQuery({ queryKey: ['fleetVehicles'], queryFn: fetchVehicles });
  const requestsQuery = useQuery({ queryKey: ['vehicleRequests'], queryFn: fetchVehicleRequests });

  const approve = async (id: number) => {
    await apiClient.post(`/vehicle-requests/${id}/approve`);
    await requestsQuery.refetch();
  };

  const reject = async (id: number) => {
    await apiClient.post(`/vehicle-requests/${id}/reject`);
    await requestsQuery.refetch();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={{ color: '#2563EB', fontWeight: '800' }}>Back</Text>
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '900' }}>Fleet</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Vehicle Inventory</Text>
          {vehiclesQuery.isLoading ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 12 }} />
          ) : vehiclesQuery.data?.length ? (
            <View style={{ marginTop: 12 }}>
              {vehiclesQuery.data.map((v: any) => (
                <View key={v.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '900' }}>{v.name ?? 'Vehicle'}</Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>Plate: {v.license_plate ?? '-'} | Type: {v.type ?? '-'}</Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>Status: {String(v.status ?? '-').toUpperCase()}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ marginTop: 12, color: '#6B7280', fontWeight: '700' }}>No vehicles found.</Text>
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Vehicle Requests</Text>
          {requestsQuery.isLoading ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 12 }} />
          ) : requestsQuery.data?.length ? (
            <View style={{ marginTop: 12 }}>
              {requestsQuery.data.map((r: any) => (
                <View key={r.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '900' }}>
                    {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'Employee'}
                  </Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>
                    Destination: {r.destination ?? '-'} | Status: {String(r.status ?? '-').toUpperCase()}
                  </Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>Vehicle: {r.vehicle?.name ?? '-'}</Text>

                  {isApprover && r.status === 'pending' ? (
                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                      <Pressable onPress={() => approve(r.id)} style={{ flex: 1, backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 8 }}>
                        <Text style={{ color: '#fff', fontWeight: '900' }}>Approve</Text>
                      </Pressable>
                      <Pressable onPress={() => reject(r.id)} style={{ flex: 1, backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: '900' }}>Reject</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ marginTop: 12, color: '#6B7280', fontWeight: '700' }}>No vehicle requests found.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

