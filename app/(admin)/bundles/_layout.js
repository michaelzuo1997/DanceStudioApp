import React from 'react';
import { Stack } from 'expo-router';

export default function BundlesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Bundles' }} />
      <Stack.Screen name="edit" options={{ title: 'Bundle Form' }} />
    </Stack>
  );
}
