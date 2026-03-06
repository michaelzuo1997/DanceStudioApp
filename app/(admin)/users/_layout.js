import React from 'react';
import { Stack } from 'expo-router';

export default function UsersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'User Management' }} />
      <Stack.Screen name="detail" options={{ title: 'User Detail' }} />
    </Stack>
  );
}
