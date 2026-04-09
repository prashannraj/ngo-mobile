import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProjectsListScreen from '../screens/projects/ProjectsListScreen';
import ProjectDetailScreen from '../screens/projects/ProjectDetailScreen';

type TasksStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: { id: string | number };
};

const TasksStack = createNativeStackNavigator<TasksStackParamList>();

export default function TasksStackNavigator() {
  return (
    <TasksStack.Navigator initialRouteName="ProjectsList" screenOptions={{ headerShown: false }}>
      <TasksStack.Screen name="ProjectsList" component={ProjectsListScreen} />
      <TasksStack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
    </TasksStack.Navigator>
  );
}

