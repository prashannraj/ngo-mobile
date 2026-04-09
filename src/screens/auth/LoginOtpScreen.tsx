import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AppButton, AppInput, ErrorBanner } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

const schema = z.object({
  otp_code: z.string().regex(/^\d{6}$/, { message: 'OTP must be 6 digits' }),
});

type FormValues = z.infer<typeof schema>;

export default function LoginOtpScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { setSession } = useAuth();

  const { loginId } = route.params as { loginId: string };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { otp_code: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/login/verify-otp', {
        login_id: loginId,
        otp_code: values.otp_code,
      });

      const token = res.data?.data?.token;
      const user = res.data?.data?.user;
      if (!token || !user) {
        setError('Invalid server response.');
        return;
      }

      await setSession(token, user);
    } catch (e: any) {
      setError(e.response?.data?.message || 'OTP verification failed');
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
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>Enter the 6-digit code sent to your email and mobile.</Text>

        {!!error ? <View style={{ marginTop: spacing.lg }}><ErrorBanner message={error} /></View> : null}

        <AppInput
          label="OTP Code"
          value={form.watch('otp_code')}
          onChangeText={(t) => form.setValue('otp_code', t, { shouldValidate: true })}
          keyboardType="number-pad"
          placeholder="123456"
          error={form.formState.errors.otp_code?.message}
        />

        <AppButton title="Verify" onPress={form.handleSubmit(onSubmit)} loading={loading} style={{ marginTop: spacing.lg }} />
        <AppButton
          title="Use forgot password instead"
          variant="outline"
          onPress={() => navigation.navigate('ForgotPasswordRequest')}
          style={{ marginTop: spacing.md }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

