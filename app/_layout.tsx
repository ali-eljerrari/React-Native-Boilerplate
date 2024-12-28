import { Stack } from 'expo-router/stack';
import { useColorScheme } from 'react-native';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
export default function Layout() {
  const colorScheme = useColorScheme();

  const getThemeColors = () => ({
    background: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
    text: colorScheme === 'dark' ? '#ffffff' : '#000000',
  });

  const theme = getThemeColors();

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

  if (!publishableKey) {
    throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file')
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkLoaded>
        <Stack screenOptions={{
          headerStyle: {
            backgroundColor: theme.background,
      },
      headerTintColor: theme.text,
      headerShadowVisible: false,
      contentStyle: {
        backgroundColor: theme.background,
      },
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
    </ClerkLoaded>
    </ClerkProvider>
  );
}
