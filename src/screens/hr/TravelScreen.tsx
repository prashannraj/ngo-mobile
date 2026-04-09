import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDateTimeYmdHms } from '../../lib/date';
import { AppButton, AppCard, AppHeader, AppInput, EmptyState, ErrorBanner, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { radius, spacing, typography } from '../../theme/tokens';

const travelSchema = z.object({
  destination: z.string().min(1),
  purpose: z.string().min(5),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  estimated_budget: z.string().optional(),
});

type TravelValues = z.infer<typeof travelSchema>;

async function fetchTravel() {
  const res = await apiClient.get('/travel-requests?per_page=50');
  return res.data?.data?.data ?? [];
}

export default function TravelScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const roles = (user?.roles ?? []) as string[];

  const isEmployee = roles.includes('Employee');
  const isApprover = roles.some((r) => ['Admin', 'HR', 'Line Manager'].includes(r));

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settleForId, setSettleForId] = useState<number | null>(null);
  const [settleValue, setSettleValue] = useState<string>('0');

  const travelQuery = useQuery({ queryKey: ['travelRequests'], queryFn: fetchTravel });
  const requests = travelQuery.data ?? [];

  const form = useForm<TravelValues>({
    resolver: zodResolver(travelSchema),
    defaultValues: { destination: '', purpose: '', start_date: '', end_date: '', estimated_budget: '0' },
  });

  const createTravel = useMutation({
    mutationFn: async (values: TravelValues) => {
      await apiClient.post('/travel-requests', {
        destination: values.destination,
        purpose: values.purpose,
        start_date: values.start_date,
        end_date: values.end_date,
        estimated_budget: values.estimated_budget ? Number(values.estimated_budget) : 0,
      });
    },
    onSuccess: async () => {
      form.reset({ destination: '', purpose: '', start_date: '', end_date: '', estimated_budget: '0' });
      await qc.invalidateQueries({ queryKey: ['travelRequests'] });
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to submit travel request'),
    onSettled: () => setSubmitLoading(false),
  });

  const approve = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/travel-requests/${id}/approve`);
    },
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['travelRequests'] }),
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to approve'),
  });

  const reject = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/travel-requests/${id}/reject`);
    },
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['travelRequests'] }),
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to reject'),
  });

  const settle = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/travel-requests/${id}/settle`, { actual_expenditure: Number(settleValue || 0) });
    },
    onSuccess: async () => {
      setSettleForId(null);
      setSettleValue('0');
      await qc.invalidateQueries({ queryKey: ['travelRequests'] });
    },
    onError: (e: any) => alert(e.response?.data?.message || 'Failed to settle'),
  });

  const onSubmit = async (values: TravelValues) => {
    setError(null);
    setSubmitLoading(true);
    await createTravel.mutateAsync(values);
  };

  const shown = useMemo(() => requests, [requests]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Travel" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.muted]}>Apply travel and track approval/settlement.</Text>
        {!!error ? <View style={{ marginTop: spacing.md }}><ErrorBanner message={error} /></View> : null}

        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h2]}>Apply for Travel</Text>
          {!isEmployee ? (
            <Text style={[typography.muted, { marginTop: spacing.sm }]}>Creation is restricted to Employee role.</Text>
          ) : (
            <>
              <AppInput
                label="Destination"
                value={form.watch('destination')}
                onChangeText={(t) => form.setValue('destination', t, { shouldValidate: true })}
                placeholder="Pokhara"
                error={form.formState.errors.destination?.message}
              />

              <AppInput
                label="Purpose"
                value={form.watch('purpose')}
                onChangeText={(t) => form.setValue('purpose', t, { shouldValidate: true })}
                placeholder="Workshop facilitation"
                error={form.formState.errors.purpose?.message}
              />

              <AppInput
                label="Start Date (YYYY-MM-DD)"
                value={form.watch('start_date')}
                onChangeText={(t) => form.setValue('start_date', t, { shouldValidate: true })}
                placeholder="2026-04-20"
                error={form.formState.errors.start_date?.message}
              />

              <AppInput
                label="End Date (YYYY-MM-DD)"
                value={form.watch('end_date')}
                onChangeText={(t) => form.setValue('end_date', t, { shouldValidate: true })}
                placeholder="2026-04-22"
                error={form.formState.errors.end_date?.message}
              />

              <AppInput
                label="Estimated Budget (NRP)"
                value={form.watch('estimated_budget') ?? '0'}
                onChangeText={(t) => form.setValue('estimated_budget', t, { shouldValidate: true })}
                keyboardType="decimal-pad"
                placeholder="0"
              />

              <AppButton
                title={submitLoading ? 'Submitting...' : 'Submit Travel'}
                onPress={form.handleSubmit(onSubmit)}
                loading={submitLoading}
                style={{ marginTop: spacing.md }}
              />
            </>
          )}
        </AppCard>

        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h2]}>Travel Requests</Text>
          {travelQuery.isLoading ? (
            <LoadingState />
          ) : shown.length === 0 ? (
            <EmptyState title="No travel requests" subtitle="When you apply for travel, it will show here." />
          ) : (
            <View style={{ marginTop: spacing.sm }}>
              {shown.map((r: any) => (
                <AppCard key={r.id} style={{ marginBottom: spacing.sm }}>
                  <Text style={{ fontWeight: '900', color: colors.text }}>{r.destination}</Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                    {formatDateTimeYmdHms(r.start_date)} → {formatDateTimeYmdHms(r.end_date)}
                  </Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]} numberOfLines={2}>
                    Purpose: {r.purpose ?? '-'}
                  </Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                    Budget: {r.estimated_budget ?? 0} | Status: {String(r.status).toUpperCase()}
                  </Text>

                  {isApprover && r.status === 'pending' ? (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
                      <AppButton title="Approve" onPress={() => approve.mutate(r.id)} loading={approve.isPending} style={{ flex: 1 }} />
                      <AppButton title="Reject" variant="danger" onPress={() => reject.mutate(r.id)} loading={reject.isPending} style={{ flex: 1 }} />
                    </View>
                  ) : null}

                  {isApprover && r.status === 'approved' ? (
                    <View style={{ marginTop: spacing.md }}>
                      <AppButton title="Settle" variant="outline" onPress={() => setSettleForId(r.id)} />
                    </View>
                  ) : null}
                </AppCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal transparent visible={!!settleForId} animationType="fade" onRequestClose={() => setSettleForId(null)}>
        <Pressable
          onPress={() => setSettleForId(null)}
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', padding: spacing.lg, justifyContent: 'center' }}
        >
          <Pressable onPress={() => undefined} style={{ backgroundColor: '#fff', borderRadius: radius.xl, overflow: 'hidden' }}>
            <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <Text style={[typography.h2]}>Settle Travel</Text>
              <Text style={[typography.muted, { marginTop: spacing.xs }]}>Enter actual expenditure (NRP).</Text>
            </View>
            <View style={{ padding: spacing.lg }}>
              <AppInput label="Actual Expenditure" value={settleValue} onChangeText={setSettleValue} keyboardType="decimal-pad" placeholder="0" />
              <AppButton
                title={settle.isPending ? 'Settling...' : 'Confirm Settle'}
                onPress={() => (settleForId ? settle.mutate(settleForId) : null)}
                loading={settle.isPending}
                style={{ marginTop: spacing.md }}
              />
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => setSettleForId(null)}
                disabled={settle.isPending}
                style={{ marginTop: spacing.md }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

