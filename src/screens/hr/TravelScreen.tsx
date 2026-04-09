import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDateTimeYmdHms } from '../../lib/date';

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
  const roles = (user?.roles ?? []) as string[];

  const isEmployee = roles.includes('Employee');
  const isApprover = roles.some((r) => ['Admin', 'HR', 'Line Manager'].includes(r));

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settleLoadingId, setSettleLoadingId] = useState<number | null>(null);
  const [settleValue, setSettleValue] = useState<string>('0');

  const travelQuery = useQuery({ queryKey: ['travelRequests'], queryFn: fetchTravel });
  const requests = travelQuery.data ?? [];

  const form = useForm<TravelValues>({
    resolver: zodResolver(travelSchema),
    defaultValues: { destination: '', purpose: '', start_date: '', end_date: '', estimated_budget: '0' },
  });

  const onSubmit = async (values: TravelValues) => {
    setError(null);
    setSubmitLoading(true);
    try {
      await apiClient.post('/travel-requests', {
        destination: values.destination,
        purpose: values.purpose,
        start_date: values.start_date,
        end_date: values.end_date,
        estimated_budget: values.estimated_budget ? Number(values.estimated_budget) : 0,
      });
      form.reset({ destination: '', purpose: '', start_date: '', end_date: '', estimated_budget: '0' });
      await travelQuery.refetch();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit travel request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const approve = async (id: number) => {
    await apiClient.post(`/travel-requests/${id}/approve`);
    await travelQuery.refetch();
  };

  const reject = async (id: number) => {
    await apiClient.post(`/travel-requests/${id}/reject`);
    await travelQuery.refetch();
  };

  const settle = async (id: number) => {
    setSettleLoadingId(id);
    try {
      await apiClient.post(`/travel-requests/${id}/settle`, { actual_expenditure: Number(settleValue) });
      setSettleLoadingId(null);
      await travelQuery.refetch();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to settle');
      setSettleLoadingId(null);
    }
  };

  const shown = useMemo(() => requests, [requests]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Travel</Text>
        <Text style={{ color: '#64748B', marginTop: 6 }}>Apply travel and track approval/settlement.</Text>

        <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Apply for Travel</Text>
          {!isEmployee ? (
            <Text style={{ color: '#6B7280', marginTop: 8 }}>Creation is restricted to Employee role.</Text>
          ) : (
            <>
              <Text style={{ marginTop: 10 }}>Destination</Text>
              <TextInput value={form.watch('destination')} onChangeText={(t) => form.setValue('destination', t, { shouldValidate: true })} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} placeholder="Pokhara" />

              <Text style={{ marginTop: 10 }}>Purpose</Text>
              <TextInput value={form.watch('purpose')} onChangeText={(t) => form.setValue('purpose', t, { shouldValidate: true })} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} placeholder="Workshop facilitation" />

              <Text style={{ marginTop: 10 }}>Start Date (YYYY-MM-DD)</Text>
              <TextInput value={form.watch('start_date')} onChangeText={(t) => form.setValue('start_date', t, { shouldValidate: true })} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} placeholder="2026-04-20" />

              <Text style={{ marginTop: 10 }}>End Date (YYYY-MM-DD)</Text>
              <TextInput value={form.watch('end_date')} onChangeText={(t) => form.setValue('end_date', t, { shouldValidate: true })} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} placeholder="2026-04-22" />

              <Text style={{ marginTop: 10 }}>Estimated Budget (NRP)</Text>
              <TextInput value={form.watch('estimated_budget') ?? '0'} onChangeText={(t) => form.setValue('estimated_budget', t, { shouldValidate: true })} keyboardType="decimal-pad" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} placeholder="0" />

              {!!error && <Text style={{ color: '#DC2626', marginTop: 10 }}>{error}</Text>}

              <Pressable onPress={form.handleSubmit(onSubmit)} disabled={submitLoading} style={{ marginTop: 14, backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: submitLoading ? 0.7 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: '900' }}>{submitLoading ? 'Submitting...' : 'Submit Travel'}</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Travel Requests</Text>
          {travelQuery.isLoading ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 12 }} />
          ) : shown.length === 0 ? (
            <Text style={{ color: '#6B7280', marginTop: 12, fontWeight: '700' }}>No travel requests found.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {shown.map((r: any) => (
                <View key={r.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '900' }}>{r.destination}</Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>
                    {formatDateTimeYmdHms(r.start_date)} → {formatDateTimeYmdHms(r.end_date)}
                  </Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>Purpose: {r.purpose ?? '-'}</Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>
                    Budget: {r.estimated_budget ?? 0} | Status: {String(r.status).toUpperCase()}
                  </Text>

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

                  {isApprover && r.status === 'approved' ? (
                    <View style={{ marginTop: 12 }}>
                      <Text style={{ color: '#64748B', fontWeight: '700' }}>Settle (Actual Expenditure)</Text>
                      <TextInput
                        value={settleValue}
                        onChangeText={setSettleValue}
                        keyboardType="decimal-pad"
                        style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
                        placeholder="0"
                      />
                      <Pressable onPress={() => settle(r.id)} disabled={settleLoadingId === r.id} style={{ marginTop: 10, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: settleLoadingId === r.id ? 0.7 : 1 }}>
                        <Text style={{ color: '#fff', fontWeight: '900' }}>{settleLoadingId === r.id ? 'Settling...' : 'Settle Travel'}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

