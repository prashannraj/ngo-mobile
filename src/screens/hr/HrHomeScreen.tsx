import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppCard, AppHeader } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

type HrRouteName = 'Leaves' | 'Timesheets' | 'Wfh' | 'Travel' | 'Appraisals';

function Tile({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ width: '48%' }}>
      <AppCard style={{ padding: 16 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <Text style={[typography.h2, { marginTop: spacing.sm }]}>{title}</Text>
        <Text style={[typography.muted, { marginTop: spacing.xs }]} numberOfLines={1}>
          Tap to open
        </Text>
      </AppCard>
    </Pressable>
  );
}

export default function HrHomeScreen() {
  const navigation = useNavigation<any>();

  const go = (route: HrRouteName) => navigation.navigate(route);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="HR" />
      <View style={{ padding: spacing.lg }}>
        <Text style={[typography.muted]}>Choose a module</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: spacing.lg, justifyContent: 'space-between' }}>
          <Tile title="Leave Requests" icon="calendar-outline" onPress={() => go('Leaves')} />
          <Tile title="Work From Home" icon="home-outline" onPress={() => go('Wfh')} />
          <Tile title="Travel Requests" icon="airplane-outline" onPress={() => go('Travel')} />
          <Tile title="Timesheets" icon="time-outline" onPress={() => go('Timesheets')} />
          <Tile title="Appraisals" icon="ribbon-outline" onPress={() => go('Appraisals')} />
        </View>
      </View>
    </View>
  );
}

