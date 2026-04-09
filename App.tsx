import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/colors';
import { LanguageProvider } from './src/context/LanguageContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import LoginOtpScreen from './src/screens/auth/LoginOtpScreen';
import ForgotPasswordRequestScreen from './src/screens/auth/ForgotPasswordRequestScreen';
import ForgotPasswordVerifyScreen from './src/screens/auth/ForgotPasswordVerifyScreen';
import ForgotPasswordResetScreen from './src/screens/auth/ForgotPasswordResetScreen';
import DashboardScreen from './src/screens/home/DashboardScreen';
import NotificationsScreen from './src/screens/profile/NotificationsScreen';
import AttendanceScreen from './src/screens/attendance/AttendanceScreen';
import HRStackNavigator from './src/screens/hr/HRStackNavigator';
import ProfileStackNavigator from './src/navigation/ProfileStackNavigator';
import TasksStackNavigator from './src/navigation/TasksStackNavigator';

const queryClient = new QueryClient();

type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

const PlaceholderScreen: React.FC<{ label: string }> = ({ label }) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

type AuthStackParamList = {
  Login: undefined;
  LoginOtp: { loginId: string };
  ForgotPasswordRequest: undefined;
  ForgotPasswordVerify: { resetId: string };
  ForgotPasswordReset: { resetId: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthStackNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="LoginOtp" component={LoginOtpScreen} />
      <AuthStack.Screen name="ForgotPasswordRequest" component={ForgotPasswordRequestScreen} />
      <AuthStack.Screen name="ForgotPasswordVerify" component={ForgotPasswordVerifyScreen} />
      <AuthStack.Screen name="ForgotPasswordReset" component={ForgotPasswordResetScreen} />
    </AuthStack.Navigator>
  );
};

const AppTabsNavigator: React.FC = () => {
  const Tab = createBottomTabNavigator();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          borderTopColor: '#E2E8F0',
          backgroundColor: '#ffffff',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = 22;
          const name =
            route.name === 'Home'
              ? focused
                ? 'home'
                : 'home-outline'
              : route.name === 'Attendance'
                ? focused
                  ? 'finger-print'
                  : 'finger-print-outline'
                : route.name === 'HR'
                  ? focused
                    ? 'people'
                    : 'people-outline'
                  : route.name === 'Tasks'
                    ? focused
                      ? 'list'
                      : 'list-outline'
                    : route.name === 'Notifications'
                      ? focused
                        ? 'notifications'
                        : 'notifications-outline'
                      : focused
                        ? 'person'
                        : 'person-outline';

          return <Ionicons name={name as any} size={iconSize} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="HR" component={HRStackNavigator} />
      <Tab.Screen name="Tasks" component={TasksStackNavigator} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

const RootNavigator: React.FC = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <RootStack.Screen name="App" component={AppTabsNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </RootStack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <RootNavigator />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
