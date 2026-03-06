import React from 'react';
import { Stack } from 'expo-router';

export default function ClassesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Classes' }} />
      <Stack.Screen name="edit" options={{ title: 'Class Form' }} />
      <Stack.Screen name="enrollments" options={{ title: 'Enrollments' }} />
    </Stack>
  );
}
