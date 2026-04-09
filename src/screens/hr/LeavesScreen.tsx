import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDateTimeYmdHms } from '../../lib/date';

const schema = z.object({
  leave_type_id: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  reason: z.string().min(5, { message: 'Reason must be at least 5 characters' }),
});

type FormValues = z.infer<typeof schema>;

async function fetchLeaveTypes() {
  const res = await apiClient.get('/leave-types');
  return res.data?.data ?? res.data ?? [];
}

async function fetchLeaves() {
  const res = await apiClient.get('/leaves?per_page=50');
  return res.data?.data?.data ?? [];
}

export default function LeavesScreen() {
  const { user } = useAuth();
  const roles = (user?.roles ?? []) as string[];

  const isEmployee = useMemo(() => roles.includes('Employee'), [roles]);
  const isApprover = useMemo(() => roles.some((r) => ['Admin', 'HR', 'Line Manager'].includes(r)), [roles]);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typesQuery = useQuery({ queryKey: ['leaveTypes'], queryFn: fetchLeaveTypes });
  const leavesQuery = useQuery({ queryKey: ['leaves'], queryFn: fetchLeaves });

  const types = typesQuery.data ?? [];
  const leaves = leavesQuery.data ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { leave_type_id: '', start_date: '', end_date: '', reason: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSubmitLoading(true);
    try {
      await apiClient.post('/leaves', {
        leave_type_id: Number(values.leave_type_id),
        start_date: values.start_date,
        end_date: values.end_date,
        reason: values.reason,
      });
      form.reset({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
      await leavesQuery.refetch();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit leave');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    await apiClient.post(`/leaves/${id}/approve`);
    await leavesQuery.refetch();
  };

  const handleReject = async (id: number) => {
    // backend expects rejection_reason in body (see controller)
    await apiClient.post(`/leaves/${id}/reject`, { rejection_reason: 'Rejected by approver' });
    await leavesQuery.refetch();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Leaves</Text>
        <Text style={{ color: '#64748B', marginTop: 6 }}>Apply leaves and track approval status.</Text>

        <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Apply for Leave</Text>

          {!isEmployee ? (
            <Text style={{ color: '#6B7280', marginTop: 8 }}>Creation is restricted to Employee role.</Text>
          ) : (
            <>
              <Text style={{ marginTop: 10 }}>Leave Type ID</Text>
              <TextInput
                value={form.watch('leave_type_id')}
                onChangeText={(t) => form.setValue('leave_type_id', t, { shouldValidate: true })}
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
                placeholder="e.g. 1"
              />

              <Text style={{ marginTop: 10 }}>Start Date (YYYY-MM-DD)</Text>
              <TextInput
                value={form.watch('start_date')}
                onChangeText={(t) => form.setValue('start_date', t, { shouldValidate: true })}
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
                placeholder="2026-04-15"
              />

              <Text style={{ marginTop: 10 }}>End Date (YYYY-MM-DD)</Text>
              <TextInput
                value={form.watch('end_date')}
                onChangeText={(t) => form.setValue('end_date', t, { shouldValidate: true })}
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
                placeholder="2026-04-16"
              />

              <Text style={{ marginTop: 10 }}>Reason</Text>
              <TextInput
                value={form.watch('reason')}
                onChangeText={(t) => form.setValue('reason', t, { shouldValidate: true })}
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
                placeholder="Family function"
              />

              {form.formState.errors.reason?.message ? (
                <Text style={{ color: '#DC2626', marginTop: 8 }}>{form.formState.errors.reason.message}</Text>
              ) : null}

              {!!error && <Text style={{ color: '#DC2626', marginTop: 10 }}>{error}</Text>}

              <Pressable
                onPress={form.handleSubmit(onSubmit)}
                disabled={submitLoading}
                style={{ marginTop: 14, backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: submitLoading ? 0.7 : 1 }}
              >
                <Text style={{ color: '#fff', fontWeight: '900' }}>{submitLoading ? 'Submitting...' : 'Submit Leave'}</Text>
              </Pressable>

              <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 12 }}>
                Tip: leave types are fetched below. Use the ID from that list.
              </Text>
            </>
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Leave Requests</Text>
          {leavesQuery.isLoading ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 12 }} />
          ) : leaves.length === 0 ? (
            <Text style={{ color: '#6B7280', marginTop: 12, fontWeight: '700' }}>No leave requests found.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {leaves.map((l: any) => (
                <View
                  key={l.id}
                  style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}
                >
                  <Text style={{ fontWeight: '900' }}>{l.leaveType?.name ?? 'Leave'}</Text>
                  <Text style={{ color: '#64748B', marginTop: 6 }}>
                    Dates: {formatDateTimeYmdHms(l.start_date)} → {formatDateTimeYmdHms(l.end_date)}
                  </Text>
                  <Text style={{ color: '#64748B', marginTop: 6 }}>
                    Days: {l.days ?? '-'} | Status: {String(l.status).toUpperCase()}
                  </Text>
                  {isApprover && l.status === 'pending' ? (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                      <Pressable
                        onPress={() => handleApprove(l.id)}
                        style={{ flex: 1, backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '900' }}>Approve</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleReject(l.id)}
                        style={{ flex: 1, backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '900' }}>Reject</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>

        {typesQuery.isLoading ? null : types?.length ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>Leave Types (IDs)</Text>
            {types.map((t: any) => (
              <Text key={t.id} style={{ marginTop: 6, color: '#334155' }}>
                {t.id}: {t.name}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

