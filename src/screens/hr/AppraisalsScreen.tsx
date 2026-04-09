import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDateTimeYmdHms } from '../../lib/date';

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
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Appraisals</Text>
        <Text style={{ color: '#64748B', marginTop: 6 }}>Goals, review, and workflow actions.</Text>

        {isEmployee ? (
          <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>Create Appraisal (Draft)</Text>
            <Text style={{ marginTop: 10 }}>Period</Text>
            <TextInput value={createForm.watch('period')} onChangeText={(t) => createForm.setValue('period', t, { shouldValidate: true })} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} placeholder="2026 Q1" />

            <Text style={{ marginTop: 10 }}>Goals (one per line)</Text>
            <TextInput
              value={createForm.watch('goalsText') ?? ''}
              onChangeText={(t) => createForm.setValue('goalsText', t)}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8, height: 90 }}
              placeholder="e.g. Deliver X\nImprove Y"
              multiline
            />

            <Text style={{ marginTop: 10 }}>Employee Comments (optional)</Text>
            <TextInput
              value={createForm.watch('employee_comments') ?? ''}
              onChangeText={(t) => createForm.setValue('employee_comments', t)}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
              placeholder="Comments"
            />

            <Pressable
              onPress={createForm.handleSubmit(handleCreate)}
              disabled={submitLoading}
              style={{ marginTop: 14, backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: submitLoading ? 0.7 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '900' }}>{submitLoading ? 'Creating...' : 'Create Appraisal'}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Records</Text>
          {appraisalsQuery.isLoading ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: 12 }} />
          ) : appraisals.length === 0 ? (
            <Text style={{ color: '#6B7280', marginTop: 12, fontWeight: '700' }}>No appraisals found.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {appraisals.map((a: any) => (
                <View key={a.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '900' }}>{a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : 'Employee'}</Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>Period: {a.period ?? '-'}</Text>
                  <Text style={{ marginTop: 6, color: '#64748B' }}>Status: {String(a.status).toUpperCase()}</Text>

                  {isEmployee && a.status === 'draft' ? (
                    <View style={{ marginTop: 12 }}>
                      <Pressable onPress={() => submit(a.id)} disabled={submitLoading} style={{ backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: submitLoading ? 0.7 : 1 }}>
                        <Text style={{ color: '#fff', fontWeight: '900' }}>{submitLoading ? 'Submitting...' : 'Submit'}</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {isApprover && a.status === 'submitted' ? (
                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                      <Pressable
                        onPress={() => setActiveReviewId(a.id)}
                        style={{ flex: 1, backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 8 }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '900' }}>Review</Text>
                      </Pressable>
                      <View style={{ flex: 1 }} />
                    </View>
                  ) : null}

                  {isApprover && a.status === 'reviewed' ? (
                    <View style={{ marginTop: 12 }}>
                      <Pressable onPress={() => setActiveCompleteId(a.id)} style={{ backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: '900' }}>Complete</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>

        {activeReviewId ? (
          <View style={{ marginTop: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>Review Appraisal #{activeReviewId}</Text>
            <Text style={{ marginTop: 10 }}>Ratings (comma/newline numbers)</Text>
            <TextInput value={reviewForm.watch('ratingsText') ?? ''} onChangeText={(t) => reviewForm.setValue('ratingsText', t)} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8, height: 70 }} multiline placeholder="4,5,3" />
            <Text style={{ marginTop: 10 }}>Appraiser Comments</Text>
            <TextInput value={reviewForm.watch('appraiser_comments') ?? ''} onChangeText={(t) => reviewForm.setValue('appraiser_comments', t)} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} placeholder="Comments" />
            <Pressable
              onPress={reviewForm.handleSubmit((vals) => review(activeReviewId, vals))}
              disabled={submitLoading}
              style={{ marginTop: 14, backgroundColor: '#16A34A', borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: submitLoading ? 0.7 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '900' }}>{submitLoading ? 'Saving...' : 'Submit Review'}</Text>
            </Pressable>
            <Pressable onPress={() => setActiveReviewId(null)} style={{ marginTop: 10, alignItems: 'center' }}>
              <Text style={{ color: '#2563EB', fontWeight: '800' }}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}

        {activeCompleteId ? (
          <View style={{ marginTop: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>Complete Appraisal #{activeCompleteId}</Text>
            <Text style={{ marginTop: 10 }}>Final Score</Text>
            <TextInput value={completeForm.watch('final_score') ?? '0'} onChangeText={(t) => completeForm.setValue('final_score', t, { shouldValidate: true })} keyboardType="decimal-pad" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} />
            <Text style={{ marginTop: 10 }}>Employee Comments (optional)</Text>
            <TextInput value={completeForm.watch('employee_comments') ?? ''} onChangeText={(t) => completeForm.setValue('employee_comments', t)} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }} />
            <Pressable
              onPress={completeForm.handleSubmit((vals) => complete(activeCompleteId, vals))}
              disabled={submitLoading}
              style={{ marginTop: 14, backgroundColor: '#DC2626', borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: submitLoading ? 0.7 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '900' }}>{submitLoading ? 'Saving...' : 'Complete Appraisal'}</Text>
            </Pressable>
            <Pressable onPress={() => setActiveCompleteId(null)} style={{ marginTop: 10, alignItems: 'center' }}>
              <Text style={{ color: '#2563EB', fontWeight: '800' }}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

