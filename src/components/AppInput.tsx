import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/tokens';

export function AppInput({
  label,
  error,
  containerStyle,
  inputStyle,
  ...rest
}: TextInputProps & {
  label: string;
  error?: string | null;
  containerStyle?: any;
  inputStyle?: any;
}) {
  return (
    <View style={[{ marginTop: spacing.md }, containerStyle]}>
      <Text style={[typography.body, { fontWeight: '900' }]}>{label}</Text>
      <TextInput
        {...rest}
        style={[
          {
            marginTop: spacing.xs,
            borderWidth: 1,
            borderColor: error ? colors.danger : '#E5E7EB',
            borderRadius: radius.sm,
            padding: 12,
            backgroundColor: '#fff',
            color: colors.text,
          },
          inputStyle,
        ]}
        placeholderTextColor="#94A3B8"
      />
      {!!error ? <Text style={{ color: colors.danger, marginTop: spacing.xs, fontWeight: '700' }}>{error}</Text> : null}
    </View>
  );
}

