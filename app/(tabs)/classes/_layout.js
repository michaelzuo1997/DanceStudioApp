import { Stack } from 'expo-router';

export default function ClassesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Classes' }} />
      <Stack.Screen name="browse" options={{ title: 'Browse & Enrol' }} />
    </Stack>
  );
}
