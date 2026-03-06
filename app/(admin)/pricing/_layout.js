import React from 'react';
import { Stack } from 'expo-router';

export default function PricingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Price Management' }} />
    </Stack>
  );
}
