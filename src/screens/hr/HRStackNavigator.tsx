import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LeavesScreen from './LeavesScreen';
import TimesheetsScreen from './TimesheetsScreen';
import WfhScreen from './WfhScreen';
import TravelScreen from './TravelScreen';
import AppraisalsScreen from './AppraisalsScreen';

type HRStackParamList = {
  Leaves: undefined;
  Timesheets: undefined;
  Wfh: undefined;
  Travel: undefined;
  Appraisals: undefined;
};

const HRStack = createNativeStackNavigator<HRStackParamList>();

export default function HRStackNavigator() {
  return (
    <HRStack.Navigator initialRouteName="Leaves" screenOptions={{ headerShown: false }}>
      <HRStack.Screen name="Leaves" component={LeavesScreen} />
      <HRStack.Screen name="Timesheets" component={TimesheetsScreen} />
      <HRStack.Screen name="Wfh" component={WfhScreen} />
      <HRStack.Screen name="Travel" component={TravelScreen} />
      <HRStack.Screen name="Appraisals" component={AppraisalsScreen} />
    </HRStack.Navigator>
  );
}

