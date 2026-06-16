import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { BLEProvider } from '../context/BLEContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <BLEProvider>
        <ThemeProvider value={DefaultTheme}>
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
        </Stack>
        <StatusBar style="dark" />
        </ThemeProvider>
    </BLEProvider>
  );
}
