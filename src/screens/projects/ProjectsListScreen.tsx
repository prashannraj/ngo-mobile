import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useNavigation } from '@react-navigation/native';

async function fetchProjects() {
  const res = await apiClient.get('/projects?per_page=50');
  return res.data?.data?.data ?? res.data?.data?.data?.data ?? res.data?.data ?? [];
}

export default function ProjectsListScreen() {
  const navigation = useNavigation<any>();

  const projectsQuery = useQuery({
    queryKey: ['projectsList'],
    queryFn: fetchProjects,
  });

  const projects = projectsQuery.data ?? [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Projects</Text>
        <Text style={{ color: '#64748B', marginTop: 6 }}>Select a project to view tasks and complete them.</Text>

        {projectsQuery.isLoading ? (
          <View style={{ marginTop: 16 }}>
            <ActivityIndicator color="#2563EB" />
          </View>
        ) : projects.length === 0 ? (
          <Text style={{ marginTop: 16, color: '#6B7280', fontWeight: '700' }}>No projects found.</Text>
        ) : (
          <View style={{ marginTop: 12 }}>
            {projects.map((p: any) => (
              <Pressable
                key={p.id}
                onPress={() => navigation.navigate('ProjectDetail', { id: p.id })}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#F1F5F9',
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontWeight: '900', fontSize: 16 }}>{p.name ?? 'Project'}</Text>
                <Text style={{ marginTop: 6, color: '#64748B' }}>
                  Code: {p.code ?? '-'} | Status: {String(p.status ?? '-').toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

