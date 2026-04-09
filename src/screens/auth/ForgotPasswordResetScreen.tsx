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

const schema = z
  .object({
    new_password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    new_password_confirmation: z.string(),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: 'Passwords do not match',
    path: ['new_password_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordResetScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { resetId } = route.params as { resetId: string };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: '', new_password_confirmation: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setLoading(true);
    try {
      await apiClient.post('/forgot-password/reset', {
        reset_id: resetId,
        new_password: values.new_password,
        new_password_confirmation: values.new_password_confirmation,
      });
      navigation.navigate('Login');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Password reset failed');
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
        <Text style={[typography.title, { fontSize: 24 }]}>Reset Password</Text>
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>Set a new password for your account.</Text>

        {!!error ? <View style={{ marginTop: spacing.lg }}><ErrorBanner message={error} /></View> : null}

        <AppInput
          label="New Password"
          value={form.watch('new_password')}
          onChangeText={(t) => form.setValue('new_password', t, { shouldValidate: true })}
          secureTextEntry
          placeholder="New password"
          error={form.formState.errors.new_password?.message}
        />

        <AppInput
          label="Confirm Password"
          value={form.watch('new_password_confirmation')}
          onChangeText={(t) => form.setValue('new_password_confirmation', t, { shouldValidate: true })}
          secureTextEntry
          placeholder="Confirm password"
          error={form.formState.errors.new_password_confirmation?.message}
        />

        <AppButton title="Update Password" onPress={form.handleSubmit(onSubmit)} loading={loading} style={{ marginTop: spacing.lg }} />
      </View>
    </KeyboardAvoidingView>
  );
}

