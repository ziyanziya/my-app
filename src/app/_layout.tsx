import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { AppBottomNavigation } from '../components/app-bottom-navigation';

export default function TabLayout() {
  return <SafeAreaProvider><View style={{ flex: 1 }}><View style={{ flex: 1 }}><Slot /></View><AppBottomNavigation /></View></SafeAreaProvider>;
}
