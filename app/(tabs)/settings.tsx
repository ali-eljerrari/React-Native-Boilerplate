import { View, Text, StyleSheet, useColorScheme } from 'react-native';

export default function Tab() {
  const colorScheme = useColorScheme();

  const getThemeColors = () => ({
    background: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
    text: colorScheme === 'dark' ? '#ffffff' : '#000000',
  });

  const theme = getThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
});
