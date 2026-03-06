import React from 'react';
import { Stack } from 'expo-router';

export default function WagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Wage Calculator' }} />
    </Stack>
  );
}
