import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppButton, AppInput, ErrorBanner } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';
import { useLanguage } from '../../context/LanguageContext';

const schema = z.object({
  email: z.string().email({ message: 'Enter a valid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { setSession } = useAuth();
  const { t } = useLanguage();

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
      style={{ flex: 1, padding: spacing.xl, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ marginTop: spacing.xxl }}>
        <Image
          source={require('../../../assets/appan_logo.png')}
          style={{ width: 64, height: 64, marginBottom: spacing.md }}
          resizeMode="contain"
        />
        <Text style={[typography.title, { fontSize: 28 }]}>{t('app.name')}</Text>
        <Text style={[typography.muted, { marginTop: spacing.xs }]}>{t('login.subtitle')}</Text>

        {!!error ? <View style={{ marginTop: spacing.lg }}><ErrorBanner message={error} /></View> : null}

        <AppInput
          label={t('common.email')}
          value={form.watch('email')}
          onChangeText={(t) => form.setValue('email', t, { shouldValidate: true })}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="username@appan.com"
          error={form.formState.errors.email?.message}
        />

        <AppInput
          label={t('common.password')}
          value={form.watch('password')}
          onChangeText={(t) => form.setValue('password', t, { shouldValidate: true })}
          secureTextEntry
          placeholder="••••••••"
          error={form.formState.errors.password?.message}
        />

        <AppButton
          title={t('common.continue')}
          onPress={form.handleSubmit(onSubmit)}
          loading={loading}
          style={{ marginTop: spacing.lg }}
        />

        <AppButton
          title={t('common.forgotPassword')}
          variant="outline"
          onPress={() => navigation.navigate('ForgotPasswordRequest')}
          style={{ marginTop: spacing.md }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
