import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useNavigation } from '@react-navigation/native';

async function fetchAssets() {
  const res = await apiClient.get('/assets?per_page=50');
  return res.data?.data?.data ?? [];
}

export default function AssetsScreen() {
  const navigation = useNavigation<any>();
  const query = useQuery({ queryKey: ['assetsList'], queryFn: fetchAssets });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ padding: 16, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={{ color: '#2563EB', fontWeight: '800' }}>Back</Text>
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '900' }}>Assets</Text>
        </View>

        {query.isLoading ? (
          <View style={{ marginTop: 16 }}>
            <ActivityIndicator color="#2563EB" />
          </View>
        ) : query.data?.length ? (
          <View style={{ marginTop: 12 }}>
            {query.data.map((a: any) => (
              <View key={a.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}>
                <Text style={{ fontWeight: '900' }}>{a.name ?? 'Asset'}</Text>
                <Text style={{ marginTop: 6, color: '#64748B' }}>
                  Tag: {a.asset_tag ?? '-'} | Category: {a.category ?? '-'}
                </Text>
                <Text style={{ marginTop: 6, color: '#64748B' }}>Status: {String(a.status ?? '-').toUpperCase()}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ marginTop: 16, color: '#6B7280', fontWeight: '700' }}>No assets found.</Text>
        )}
      </View>
    </ScrollView>
  );
}

