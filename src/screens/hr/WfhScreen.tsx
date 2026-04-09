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
  work_date: z.string().min(1),
  days: z.string().min(1),
  reason: z.string().min(5),
  task_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

async function fetchWfh() {
  const res = await apiClient.get('/wfh-requests?per_page=50');
  return res.data?.data?.data ?? [];
}

async function fetchTasks() {
  const res = await apiClient.get('/tasks?per_page=200');
  return res.data?.data?.data ?? res.data?.data?.data?.data ?? [];
}

export default function WfhScreen() {
  const { user } = useAuth();
  const roles = (user?.roles ?? []) as string[];
  const isEmployee = roles.includes('Employee');
  const isApprover = roles.some((r) => ['Admin', 'HR', 'Line Manager'].includes(r));

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tasksQuery = useQuery({ queryKey: ['tasksForWfh'], queryFn: fetchTasks });
  const wfhQuery = useQuery({ queryKey: ['wfhRequests'], queryFn: fetchWfh });

  const tasks = tasksQuery.data ?? [];
  const requests = wfhQuery.data ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      work_date: '',
      days: '1',
      reason: '',
      task_id: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSubmitLoading(true);
    try {
      await apiClient.post('/wfh-requests', {
        task_id: values.task_id ? Number(values.task_id) : null,
        work_date: values.work_date,
        days: Number(values.days),
        reason: values.reason,
      });
      await wfhQuery.refetch();
      form.reset({ work_date: '', days: '1', reason: '', task_id: '' });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit WFH request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const approve = async (id: number) => {
    await apiClient.post(`/wfh-requests/${id}/approve`);
    await wfhQuery.refetch();
  };

  const reject = async (id: number) => {
    await apiClient.post(`/wfh-requests/${id}/reject`);
    await wfhQuery.refetch();
  };

  const displayed = useMemo(() => requests, [requests]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>WFH Requests</Text>
        <Text style={{ color: '#64748B', marginTop: 6 }}>Request work-from-home and track approvals.</Text>

        <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Apply WFH</Text>
          {!isEmployee ? (
            <Text style={{ color: '#6B7280', marginTop: 8 }}>Creation is restricted to Employee role.</Text>
          ) : (
            <>
              <Text style={{ marginTop: 10 }}>Work Date (YYYY-MM-DD)</Text>
              <TextInput
                value={form.watch('work_date')}
                onChangeText={(t) => form.setValue('work_date', t, { shouldValidate: true })}
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
                placeholder="2026-04-12"
              />
              <Text style={{ marginTop: 10 }}>Days</Text>
              <TextInput
                value={form.watch('days')}
                onChangeText={(t) => form.setValue('days', t, { shouldValidate: true })}
                keyboardType="decimal-pad"
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
                placeholder="1"
              />
              <Text style={{ marginTop: 10 }}>Task ID (optional)</Text>
              <TextInput
                value={form.watch('task_id') ?? ''}
                onChangeText={(t) => form.setValue('task_id', t, { shouldValidate: true })}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
                placeholder="(optional)"
              />
              <Text style={{ marginTop: 10 }}>Reason</Text>
              <TextInput
                value={form.watch('reason')}
                onChangeText={(t) => form.setValue('reason', t, { shouldValidate: true })}
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
                placeholder="Medical appointment"
              />
              {!!error && <Text style={{ color: '#DC2626', marginTop: 10 }}>{error}</Text>}
              <Pressable
                onPress={form.handleSubmit(onSubmit)}
                disabled={submitLoading}
                style={{ marginTop: 14, backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: submitLoading ? 0.7 : 1 }}
              >
                <Text style={{ color: '#fff', fontWeight: '900' }}>{submitLoading ? 'Submitting...' : 'Submit WFH'}</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Requests</Text>
          {wfhQuery.isLoading ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 12 }} />
          ) : displayed.length === 0 ? (
            <Text style={{ color: '#6B7280', marginTop: 12, fontWeight: '700' }}>No WFH requests found.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {displayed.map((r: any) => (
                <View key={r.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '900' }}>
                    {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'Employee'}
                  </Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>
                    Date: {formatDateTimeYmdHms(r.work_date)} | Days: {r.days ?? '-'}
                  </Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>Reason: {r.reason ?? '-'}</Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>Status: {String(r.status).toUpperCase()}</Text>

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
          )}
        </View>

        {isEmployee && tasks.length ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>Tasks (IDs)</Text>
            {tasks.slice(0, 8).map((t: any) => (
              <Text key={t.id} style={{ marginTop: 6, color: '#334155' }}>
                {t.id}: {t.title}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

