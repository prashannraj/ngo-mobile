import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { AppCard, AppHeader, AppInput, EmptyState, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

async function fetchAssets(search: string) {
  const res = await apiClient.get('/assets', {
    params: { per_page: 50, search: search || undefined },
  });
  return res.data?.data?.data ?? res.data?.data?.data?.data ?? res.data?.data ?? [];
}

export default function AssetsScreen() {
  const { user } = useAuth();
  const roles = (user?.roles ?? []) as string[];
  const isEmployee = roles.includes('Employee');

  const [search, setSearch] = React.useState('');

  const query = useQuery({
    queryKey: ['assetsList', search],
    queryFn: () => fetchAssets(search),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Assets" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.muted]}>
          {isEmployee ? 'Your assigned assets are shown here.' : 'All assets are shown here (use search to filter).'}
        </Text>

        {!isEmployee ? (
          <AppInput label="Search" value={search} onChangeText={setSearch} placeholder="Search by name / tag / category" />
        ) : null}

        {query.isLoading ? (
          <LoadingState />
        ) : (query.data ?? []).length ? (
          <View style={{ marginTop: spacing.md }}>
            {(query.data ?? []).map((a: any) => {
              const assignedTo = a?.activeAssignment?.employee
                ? `${a.activeAssignment.employee.first_name ?? ''} ${a.activeAssignment.employee.last_name ?? ''}`.trim()
                : null;
              return (
                <AppCard key={a.id} style={{ marginBottom: spacing.sm }}>
                  <Text style={{ fontWeight: '900', color: colors.text }}>{a.name ?? 'Asset'}</Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                    Tag: {a.asset_tag ?? '-'} | Category: {a.category ?? '-'}
                  </Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>Status: {String(a.status ?? '-').toUpperCase()}</Text>
                  {!!assignedTo ? <Text style={[typography.muted, { marginTop: spacing.xs }]}>Assigned to: {assignedTo}</Text> : null}
                </AppCard>
              );
            })}
          </View>
        ) : (
          <EmptyState title="No assets found" subtitle={isEmployee ? 'No assets are currently assigned to you.' : 'Try a different search.'} />
        )}
      </ScrollView>
    </View>
  );
}

