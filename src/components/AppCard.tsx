import React from 'react';
import { View, ViewProps } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/tokens';

export function AppCard(props: ViewProps) {
  const { style, ...rest } = props;
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: '#F1F5F9',
          padding: 14,
        },
        style,
      ]}
    />
  );
}

