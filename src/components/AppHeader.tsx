import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/tokens';

export function AppHeader({
  title,
  left,
  right,
  showBack,
  onBack,
  titleNumberOfLines = 1,
}: {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  titleNumberOfLines?: number;
}) {
  const navigation = useNavigation<any>();
  const canGoBack = navigation?.canGoBack?.() ?? false;
  const shouldShowBack = showBack ?? canGoBack;

  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      {left ? (
        <View style={{ width: 42, height: 42, marginRight: 6, alignItems: 'center', justifyContent: 'center' }}>{left}</View>
      ) : shouldShowBack ? (
          <Pressable
            onPress={onBack ?? (() => navigation.goBack())}
            style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 42, height: 42, marginRight: 6 }} />
        )}

      <Text
        style={[typography.title, { flex: 1, fontSize: 18, lineHeight: 22 }]}
        numberOfLines={titleNumberOfLines}
        adjustsFontSizeToFit={titleNumberOfLines === 1}
        minimumFontScale={0.85}
      >
        {title}
      </Text>
      <View style={{ minWidth: 42, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

