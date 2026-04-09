import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppButton, AppCard, AppHeader, AppInput, AppSelect, EmptyState, ErrorBanner, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { radius, spacing, typography } from '../../theme/tokens';

async function fetchVehicles() {
  const res = await apiClient.get('/vehicles?per_page=50');
  return res.data?.data?.data ?? res.data?.data ?? [];
}

async function fetchVehicleRequests() {
  const res = await apiClient.get('/vehicle-requests?per_page=50');
  return res.data?.data?.data ?? res.data?.data ?? [];
}

const requestSchema = z.object({
  vehicle_id: z.string().optional(),
  destination: z.string().min(1, { message: 'Destination is required' }),
  purpose: z.string().min(1, { message: 'Purpose is required' }),
  start_time: z.string().min(1, { message: 'Start time is required' }),
  end_time: z.string().min(1, { message: 'End time is required' }),
});

type RequestForm = z.infer<typeof requestSchema>;

export default function FleetScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const roles = (user?.roles ?? []) as string[];
  const isApprover = useMemo(() => roles.some((r) => ['Admin', 'HR', 'Fleet Manager'].includes(r) || r === 'Line Manager'), [roles]);
  const isEmployee = useMemo(() => roles.includes('Employee'), [roles]);

  const vehiclesQuery = useQuery({ queryKey: ['fleetVehicles'], queryFn: fetchVehicles });
  const requestsQuery = useQuery({ queryKey: ['vehicleRequests'], queryFn: fetchVehicleRequests });

  const [tab, setTab] = useState<'vehicles' | 'requests'>('requests');
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: { vehicle_id: '', destination: '', purpose: '', start_time: '', end_time: '' },
  });

  const vehicleOptions = (vehiclesQuery.data ?? []).map((v: any) => ({
    label: `${v.name ?? 'Vehicle'}${v.license_plate ? ` • ${v.license_plate}` : ''}`,
    value: String(v.id),
  }));

  const createRequest = useMutation({
    mutationFn: async (values: RequestForm) => {
      setError(null);
      await apiClient.post('/vehicle-requests', {
        vehicle_id: values.vehicle_id ? Number(values.vehicle_id) : null,
        destination: values.destination,
        purpose: values.purpose,
        start_time: values.start_time,
        end_time: values.end_time,
      });
    },
    onSuccess: async () => {
      form.reset({ vehicle_id: '', destination: '', purpose: '', start_time: '', end_time: '' });
      await qc.invalidateQueries({ queryKey: ['vehicleRequests'] });
      setTab('requests');
    },
    onError: (e: any) => setError(e?.response?.data?.message || 'Failed to create vehicle request'),
  });

  const approve = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/vehicle-requests/${id}/approve`);
    },
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['vehicleRequests'] }),
    onError: (e: any) => setError(e?.response?.data?.message || 'Failed to approve'),
  });

  const reject = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/vehicle-requests/${id}/reject`);
    },
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['vehicleRequests'] }),
    onError: (e: any) => setError(e?.response?.data?.message || 'Failed to reject'),
  });

  const complete = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/vehicle-requests/${id}/complete`, {});
    },
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['vehicleRequests'] }),
    onError: (e: any) => setError(e?.response?.data?.message || 'Failed to complete'),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Fleet" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {!!error ? <ErrorBanner message={error} /> : null}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.sm }}>
          <AppButton title="Requests" variant={tab === 'requests' ? 'primary' : 'outline'} onPress={() => setTab('requests')} style={{ flex: 1 }} />
          <AppButton title="Vehicles" variant={tab === 'vehicles' ? 'primary' : 'outline'} onPress={() => setTab('vehicles')} style={{ flex: 1 }} />
        </View>

        {tab === 'requests' ? (
          <>
            {isEmployee ? (
              <AppCard style={{ marginTop: spacing.lg }}>
                <Text style={[typography.h2]}>Create Vehicle Request</Text>
                <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                  Use date-time format: YYYY-MM-DD HH:MM:SS
                </Text>

                <AppSelect
                  label="Vehicle (optional)"
                  value={form.watch('vehicle_id')}
                  onChange={(v) => form.setValue('vehicle_id', v)}
                  options={vehicleOptions}
                  placeholder="Select a vehicle"
                />

                <AppInput
                  label="Destination"
                  value={form.watch('destination')}
                  onChangeText={(t) => form.setValue('destination', t, { shouldValidate: true })}
                  placeholder="e.g. Pokhara"
                  error={form.formState.errors.destination?.message}
                />

                <AppInput
                  label="Purpose"
                  value={form.watch('purpose')}
                  onChangeText={(t) => form.setValue('purpose', t, { shouldValidate: true })}
                  placeholder="e.g. Field visit"
                  error={form.formState.errors.purpose?.message}
                />

                <AppInput
                  label="Start Time"
                  value={form.watch('start_time')}
                  onChangeText={(t) => form.setValue('start_time', t, { shouldValidate: true })}
                  placeholder="2026-04-10 09:00:00"
                  error={form.formState.errors.start_time?.message}
                />

                <AppInput
                  label="End Time"
                  value={form.watch('end_time')}
                  onChangeText={(t) => form.setValue('end_time', t, { shouldValidate: true })}
                  placeholder="2026-04-10 18:00:00"
                  error={form.formState.errors.end_time?.message}
                />

                <AppButton
                  title={createRequest.isPending ? 'Submitting...' : 'Submit Request'}
                  onPress={form.handleSubmit((v) => createRequest.mutate(v))}
                  loading={createRequest.isPending}
                  style={{ marginTop: spacing.md }}
                />
              </AppCard>
            ) : null}

            <View style={{ marginTop: spacing.lg }}>
              <Text style={[typography.h2]}>Vehicle Requests</Text>
              {requestsQuery.isLoading ? (
                <LoadingState />
              ) : (requestsQuery.data ?? []).length === 0 ? (
                <EmptyState title="No vehicle requests" subtitle="When you request a vehicle, it will show here." />
              ) : (
                <View style={{ marginTop: spacing.sm }}>
                  {(requestsQuery.data ?? []).map((r: any) => (
                    <AppCard key={r.id} style={{ marginBottom: spacing.sm }}>
                      <Text style={{ fontWeight: '900', color: colors.text }}>
                        {r.employee ? `${r.employee.first_name ?? ''} ${r.employee.last_name ?? ''}`.trim() : 'Employee'}
                      </Text>
                      <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                        Destination: {r.destination ?? '-'} | Status: {String(r.status ?? '-').toUpperCase()}
                      </Text>
                      <Text style={[typography.muted, { marginTop: spacing.xs }]}>Vehicle: {r.vehicle?.name ?? '-'}</Text>
                      <Text style={[typography.muted, { marginTop: spacing.xs }]} numberOfLines={2}>
                        Purpose: {r.purpose ?? '-'}
                      </Text>

                      {isApprover && r.status === 'pending' ? (
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
                          <AppButton title="Approve" onPress={() => approve.mutate(r.id)} loading={approve.isPending} style={{ flex: 1 }} />
                          <AppButton title="Reject" variant="danger" onPress={() => reject.mutate(r.id)} loading={reject.isPending} style={{ flex: 1 }} />
                        </View>
                      ) : null}

                      {isApprover && r.status === 'approved' ? (
                        <View style={{ marginTop: spacing.md }}>
                          <AppButton title="Mark Completed" variant="outline" onPress={() => complete.mutate(r.id)} loading={complete.isPending} />
                        </View>
                      ) : null}
                    </AppCard>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typography.h2]}>Vehicle Inventory</Text>
            {vehiclesQuery.isLoading ? (
              <LoadingState />
            ) : (vehiclesQuery.data ?? []).length === 0 ? (
              <EmptyState title="No vehicles found" subtitle="Vehicles will appear here once added." />
            ) : (
              <View style={{ marginTop: spacing.sm }}>
                {(vehiclesQuery.data ?? []).map((v: any) => (
                  <AppCard key={v.id} style={{ marginBottom: spacing.sm }}>
                    <Text style={{ fontWeight: '900', color: colors.text }}>{v.name ?? 'Vehicle'}</Text>
                    <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                      Plate: {v.license_plate ?? '-'} | Type: {v.type ?? '-'}
                    </Text>
                    <Text style={[typography.muted, { marginTop: spacing.xs }]}>Status: {String(v.status ?? '-').toUpperCase()}</Text>
                  </AppCard>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

