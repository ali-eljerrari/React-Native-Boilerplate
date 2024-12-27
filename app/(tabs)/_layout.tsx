import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const getThemeColors = () => ({
    background: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
    text: colorScheme === 'dark' ? '#ffffff' : '#000000',
    tabBarBackground: colorScheme === 'dark' ? '#000000' : '#ffffff',
    tabBarBorder: colorScheme === 'dark' ? '#ffffff15' : '#00000015',
    tint: colorScheme === 'dark' ? '#4CAF50' : '#007AFF',
    inactive: colorScheme === 'dark' ? '#ffffff60' : '#00000060',
  });

  const theme = getThemeColors();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: theme.tint,
      tabBarInactiveTintColor: theme.inactive,
      tabBarStyle: {
        backgroundColor: theme.tabBarBackground,
        borderTopColor: theme.tabBarBorder,
      },
      headerStyle: {
        backgroundColor: theme.background,
      },
      headerTintColor: theme.text,
      headerShadowVisible: false,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
