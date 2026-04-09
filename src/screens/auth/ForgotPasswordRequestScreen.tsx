import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useNavigation } from '@react-navigation/native';

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
      style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Forgot Password</Text>
        <Text style={{ color: '#6B7280', marginBottom: 16 }}>Enter your email to receive an OTP.</Text>

        <Text>Email</Text>
        <TextInput
          value={form.watch('email')}
          onChangeText={(t) => form.setValue('email', t, { shouldValidate: true })}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
          placeholder="username@appan.com"
        />
        {form.formState.errors.email?.message ? (
          <Text style={{ color: '#DC2626', marginTop: 6 }}>{form.formState.errors.email.message}</Text>
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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Send OTP</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} style={{ marginTop: 14, alignItems: 'center' }}>
          <Text style={{ color: '#2563EB', fontWeight: '600' }}>Back to login</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

