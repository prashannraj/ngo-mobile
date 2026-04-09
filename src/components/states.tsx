import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/tokens';
import { AppButton } from './AppButton';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={{ padding: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[typography.muted, { marginTop: spacing.sm }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title = 'No data',
  subtitle,
  actionTitle,
  onAction,
}: {
  title?: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ padding: spacing.lg }}>
      <Text style={[typography.h2]}>{title}</Text>
      {!!subtitle ? <Text style={[typography.muted, { marginTop: spacing.xs }]}>{subtitle}</Text> : null}
      {!!actionTitle && !!onAction ? (
        <AppButton title={actionTitle} onPress={onAction} variant="outline" style={{ marginTop: spacing.md }} />
      ) : null}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View
      style={{
        backgroundColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        borderWidth: 1,
        padding: spacing.md,
        borderRadius: 14,
      }}
    >
      <Text style={{ color: colors.danger, fontWeight: '800' }}>{message}</Text>
    </View>
  );
}

