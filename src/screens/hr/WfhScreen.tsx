import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDateTimeYmdHms } from '../../lib/date';
import { AppButton, AppCard, AppHeader, AppInput, AppSelect, EmptyState, ErrorBanner, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

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
  const qc = useQueryClient();
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

  const createWfh = useMutation({
    mutationFn: async (values: FormValues) => {
      await apiClient.post('/wfh-requests', {
        task_id: values.task_id ? Number(values.task_id) : null,
        work_date: values.work_date,
        days: Number(values.days),
        reason: values.reason,
      });
    },
    onSuccess: async () => {
      form.reset({ work_date: '', days: '1', reason: '', task_id: '' });
      await qc.invalidateQueries({ queryKey: ['wfhRequests'] });
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to submit WFH request'),
    onSettled: () => setSubmitLoading(false),
  });

  const approve = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/wfh-requests/${id}/approve`);
    },
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['wfhRequests'] }),
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to approve'),
  });

  const reject = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/wfh-requests/${id}/reject`);
    },
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['wfhRequests'] }),
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to reject'),
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSubmitLoading(true);
    await createWfh.mutateAsync(values);
  };

  const displayed = useMemo(() => requests, [requests]);
  const taskOptions = (tasks ?? []).map((t: any) => ({ label: t.title ?? `Task ${t.id}`, value: String(t.id) }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="WFH" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.muted]}>Request work-from-home and track approvals.</Text>

        {!!error ? <View style={{ marginTop: spacing.md }}><ErrorBanner message={error} /></View> : null}

        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h2]}>Apply WFH</Text>
          {!isEmployee ? (
            <Text style={[typography.muted, { marginTop: spacing.sm }]}>Creation is restricted to Employee role.</Text>
          ) : (
            <>
              <AppInput
                label="Work Date (YYYY-MM-DD)"
                value={form.watch('work_date')}
                onChangeText={(t) => form.setValue('work_date', t, { shouldValidate: true })}
                placeholder="2026-04-12"
                error={form.formState.errors.work_date?.message}
              />
              <AppInput
                label="Days"
                value={form.watch('days')}
                onChangeText={(t) => form.setValue('days', t, { shouldValidate: true })}
                keyboardType="decimal-pad"
                placeholder="1"
                error={form.formState.errors.days?.message}
              />
              <AppSelect
                label="Task (optional)"
                value={form.watch('task_id') ?? ''}
                onChange={(v) => form.setValue('task_id', v, { shouldValidate: true })}
                options={taskOptions}
                placeholder="Select a task"
              />
              <AppInput
                label="Reason"
                value={form.watch('reason')}
                onChangeText={(t) => form.setValue('reason', t, { shouldValidate: true })}
                placeholder="Medical appointment"
                error={form.formState.errors.reason?.message}
              />
              <AppButton
                title={submitLoading ? 'Submitting...' : 'Submit WFH'}
                onPress={form.handleSubmit(onSubmit)}
                loading={submitLoading}
                style={{ marginTop: spacing.md }}
              />
            </>
          )}
        </AppCard>

        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h2]}>Requests</Text>
          {wfhQuery.isLoading ? (
            <LoadingState />
          ) : displayed.length === 0 ? (
            <EmptyState title="No WFH requests" subtitle="When you apply for WFH, it will show here." />
          ) : (
            <View style={{ marginTop: spacing.sm }}>
              {displayed.map((r: any) => (
                <AppCard key={r.id} style={{ marginBottom: spacing.sm }}>
                  <Text style={{ fontWeight: '900', color: colors.text }}>
                    {r.employee ? `${r.employee.first_name ?? ''} ${r.employee.last_name ?? ''}`.trim() : 'Employee'}
                  </Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                    Date: {formatDateTimeYmdHms(r.work_date)} | Days: {r.days ?? '-'}
                  </Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]} numberOfLines={2}>
                    Reason: {r.reason ?? '-'}
                  </Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>Status: {String(r.status).toUpperCase()}</Text>

                  {isApprover && r.status === 'pending' ? (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
                      <AppButton title="Approve" onPress={() => approve.mutate(r.id)} loading={approve.isPending} style={{ flex: 1 }} />
                      <AppButton title="Reject" variant="danger" onPress={() => reject.mutate(r.id)} loading={reject.isPending} style={{ flex: 1 }} />
                    </View>
                  ) : null}
                </AppCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

