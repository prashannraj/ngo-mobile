import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const schema = z.object({
  email: z.string().email({ message: 'Enter a valid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { setSession } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/login', {
        email: values.email,
        password: values.password,
      });

      const payload = res.data?.data;

      if (payload?.step === 'otp_required') {
        const loginId = String(payload.login_id);
        navigation.navigate('LoginOtp', { loginId });
        return;
      }

      const token = res.data?.data?.token as string | undefined;
      const user = res.data?.data?.user;
      if (!token || !user) {
        setError('Invalid server response.');
        return;
      }

      await setSession(token, user);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Login failed');
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
        <Text style={{ fontSize: 26, fontWeight: '700', marginBottom: 20 }}>Login</Text>

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

        <Text style={{ marginTop: 16 }}>Password</Text>
        <TextInput
          value={form.watch('password')}
          onChangeText={(t) => form.setValue('password', t, { shouldValidate: true })}
          secureTextEntry
          style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginTop: 8 }}
          placeholder="••••••••"
        />
        {form.formState.errors.password?.message ? (
          <Text style={{ color: '#DC2626', marginTop: 6 }}>{form.formState.errors.password.message}</Text>
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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>}
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('ForgotPasswordRequest')}
          style={{ marginTop: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#2563EB', fontWeight: '600' }}>Forgot password?</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
