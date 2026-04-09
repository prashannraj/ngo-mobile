import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDateTimeYmdHms } from '../../lib/date';
import { AppButton, AppCard, AppHeader, AppInput, AppSelect, EmptyState, ErrorBanner, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

const entrySchema = z.object({
  task_id: z.string().min(1, 'Task is required'),
  date: z.string().min(1, 'Date is required'),
  hours_worked: z.string().min(1, 'Hours are required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof entrySchema>;

async function fetchTasks() {
  const res = await apiClient.get('/tasks?per_page=200');
  return res.data?.data?.data ?? res.data?.data ?? [];
}

async function fetchTimesheets(start: string, end: string) {
  const res = await apiClient.get('/timesheets', {
    params: { start_date: start, end_date: end, per_page: 100 },
  });
  return res.data?.data?.data ?? res.data?.data?.data?.data ?? res.data?.data ?? [];
}

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function TimesheetsScreen() {
  const { user } = useAuth();
  const roles = (user?.roles ?? []) as string[];

  const isEmployee = roles.includes('Employee');
  const isApprover = roles.some((r) => ['Admin', 'HR', 'Project Manager'].includes(r));

  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 14);
    return { start: toYmd(start), end: toYmd(end) };
  }, []);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tasksQuery = useQuery({ queryKey: ['tasksForTimesheet'], queryFn: fetchTasks });
  const timesQuery = useQuery({
    queryKey: ['timesheets', range.start, range.end],
    queryFn: () => fetchTimesheets(range.start, range.end),
  });

  const tasks = tasksQuery.data ?? [];
  const timesheets = timesQuery.data ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      task_id: '',
      date: range.end,
      hours_worked: '1',
      description: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSubmitLoading(true);
    try {
      await apiClient.post('/timesheets', {
        task_id: Number(values.task_id),
        date: values.date,
        hours_worked: Number(values.hours_worked),
        description: values.description || '',
        status: 'submitted',
      });
      await timesQuery.refetch();
      form.reset({ task_id: '', date: values.date, hours_worked: '1', description: '' });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit timesheet');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    await apiClient.post(`/timesheets/${id}/approve`);
    await timesQuery.refetch();
  };

  const handleReject = async (id: number) => {
    await apiClient.post(`/timesheets/${id}/reject`);
    await timesQuery.refetch();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Timesheets" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.muted]}>Submit hours and track approval workflow.</Text>

        {!!error ? <View style={{ marginTop: spacing.md }}><ErrorBanner message={error} /></View> : null}

        {isEmployee ? (
          <AppCard style={{ marginTop: spacing.lg }}>
            <Text style={[typography.h2]}>Log Hours</Text>

            <AppSelect
              label="Task"
              value={form.watch('task_id')}
              onChange={(v) => form.setValue('task_id', v, { shouldValidate: true })}
              options={(tasks ?? []).map((t: any) => ({ label: t.title ?? `Task ${t.id}`, value: String(t.id) }))}
              placeholder="Select a task"
              error={form.formState.errors.task_id?.message}
            />

            <AppInput
              label="Date (YYYY-MM-DD)"
              value={form.watch('date')}
              onChangeText={(t) => form.setValue('date', t, { shouldValidate: true })}
              placeholder={range.end}
              error={form.formState.errors.date?.message}
            />

            <AppInput
              label="Hours Worked"
              value={form.watch('hours_worked')}
              onChangeText={(t) => form.setValue('hours_worked', t, { shouldValidate: true })}
              keyboardType="decimal-pad"
              placeholder="1"
              error={form.formState.errors.hours_worked?.message}
            />

            <AppInput
              label="Description (optional)"
              value={form.watch('description') ?? ''}
              onChangeText={(t) => form.setValue('description', t)}
              placeholder="Worked on task..."
            />

            <AppButton
              title={submitLoading ? 'Submitting...' : 'Submit Timesheet'}
              onPress={form.handleSubmit(onSubmit)}
              loading={submitLoading}
              style={{ marginTop: spacing.md }}
            />
          </AppCard>
        ) : null}

        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h2]}>Timesheet Entries</Text>
          {timesQuery.isLoading ? (
            <LoadingState />
          ) : timesheets.length === 0 ? (
            <EmptyState title="No timesheets found" subtitle="Your timesheet entries will appear here." />
          ) : (
            <View style={{ marginTop: spacing.sm }}>
              {timesheets.map((t: any) => (
                <AppCard key={t.id} style={{ marginBottom: spacing.sm }}>
                  <Text style={{ fontWeight: '900', color: colors.text }}>{formatDateTimeYmdHms(t.date)}</Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                    Task: {t.task?.title ?? `#${t.task_id}`} | Hours: {t.hours_worked ?? '-'}
                  </Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>Status: {String(t.status).toUpperCase()}</Text>

                  {isApprover && t.status === 'submitted' ? (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
                      <AppButton title="Approve" onPress={() => handleApprove(t.id)} style={{ flex: 1 }} />
                      <AppButton title="Reject" variant="danger" onPress={() => handleReject(t.id)} style={{ flex: 1 }} />
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

