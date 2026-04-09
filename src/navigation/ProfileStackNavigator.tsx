import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AdminEmployeesScreen from '../screens/admin/EmployeesScreen';
import AdminDesignationsScreen from '../screens/admin/DesignationsScreen';
import AdminPayrollScreen from '../screens/admin/PayrollScreen';
import AdminAssetsScreen from '../screens/admin/AssetsScreen';
import AdminFleetScreen from '../screens/admin/FleetScreen';
import OfficeSettingsScreen from '../screens/admin/OfficeSettingsScreen';
import AdminActivityLogsScreen from '../screens/admin/ActivityLogsScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';

type ProfileStackParamList = {
  Profile: undefined;
  AdminEmployees: undefined;
  AdminDesignations: undefined;
  AdminPayroll: undefined;
  AdminAssets: undefined;
  AdminFleet: undefined;
  OfficeSettings: undefined;
  AdminActivityLogs: undefined;
  Reports: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Profile" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AdminEmployees" component={AdminEmployeesScreen} />
      <Stack.Screen name="AdminDesignations" component={AdminDesignationsScreen} />
      <Stack.Screen name="AdminPayroll" component={AdminPayrollScreen} />
      <Stack.Screen name="AdminAssets" component={AdminAssetsScreen} />
      <Stack.Screen name="AdminFleet" component={AdminFleetScreen} />
      <Stack.Screen name="OfficeSettings" component={OfficeSettingsScreen} />
      <Stack.Screen name="AdminActivityLogs" component={AdminActivityLogsScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
}

