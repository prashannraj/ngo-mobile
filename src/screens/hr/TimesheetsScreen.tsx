import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDateTimeYmdHms } from '../../lib/date';

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
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Timesheets</Text>
        <Text style={{ color: '#64748B', marginTop: 6 }}>
          Submit hours and track approval workflow.
        </Text>

        {isEmployee ? (
          <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>Log Hours</Text>

            <Text style={{ marginTop: 10 }}>Task ID</Text>
            <TextInput
              value={form.watch('task_id')}
              onChangeText={(t) => form.setValue('task_id', t, { shouldValidate: true })}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
              placeholder="e.g. 5"
            />

            <Text style={{ marginTop: 10 }}>Date (YYYY-MM-DD)</Text>
            <TextInput
              value={form.watch('date')}
              onChangeText={(t) => form.setValue('date', t, { shouldValidate: true })}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
              placeholder={range.end}
            />

            <Text style={{ marginTop: 10 }}>Hours Worked</Text>
            <TextInput
              value={form.watch('hours_worked')}
              onChangeText={(t) => form.setValue('hours_worked', t, { shouldValidate: true })}
              keyboardType="decimal-pad"
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
              placeholder="1"
            />

            <Text style={{ marginTop: 10 }}>Description (optional)</Text>
            <TextInput
              value={form.watch('description') ?? ''}
              onChangeText={(t) => form.setValue('description', t)}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
              placeholder="Worked on task..."
            />

            {!!error ? <Text style={{ color: '#DC2626', marginTop: 10 }}>{error}</Text> : null}

            <Pressable
              onPress={form.handleSubmit(onSubmit)}
              disabled={submitLoading}
              style={{ marginTop: 14, backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: submitLoading ? 0.7 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '900' }}>{submitLoading ? 'Submitting...' : 'Submit Timesheet'}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Timesheet Entries</Text>
          {timesQuery.isLoading ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 12 }} />
          ) : timesheets.length === 0 ? (
            <Text style={{ color: '#6B7280', marginTop: 10, fontWeight: '700' }}>No timesheets found.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {timesheets.map((t: any) => (
                <View key={t.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '900' }}>{formatDateTimeYmdHms(t.date)}</Text>
                  <Text style={{ marginTop: 6, color: '#334155' }}>
                    Task: {t.task?.title ?? `#${t.task_id}`} | Hours: {t.hours_worked ?? '-'}
                  </Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>
                    Status: {String(t.status).toUpperCase()}
                  </Text>

                  {isApprover && t.status === 'submitted' ? (
                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                      <Pressable
                        onPress={() => handleApprove(t.id)}
                        style={{ flex: 1, backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 8 }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '900' }}>Approve</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleReject(t.id)}
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

        {!isEmployee && tasksQuery.isLoading ? null : null}

        {isEmployee && tasks.length ? (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>Available Tasks (IDs)</Text>
            {tasks.slice(0, 10).map((task: any) => (
              <Text key={task.id} style={{ marginTop: 6, color: '#334155' }}>
                {task.id}: {task.title}
              </Text>
            ))}
            {tasks.length > 10 ? <Text style={{ color: '#6B7280', marginTop: 6 }}>Showing first 10 tasks.</Text> : null}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

