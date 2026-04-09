import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, Text, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radius, typography } from '../theme/tokens';

type Variant = 'primary' | 'outline' | 'danger' | 'soft';

export function AppButton({
  title,
  loading,
  disabled,
  variant = 'primary',
  leftIcon,
  style,
  textStyle,
  ...rest
}: PressableProps & {
  title: string;
  loading?: boolean;
  variant?: Variant;
  leftIcon?: React.ReactNode;
  textStyle?: any;
}) {
  const isDisabled = disabled || loading;

  const base: ViewStyle = {
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.7 : 1,
    flexDirection: 'row',
    gap: 10,
  };

  const variantStyle: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: colors.primary }
      : variant === 'danger'
        ? { backgroundColor: colors.danger }
        : variant === 'soft'
          ? { backgroundColor: '#EEF2FF' }
          : { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1' };

  const titleColor =
    variant === 'outline' ? colors.primary : variant === 'soft' ? '#3730A3' : '#fff';

  return (
    <Pressable {...rest} disabled={isDisabled} style={[base, variantStyle, style]}>
      {!loading && leftIcon ? leftIcon : null}
      {loading ? <ActivityIndicator color={titleColor} /> : null}
      <Text style={[typography.body, { color: titleColor }, textStyle]}>{title}</Text>
    </Pressable>
  );
}

