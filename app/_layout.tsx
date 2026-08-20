import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SQLite from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { migrateDbIfNeeded } from '@/services/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <SQLite.SQLiteProvider databaseName="financeku.db" onInit={migrateDbIfNeeded}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="transaksi" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="alokasi" options={{ headerShown: false }} />
            <Stack.Screen name="pemasukan" options={{ headerShown: false }} />
            <Stack.Screen name="rekening" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaView>
        <StatusBar style="dark" />
      </SQLite.SQLiteProvider>
    </ThemeProvider>
  );
}
