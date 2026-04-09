import React from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppCard, AppHeader, LoadingState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/tokens';
import { useLanguage } from '../../context/LanguageContext';

async function fetchProfile() {
  const res = await apiClient.get('/user');
  return res.data?.data?.user ?? res.data?.data ?? null;
}

export default function ProfileScreen() {
  const { user, clearSession } = useAuth();
  const navigation = useNavigation<any>();
  const { language, setLanguage, t } = useLanguage();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  const profile = profileQuery.data ?? user;

  const roles = (profile?.roles ?? []) as string[];

  const isAdminArea =
    roles.some((r) => ['Admin', 'HR', 'Project Manager', 'Line Manager'].includes(r)) ||
    roles.some((r) => r === 'Super Admin');

  const logout = async () => {
    await clearSession();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={t('nav.profile')} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {profileQuery.isLoading ? (
          <LoadingState />
        ) : (
          <>
            <Text style={[typography.title]}>{profile?.name ?? 'User'}</Text>
            <Text style={[typography.muted, { marginTop: spacing.xs }]}>{profile?.email ?? '-'}</Text>

            <AppCard style={{ marginTop: spacing.lg }}>
              <Text style={[typography.h2]}>{t('profile.language')}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
                <AppButton
                  title={t('language.english')}
                  variant={language === 'en' ? 'primary' : 'outline'}
                  onPress={() => setLanguage('en')}
                  style={{ flex: 1 }}
                />
                <AppButton
                  title={t('language.nepali')}
                  variant={language === 'np' ? 'primary' : 'outline'}
                  onPress={() => setLanguage('np')}
                  style={{ flex: 1 }}
                />
              </View>
            </AppCard>

            <AppCard style={{ marginTop: spacing.lg }}>
              <Text style={[typography.h2]}>{t('profile.roles')}</Text>
              {roles.length === 0 ? (
                <Text style={[typography.muted, { marginTop: spacing.xs }]}>-</Text>
              ) : (
                roles.map((r) => (
                  <Text key={r} style={{ marginTop: spacing.xs, color: colors.text, fontWeight: '700' }}>
                    • {r}
                  </Text>
                ))
              )}
            </AppCard>

            <AppCard style={{ marginTop: spacing.md }}>
              <Text style={[typography.h2]}>{t('profile.employeeDetails')}</Text>
              <Text style={{ color: '#334155', marginTop: spacing.xs, fontWeight: '700' }}>
                {profile?.employee?.designation?.name ? `Designation: ${profile.employee.designation.name}` : 'Designation: -'}
              </Text>
              <Text style={{ color: '#334155', marginTop: spacing.xs, fontWeight: '700' }}>
                {profile?.employee?.department?.name ? `Department: ${profile.employee.department.name}` : 'Department: -'}
              </Text>
            </AppCard>

            {isAdminArea ? (
              <AppCard style={{ marginTop: spacing.md }}>
                <Text style={[typography.h2]}>{t('profile.adminTools')}</Text>
                <View style={{ marginTop: spacing.md, gap: 8 }}>
                  <AppButton
                    title="Employees"
                    variant="soft"
                    leftIcon={<Ionicons name="people-outline" size={18} color="#3730A3" />}
                    onPress={() => navigation.navigate('AdminEmployees')}
                  />
                  <AppButton
                    title="Designations"
                    variant="soft"
                    leftIcon={<Ionicons name="briefcase-outline" size={18} color="#3730A3" />}
                    onPress={() => navigation.navigate('AdminDesignations')}
                  />
                  <AppButton
                    title="Payroll"
                    variant="soft"
                    leftIcon={<Ionicons name="cash-outline" size={18} color="#3730A3" />}
                    onPress={() => navigation.navigate('AdminPayroll')}
                  />
                  <AppButton
                    title="Assets"
                    variant="soft"
                    leftIcon={<Ionicons name="cube-outline" size={18} color="#3730A3" />}
                    onPress={() => navigation.navigate('AdminAssets')}
                  />
                  <AppButton
                    title="Fleet Requests"
                    variant="soft"
                    leftIcon={<Ionicons name="car-outline" size={18} color="#3730A3" />}
                    onPress={() => navigation.navigate('AdminFleet')}
                  />
                  <AppButton
                    title="Office Settings"
                    variant="soft"
                    leftIcon={<Ionicons name="settings-outline" size={18} color="#3730A3" />}
                    onPress={() => navigation.navigate('OfficeSettings')}
                  />
                  <AppButton
                    title="Activity Logs"
                    variant="soft"
                    leftIcon={<Ionicons name="list-outline" size={18} color="#3730A3" />}
                    onPress={() => navigation.navigate('AdminActivityLogs')}
                  />
                  <AppButton
                    title="Reports (Excel)"
                    variant="soft"
                    leftIcon={<Ionicons name="download-outline" size={18} color="#3730A3" />}
                    onPress={() => navigation.navigate('Reports')}
                  />
                </View>
              </AppCard>
            ) : null}

            <AppButton title={t('common.logout')} variant="danger" onPress={logout} style={{ marginTop: spacing.lg }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

