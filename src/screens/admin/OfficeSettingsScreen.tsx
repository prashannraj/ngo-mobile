import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { AppButton, AppCard, AppHeader, AppInput, ErrorBanner, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

const schema = z.object({
  ngo_name: z.string().min(1, 'NGO name is required'),
  ngo_address: z.string().min(1, 'NGO address is required'),
  sms_gateway_api: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

async function fetchSettings() {
  const res = await apiClient.get('/office-settings');
  return res.data?.data ?? res.data ?? null;
}

export default function OfficeSettingsScreen() {
  const { user } = useAuth();
  const canEdit = useMemo(() => user?.name === 'Super Admin', [user?.name]);

  const settingsQuery = useQuery({ queryKey: ['officeSettings'], queryFn: fetchSettings });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ngo_name: '', ngo_address: '', sms_gateway_api: '' },
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    form.reset({
      ngo_name: settingsQuery.data.ngo_name ?? '',
      ngo_address: settingsQuery.data.ngo_address ?? '',
      sms_gateway_api: settingsQuery.data.sms_gateway_api ?? '',
    });
  }, [settingsQuery.data]);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      await apiClient.post('/office-settings', {
        ngo_name: values.ngo_name,
        ngo_address: values.ngo_address,
        sms_gateway_api: values.sms_gateway_api || null,
      });
      await settingsQuery.refetch();
      alert('Office settings updated successfully');
    } catch (e: any) {
      setSubmitError(e?.response?.data?.message || 'Failed to update office settings');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Office Settings" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.muted]}>Configure office information and SMS gateway template.</Text>

        {settingsQuery.isLoading ? (
          <LoadingState />
        ) : (
          <AppCard style={{ marginTop: spacing.lg }}>
            {!!submitError ? <ErrorBanner message={submitError} /> : null}

            <AppInput
              label="NGO Name"
              value={form.watch('ngo_name')}
              onChangeText={(t) => form.setValue('ngo_name', t, { shouldValidate: true })}
              editable={canEdit}
              error={form.formState.errors.ngo_name?.message}
            />

            <AppInput
              label="NGO Address"
              value={form.watch('ngo_address')}
              onChangeText={(t) => form.setValue('ngo_address', t, { shouldValidate: true })}
              editable={canEdit}
              placeholder="Office address..."
              error={form.formState.errors.ngo_address?.message}
            />

            <AppInput
              label="SMS Gateway API (URL template)"
              value={form.watch('sms_gateway_api') ?? ''}
              onChangeText={(t) => form.setValue('sms_gateway_api', t, { shouldValidate: true })}
              editable={canEdit}
              placeholder="e.g. https://gateway.com/send?to={to}&message={message}"
              multiline
              inputStyle={{ minHeight: 80, textAlignVertical: 'top' }}
            />

            <Text style={[typography.muted, { marginTop: spacing.sm, fontSize: 12 }]}>
              Placeholders: <Text style={{ fontFamily: 'monospace' }}>{'{to}'}</Text> and{' '}
              <Text style={{ fontFamily: 'monospace' }}>{'{message}'}</Text>
            </Text>

            {!canEdit ? (
              <Text style={[typography.muted, { marginTop: spacing.md, fontWeight: '800' }]}>
                Only Super Admin can edit and save settings.
              </Text>
            ) : null}

            <AppButton
              title={submitLoading ? 'Saving...' : 'Save Settings'}
              onPress={form.handleSubmit(onSubmit)}
              disabled={!canEdit}
              loading={submitLoading}
              style={{ marginTop: spacing.lg }}
            />
          </AppCard>
        )}
      </ScrollView>
    </View>
  );
}

