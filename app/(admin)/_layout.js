import React from 'react';
import { Stack } from 'expo-router';
import { RoleGuard } from '../../src/components/RoleGuard';

export default function AdminLayout() {
  return (
    <RoleGuard roles={['admin', 'owner']}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
        <Stack.Screen name="classes" options={{ headerShown: false }} />
        <Stack.Screen name="noticeboard" options={{ headerShown: false }} />
        <Stack.Screen name="bundles" options={{ headerShown: false }} />
        <Stack.Screen name="pricing" options={{ headerShown: false }} />
        <Stack.Screen name="users" options={{ headerShown: false }} />
        <Stack.Screen name="wages" options={{ headerShown: false }} />
      </Stack>
    </RoleGuard>
  );
}
