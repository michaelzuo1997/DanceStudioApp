import { useEffect } from 'react';
import { router } from 'expo-router';

export default function BrowseScreen() {
  useEffect(() => {
    router.replace('/(tabs)/classes');
  }, []);
  return null;
}
