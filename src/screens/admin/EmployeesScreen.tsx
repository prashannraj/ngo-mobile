import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { AppCard, AppHeader, EmptyState, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';

async function fetchEmployees() {
  const res = await apiClient.get('/employees?per_page=50');
  return res.data?.data?.data ?? res.data?.data?.data?.data ?? [];
}

export default function EmployeesScreen() {
  const query = useQuery({ queryKey: ['employeesList'], queryFn: fetchEmployees });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Employees" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {query.isLoading ? (
          <LoadingState />
        ) : (query.data ?? []).length ? (
          <View style={{ marginTop: spacing.sm }}>
            {(query.data ?? []).map((e: any) => (
              <AppCard key={e.id} style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontWeight: '900', color: colors.text }}>
                  {e.first_name} {e.last_name}
                </Text>
                <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                  ID: {e.employee_id} | Designation: {e.designation?.name ?? '-'}
                </Text>
                <Text style={[typography.muted, { marginTop: spacing.xs }]}>Dept: {e.department?.name ?? '-'}</Text>
              </AppCard>
            ))}
          </View>
        ) : (
          <EmptyState title="No employees found" />
        )}
      </ScrollView>
    </View>
  );
}

