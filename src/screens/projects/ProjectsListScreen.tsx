import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useNavigation } from '@react-navigation/native';
import { AppCard, AppHeader, EmptyState, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';
import { useLanguage } from '../../context/LanguageContext';

async function fetchProjects() {
  const res = await apiClient.get('/projects?per_page=50');
  return res.data?.data?.data ?? res.data?.data?.data?.data ?? res.data?.data ?? [];
}

export default function ProjectsListScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();

  const projectsQuery = useQuery({
    queryKey: ['projectsList'],
    queryFn: fetchProjects,
  });

  const projects = projectsQuery.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Projects" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[typography.muted]}>Select a project to view tasks and complete them.</Text>

        {projectsQuery.isLoading ? (
          <LoadingState label={t('common.loading')} />
        ) : projects.length === 0 ? (
          <EmptyState title="No projects found" subtitle="Projects will appear here when assigned." />
        ) : (
          <View style={{ marginTop: spacing.md }}>
            {projects.map((p: any) => (
              <Pressable key={p.id} onPress={() => navigation.navigate('ProjectDetail', { id: p.id })}>
                <AppCard style={{ marginBottom: spacing.sm }}>
                  <Text style={{ fontWeight: '900', fontSize: 16, color: colors.text }}>{p.name ?? 'Project'}</Text>
                  <Text style={[typography.muted, { marginTop: spacing.xs }]}>
                    Code: {p.code ?? '-'} | Status: {String(p.status ?? '-').toUpperCase()}
                  </Text>
                </AppCard>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

