import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AppButton, AppInput, ErrorBanner } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

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
      style={{ flex: 1, padding: spacing.xl, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ marginTop: spacing.xxl }}>
        <Text style={[typography.title, { fontSize: 24 }]}>Verify OTP</Text>
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>Enter the 6-digit OTP sent to your email.</Text>

        {!!error ? <View style={{ marginTop: spacing.lg }}><ErrorBanner message={error} /></View> : null}
        {!!remainingAttempts && remainingAttempts > 0 ? (
          <Text style={{ color: '#F59E0B', marginTop: spacing.sm, fontWeight: '800' }}>Remaining attempts: {remainingAttempts}</Text>
        ) : null}

        <AppInput
          label="OTP Code"
          value={form.watch('otp_code')}
          onChangeText={(t) => form.setValue('otp_code', t, { shouldValidate: true })}
          keyboardType="number-pad"
          placeholder="123456"
          error={form.formState.errors.otp_code?.message}
        />

        <AppButton title="Verify" onPress={form.handleSubmit(onSubmit)} loading={loading} style={{ marginTop: spacing.lg }} />
        <AppButton title="Request new OTP" variant="outline" onPress={() => navigation.navigate('ForgotPasswordRequest')} style={{ marginTop: spacing.md }} />
      </View>
    </KeyboardAvoidingView>
  );
}

