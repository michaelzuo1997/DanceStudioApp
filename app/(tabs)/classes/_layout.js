import { Stack } from 'expo-router';

export default function ClassesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="browse" options={{ title: 'Browse & Enrol' }} />
      <Stack.Screen name="[categoryId]" options={{ headerShown: false }} />
      <Stack.Screen name="bundles" options={{ headerShown: false }} />
      <Stack.Screen name="private" options={{ headerShown: false }} />
    </Stack>
  );
}
