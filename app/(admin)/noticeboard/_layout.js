import React from 'react';
import { Stack } from 'expo-router';

export default function NoticeboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Noticeboard' }} />
      <Stack.Screen name="edit" options={{ title: 'Notice Form' }} />
    </Stack>
  );
}
