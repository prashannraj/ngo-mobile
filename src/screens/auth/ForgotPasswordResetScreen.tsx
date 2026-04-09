import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useNavigation, useRoute } from '@react-navigation/native';

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
      style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Reset Password</Text>
        <Text style={{ color: '#6B7280', marginBottom: 16 }}>
          Set a new password for your account.
        </Text>

        <Text>New Password</Text>
        <TextInput
          value={form.watch('new_password')}
          onChangeText={(t) => form.setValue('new_password', t, { shouldValidate: true })}
          secureTextEntry
          style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
          placeholder="New password"
        />
        {form.formState.errors.new_password?.message ? (
          <Text style={{ color: '#DC2626', marginTop: 6 }}>{form.formState.errors.new_password.message}</Text>
        ) : null}

        <Text style={{ marginTop: 16 }}>Confirm Password</Text>
        <TextInput
          value={form.watch('new_password_confirmation')}
          onChangeText={(t) => form.setValue('new_password_confirmation', t, { shouldValidate: true })}
          secureTextEntry
          style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
          placeholder="Confirm password"
        />
        {form.formState.errors.new_password_confirmation?.message ? (
          <Text style={{ color: '#DC2626', marginTop: 6 }}>{form.formState.errors.new_password_confirmation.message}</Text>
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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Update Password</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

