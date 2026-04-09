import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useNavigation } from '@react-navigation/native';
import { AppButton, AppInput, ErrorBanner } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

const schema = z.object({
  email: z.string().email({ message: 'Enter a valid email' }),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordRequestScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/forgot-password/request', { email: values.email });
      const resetId = res.data?.data?.reset_id;
      if (!resetId) {
        setError('Reset request failed.');
        return;
      }
      navigation.navigate('ForgotPasswordVerify', { resetId: String(resetId) });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to request OTP');
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
        <Text style={[typography.title, { fontSize: 24 }]}>Forgot Password</Text>
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>Enter your email to receive an OTP.</Text>

        {!!error ? <View style={{ marginTop: spacing.lg }}><ErrorBanner message={error} /></View> : null}

        <AppInput
          label="Email"
          value={form.watch('email')}
          onChangeText={(t) => form.setValue('email', t, { shouldValidate: true })}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="username@appan.com"
          error={form.formState.errors.email?.message}
        />

        <AppButton title="Send OTP" onPress={form.handleSubmit(onSubmit)} loading={loading} style={{ marginTop: spacing.lg }} />
        <AppButton title="Back to login" variant="outline" onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.md }} />
      </View>
    </KeyboardAvoidingView>
  );
}

