import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useNavigation, useRoute } from '@react-navigation/native';

const schema = z.object({
  otp_code: z.string().regex(/^\d{6}$/, { message: 'OTP must be 6 digits' }),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordVerifyScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { resetId } = route.params as { resetId: string };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { otp_code: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setRemainingAttempts(null);
    setLoading(true);
    try {
      await apiClient.post('/forgot-password/verify-otp', {
        reset_id: resetId,
        otp_code: values.otp_code,
      });
      navigation.navigate('ForgotPasswordReset', { resetId });
    } catch (e: any) {
      setError(e.response?.data?.message || 'OTP verification failed');
      const remaining = e.response?.data?.data?.remaining_attempts;
      if (remaining != null) setRemainingAttempts(Number(remaining));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Verify OTP</Text>
        <Text style={{ color: '#6B7280', marginBottom: 16 }}>Enter the 6-digit OTP sent to your email.</Text>

        <Text>OTP Code</Text>
        <TextInput
          value={form.watch('otp_code')}
          onChangeText={(t) => form.setValue('otp_code', t, { shouldValidate: true })}
          keyboardType="number-pad"
          style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
          placeholder="123456"
        />

        {form.formState.errors.otp_code?.message ? (
          <Text style={{ color: '#DC2626', marginTop: 6 }}>{form.formState.errors.otp_code.message}</Text>
        ) : null}

        {!!remainingAttempts && remainingAttempts > 0 ? (
          <Text style={{ color: '#F59E0B', marginTop: 10 }}>Remaining attempts: {remainingAttempts}</Text>
        ) : null}

        {!!error && <Text style={{ color: '#DC2626', marginTop: 12 }}>{error}</Text>}

        <Pressable
          onPress={form.handleSubmit(onSubmit)}
          disabled={loading}
          style={{
            marginTop: 18,
            backgroundColor: '#2563EB',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Verify</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('ForgotPasswordRequest')} style={{ marginTop: 14, alignItems: 'center' }}>
          <Text style={{ color: '#2563EB', fontWeight: '600' }}>Request new OTP</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

