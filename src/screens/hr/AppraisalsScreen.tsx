import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { AppButton, AppCard, AppHeader, AppInput, EmptyState, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { radius, spacing, typography } from '../../theme/tokens';

const createSchema = z.object({
  period: z.string().min(1, 'Period is required'),
  goalsText: z.string().optional(),
  employee_comments: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;

const reviewSchema = z.object({
  ratingsText: z.string().optional(),
  appraiser_comments: z.string().optional(),
});

type ReviewValues = z.infer<typeof reviewSchema>;

const completeSchema = z.object({
  final_score: z.string().min(1, 'Score is required'),
  employee_comments: z.string().optional(),
});

type CompleteValues = z.infer<typeof completeSchema>;

function splitLines(s?: string) {
  if (!s) return [];
  return s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

function splitNumbers(s?: string) {
  if (!s) return [];
  return s
    .split(/[,\n]/g)
    .map((x) => Number(x.trim()))
    .filter((n) => !Number.isNaN(n));
}

async function fetchAppraisals() {
  const res = await apiClient.get('/appraisals?per_page=50');
  return res.data?.data?.data ?? [];
}

export default function AppraisalsScreen() {
  const { user } = useAuth();
  const roles = (user?.roles ?? []) as string[];

  const isEmployee = roles.includes('Employee');
  const isApprover = roles.some((r) => ['Admin', 'HR', 'Line Manager'].includes(r));

  const appraisalsQuery = useQuery({ queryKey: ['appraisals'], queryFn: fetchAppraisals });
  const appraisals = appraisalsQuery.data ?? [];

  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeReviewId, setActiveReviewId] = useState<number | null>(null);
  const [activeCompleteId, setActiveCompleteId] = useState<number | null>(null);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { period: '', goalsText: '', employee_comments: '' },
  });

  const reviewForm = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { ratingsText: '', appraiser_comments: '' },
  });

  const completeForm = useForm<CompleteValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: { final_score: '0', employee_comments: '' },
  });

  const handleCreate = async (values: CreateValues) => {
    setSubmitLoading(true);
    try {
      await apiClient.post('/appraisals', {
        period: values.period,
        goals: splitLines(values.goalsText),
        employee_comments: values.employee_comments || undefined,
        status: 'draft',
      });
      createForm.reset({ period: '', goalsText: '', employee_comments: '' });
      await appraisalsQuery.refetch();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to create appraisal');
    } finally {
      setSubmitLoading(false);
    }
  };

  const submit = async (id: number) => {
    setSubmitLoading(true);
    try {
      await apiClient.post(`/appraisals/${id}/submit`);
      await appraisalsQuery.refetch();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to submit appraisal');
    } finally {
      setSubmitLoading(false);
    }
  };

  const review = async (id: number, values: ReviewValues) => {
    setSubmitLoading(true);
    try {
      await apiClient.post(`/appraisals/${id}/review`, {
        ratings: splitNumbers(values.ratingsText),
        appraiser_comments: values.appraiser_comments || undefined,
      });
      setActiveReviewId(null);
      reviewForm.reset({ ratingsText: '', appraiser_comments: '' });
      await appraisalsQuery.refetch();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to review appraisal');
    } finally {
      setSubmitLoading(false);
    }
  };

  const complete = async (id: number, values: CompleteValues) => {
    setSubmitLoading(true);
    try {
      await apiClient.post(`/appraisals/${id}/complete`, {
        final_score: Number(values.final_score),
        employee_comments: values.employee_comments || undefined,
      });
      setActiveCompleteId(null);
      completeForm.reset({ final_score: '0', employee_comments: '' });
      await appraisalsQuery.refetch();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to complete appraisal');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Appraisals" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.muted]}>Goals, review, and workflow actions.</Text>

        {isEmployee ? (
          <AppCard style={{ marginTop: spacing.lg }}>
            <Text style={[typography.h2]}>Create Appraisal (Draft)</Text>

            <AppInput
              label="Period"
              value={createForm.watch('period')}
              onChangeText={(t) => createForm.setValue('period', t, { shouldValidate: true })}
              placeholder="2026 Q1"
              error={createForm.formState.errors.period?.message}
            />

            <AppInput
              label="Goals (one per line)"
              value={createForm.watch('goalsText') ?? ''}
              onChangeText={(t) => createForm.setValue('goalsText', t)}
              placeholder="e.g. Deliver X\nImprove Y"
              multiline
              inputStyle={{ minHeight: 90, textAlignVertical: 'top' }}
            />

            <AppInput
              label="Employee Comments (optional)"
              value={createForm.watch('employee_comments') ?? ''}
              onChangeText={(t) => createForm.setValue('employee_comments', t)}
              placeholder="Comments"
            />

            <AppButton
              title={submitLoading ? 'Creating...' : 'Create Appraisal'}
              onPress={createForm.handleSubmit(handleCreate)}
              loading={submitLoading}
              style={{ marginTop: spacing.md }}
            />
          </AppCard>
        ) : null}

        <View style={{ marginTop: spacing.lg }}>
          <Text style={[typography.h2]}>Records</Text>
          {appraisalsQuery.isLoading ? (
            <LoadingState />
          ) : appraisals.length === 0 ? (
            <EmptyState title="No appraisals found" subtitle="Records will appear here." />
          ) : (
            <View style={{ marginTop: spacing.sm }}>
              {appraisals.map((a: any) => (
                <AppCard key={a.id} style={{ marginBottom: spacing.sm }}>
                  <Text style={{ fontWeight: '900', color: colors.text }}>
                    {a.employee ? `${a.employee.first_name ?? ''} ${a.employee.last_name ?? ''}`.trim() : 'Employee'}
                  </Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>Period: {a.period ?? '-'}</Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>Status: {String(a.status).toUpperCase()}</Text>

                  {isEmployee && a.status === 'draft' ? (
                    <View style={{ marginTop: spacing.md }}>
                      <AppButton title={submitLoading ? 'Submitting...' : 'Submit'} onPress={() => submit(a.id)} loading={submitLoading} />
                    </View>
                  ) : null}

                  {isApprover && a.status === 'submitted' ? (
                    <View style={{ marginTop: spacing.md }}>
                      <AppButton title="Review" variant="outline" onPress={() => setActiveReviewId(a.id)} />
                    </View>
                  ) : null}

                  {isApprover && a.status === 'reviewed' ? (
                    <View style={{ marginTop: spacing.md }}>
                      <AppButton title="Complete" variant="danger" onPress={() => setActiveCompleteId(a.id)} />
                    </View>
                  ) : null}
                </AppCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal transparent visible={!!activeReviewId} animationType="fade" onRequestClose={() => setActiveReviewId(null)}>
        <Pressable
          onPress={() => setActiveReviewId(null)}
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', padding: spacing.lg, justifyContent: 'center' }}
        >
          <Pressable onPress={() => undefined} style={{ backgroundColor: '#fff', borderRadius: radius.xl, overflow: 'hidden' }}>
            <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <Text style={[typography.h2]}>Review Appraisal #{activeReviewId ?? ''}</Text>
            </View>
            <View style={{ padding: spacing.lg }}>
              <AppInput
                label="Ratings (comma/newline numbers)"
                value={reviewForm.watch('ratingsText') ?? ''}
                onChangeText={(t) => reviewForm.setValue('ratingsText', t)}
                multiline
                placeholder="4,5,3"
                inputStyle={{ minHeight: 70, textAlignVertical: 'top' }}
              />
              <AppInput
                label="Appraiser Comments"
                value={reviewForm.watch('appraiser_comments') ?? ''}
                onChangeText={(t) => reviewForm.setValue('appraiser_comments', t)}
                placeholder="Comments"
              />
              <AppButton
                title={submitLoading ? 'Saving...' : 'Submit Review'}
                onPress={reviewForm.handleSubmit((vals) => (activeReviewId ? review(activeReviewId, vals) : null))}
                loading={submitLoading}
                style={{ marginTop: spacing.md }}
              />
              <AppButton title="Cancel" variant="outline" onPress={() => setActiveReviewId(null)} style={{ marginTop: spacing.md }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={!!activeCompleteId} animationType="fade" onRequestClose={() => setActiveCompleteId(null)}>
        <Pressable
          onPress={() => setActiveCompleteId(null)}
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', padding: spacing.lg, justifyContent: 'center' }}
        >
          <Pressable onPress={() => undefined} style={{ backgroundColor: '#fff', borderRadius: radius.xl, overflow: 'hidden' }}>
            <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <Text style={[typography.h2]}>Complete Appraisal #{activeCompleteId ?? ''}</Text>
            </View>
            <View style={{ padding: spacing.lg }}>
              <AppInput
                label="Final Score"
                value={completeForm.watch('final_score') ?? '0'}
                onChangeText={(t) => completeForm.setValue('final_score', t, { shouldValidate: true })}
                keyboardType="decimal-pad"
                error={completeForm.formState.errors.final_score?.message}
              />
              <AppInput
                label="Employee Comments (optional)"
                value={completeForm.watch('employee_comments') ?? ''}
                onChangeText={(t) => completeForm.setValue('employee_comments', t)}
                placeholder="Comments"
              />
              <AppButton
                title={submitLoading ? 'Saving...' : 'Complete Appraisal'}
                variant="danger"
                onPress={completeForm.handleSubmit((vals) => (activeCompleteId ? complete(activeCompleteId, vals) : null))}
                loading={submitLoading}
                style={{ marginTop: spacing.md }}
              />
              <AppButton title="Cancel" variant="outline" onPress={() => setActiveCompleteId(null)} style={{ marginTop: spacing.md }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

