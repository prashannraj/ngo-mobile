import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

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
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Office Settings</Text>
        <Text style={{ color: '#64748B', marginTop: 6 }}>Configure office information and SMS gateway template.</Text>

        {settingsQuery.isLoading ? (
          <View style={{ marginTop: 16 }}>
            <ActivityIndicator color="#2563EB" />
          </View>
        ) : (
          <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9' }}>
            <Text style={{ fontWeight: '900' }}>NGO Name</Text>
            <TextInput
              value={form.watch('ngo_name')}
              onChangeText={(t) => form.setValue('ngo_name', t, { shouldValidate: true })}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
              editable={canEdit}
            />
            {form.formState.errors.ngo_name?.message ? (
              <Text style={{ color: '#DC2626', marginTop: 6 }}>{form.formState.errors.ngo_name.message}</Text>
            ) : null}

            <Text style={{ fontWeight: '900', marginTop: 14 }}>NGO Address</Text>
            <TextInput
              value={form.watch('ngo_address')}
              onChangeText={(t) => form.setValue('ngo_address', t, { shouldValidate: true })}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
              editable={canEdit}
              placeholder="Office address..."
            />
            {form.formState.errors.ngo_address?.message ? (
              <Text style={{ color: '#DC2626', marginTop: 6 }}>{form.formState.errors.ngo_address.message}</Text>
            ) : null}

            <Text style={{ fontWeight: '900', marginTop: 14 }}>SMS Gateway API (URL template)</Text>
            <TextInput
              value={form.watch('sms_gateway_api') ?? ''}
              onChangeText={(t) => form.setValue('sms_gateway_api', t, { shouldValidate: true })}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8, minHeight: 80 }}
              editable={canEdit}
              placeholder="e.g. https://gateway.com/send?to={to}&message={message}"
              multiline
            />
            <Text style={{ color: '#64748B', marginTop: 8, fontSize: 12 }}>
              Placeholders: <Text style={{ fontFamily: 'monospace' }}>{'{to}'}</Text> and <Text style={{ fontFamily: 'monospace' }}>{'{message}'}</Text>
            </Text>

            {!canEdit ? (
              <Text style={{ color: '#6B7280', marginTop: 12, fontWeight: '700' }}>
                Only Super Admin can edit and save settings.
              </Text>
            ) : null}

            {!!submitError && <Text style={{ color: '#DC2626', marginTop: 12 }}>{submitError}</Text>}

            <Pressable
              onPress={form.handleSubmit(onSubmit)}
              disabled={!canEdit || submitLoading}
              style={{
                marginTop: 14,
                backgroundColor: canEdit ? '#2563EB' : '#CBD5E1',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: submitLoading ? 0.7 : 1,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '900' }}>{submitLoading ? 'Saving...' : 'Save Settings'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

