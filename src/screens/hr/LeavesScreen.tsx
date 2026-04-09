import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
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
import { useLanguage } from '../../context/LanguageContext';

const schema = z.object({
  leave_type_id: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  reason: z.string().min(5, { message: 'Reason must be at least 5 characters' }),
});

type FormValues = z.infer<typeof schema>;

async function fetchLeaveTypes() {
  try {
    const res = await apiClient.get('/leave-types-list');
    return res.data?.data ?? res.data ?? [];
  } catch (e: any) {
    const res = await apiClient.get('/leave-types');
    return res.data?.data ?? res.data ?? [];
  }
}

async function fetchLeaves() {
  const res = await apiClient.get('/leaves?per_page=50');
  return res.data?.data?.data ?? [];
}

export default function LeavesScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
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

  const createLeave = useMutation({
    mutationFn: async (values: FormValues) => {
      await apiClient.post('/leaves', {
        leave_type_id: Number(values.leave_type_id),
        start_date: values.start_date,
        end_date: values.end_date,
        reason: values.reason,
      });
    },
    onSuccess: async () => {
      form.reset({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
      await qc.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (e: any) => {
      setError(e.response?.data?.message || 'Failed to submit leave');
    },
    onSettled: () => setSubmitLoading(false),
  });

  const approveLeave = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/leaves/${id}/approve`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to approve leave'),
  });

  const rejectLeave = useMutation({
    mutationFn: async (id: number) => {
      // backend expects rejection_reason in body (see controller)
      await apiClient.post(`/leaves/${id}/reject`, { rejection_reason: 'Rejected by approver' });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to reject leave'),
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSubmitLoading(true);
    await createLeave.mutateAsync(values);
  };

  const typeOptions = (types ?? []).map((x: any) => ({
    label: x?.name ? String(x.name) : `${x?.id}`,
    value: String(x?.id ?? ''),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={t('nav.leaves')} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.muted]}>{t('leaves.subtitle')}</Text>

        {(typesQuery.isError || leavesQuery.isError) && !error ? (
          <View style={{ marginTop: spacing.md }}>
            <ErrorBanner message="Failed to load leave data. Please try again." />
          </View>
        ) : null}

        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h2]}>{t('leaves.applyTitle')}</Text>

          {!isEmployee ? (
            <Text style={[typography.muted, { marginTop: spacing.sm }]}>Creation is restricted to Employee role.</Text>
          ) : (
            <>
              {!!error ? (
                <View style={{ marginTop: spacing.md }}>
                  <ErrorBanner message={error} />
                </View>
              ) : null}

              <AppSelect
                label={t('leaves.leaveTypeId')}
                value={form.watch('leave_type_id')}
                onChange={(v) => form.setValue('leave_type_id', v, { shouldValidate: true })}
                options={typeOptions}
                placeholder="Select leave type"
                error={form.formState.errors.leave_type_id?.message}
              />

              <AppInput
                label={t('leaves.startDate')}
                value={form.watch('start_date')}
                onChangeText={(t) => form.setValue('start_date', t, { shouldValidate: true })}
                placeholder="2026-04-15"
              />

              <AppInput
                label={t('leaves.endDate')}
                value={form.watch('end_date')}
                onChangeText={(t) => form.setValue('end_date', t, { shouldValidate: true })}
                placeholder="2026-04-16"
              />

              <AppInput
                label={t('leaves.reason')}
                value={form.watch('reason')}
                onChangeText={(t) => form.setValue('reason', t, { shouldValidate: true })}
                placeholder="Family function"
                error={form.formState.errors.reason?.message}
              />

              <AppButton
                title={submitLoading ? t('leaves.submitting') : t('leaves.submit')}
                onPress={form.handleSubmit(onSubmit)}
                loading={submitLoading}
                style={{ marginTop: spacing.md }}
              />

              <Text style={[typography.muted, { marginTop: spacing.md, fontSize: 12 }]}>
                {t('leaves.tip')}
              </Text>
            </>
          )}
        </AppCard>

        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h2]}>{t('leaves.requestsTitle')}</Text>
          {leavesQuery.isLoading ? (
            <LoadingState />
          ) : leaves.length === 0 ? (
            <EmptyState title={t('leaves.noRequestsTitle')} subtitle={t('leaves.noRequestsSubtitle')} />
          ) : (
            <View style={{ marginTop: spacing.sm }}>
              {leaves.map((l: any) => (
                <AppCard key={l.id} style={{ marginBottom: spacing.sm }}>
                  <Text style={{ fontWeight: '900', color: colors.text }}>{l.leaveType?.name ?? 'Leave'}</Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                    Dates: {formatDateTimeYmdHms(l.start_date)} → {formatDateTimeYmdHms(l.end_date)}
                  </Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                    Days: {l.days ?? '-'} | Status: {String(l.status).toUpperCase()}
                  </Text>
                  {isApprover && l.status === 'pending' ? (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
                      <AppButton
                        title={t('leaves.approve')}
                        onPress={() => approveLeave.mutate(l.id)}
                        loading={approveLeave.isPending}
                        style={{ flex: 1 }}
                      />
                      <AppButton
                        title={t('leaves.reject')}
                        variant="danger"
                        onPress={() => rejectLeave.mutate(l.id)}
                        loading={rejectLeave.isPending}
                        style={{ flex: 1 }}
                      />
                    </View>
                  ) : null}
                </AppCard>
              ))}
            </View>
          )}
        </View>

        {typesQuery.isLoading ? null : types?.length ? (
          <AppCard style={{ marginTop: spacing.lg }}>
            <Text style={[typography.h2]}>{t('leaves.typesTitle')}</Text>
            {types.map((t: any) => (
              <Text key={t.id} style={{ marginTop: spacing.xs, color: '#334155', fontWeight: '700' }}>
                {t.id}: {t.name}
              </Text>
            ))}
          </AppCard>
        ) : null}
      </ScrollView>
    </View>
  );
}

