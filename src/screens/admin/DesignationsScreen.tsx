import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { AppCard, AppHeader, EmptyState, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

async function fetchDesignations() {
  const res = await apiClient.get('/designations');
  return res.data?.data ?? [];
}

export default function DesignationsScreen() {
  const query = useQuery({ queryKey: ['designationsList'], queryFn: fetchDesignations });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Designations" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {query.isLoading ? (
          <LoadingState />
        ) : (query.data ?? []).length ? (
          <View style={{ marginTop: spacing.sm }}>
            {(query.data ?? []).map((d: any) => (
              <AppCard key={d.id} style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontWeight: '900', color: colors.text }}>{d.name}</Text>
                <Text style={[typography.muted, { marginTop: spacing.xs }]}>{d.description ?? '-'}</Text>
              </AppCard>
            ))}
          </View>
        ) : (
          <EmptyState title="No designations found" />
        )}
      </ScrollView>
    </View>
  );
}

