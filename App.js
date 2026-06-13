import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Audio } from 'expo-av';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import SalesScreen from './src/screens/SalesScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import SalesHistoryScreen from './src/screens/SalesHistoryScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';

// Storage
import { initStorage, loadAllData } from './src/storage/StorageManager';

// Sound Manager
import { preloadSounds, playClickSound, playSaveSound, playDeleteSound, playErrorSound } from './src/utils/sounds';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Product Stack Navigator
function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsMain" component={ProductsScreen} />
    </Stack.Navigator>
  );
}

// Sales Stack Navigator
function SalesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SalesMain" component={SalesScreen} />
    </Stack.Navigator>
  );
}

// Customers Stack Navigator
function CustomersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomersMain" component={CustomersScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await initStorage();
    await preloadSounds();
    await loadAllData();
    setIsReady(true);
  };

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: 'rgba(8, 12, 25, 0.95)',
              borderTopWidth: 0,
              borderTopColor: 'transparent',
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              borderRadius: 28,
              height: 70,
              paddingBottom: 8,
              paddingTop: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 10,
              backdropFilter: 'blur(20px)',
            },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#64748B',
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '600',
              marginTop: 4,
            },
            tabBarIconStyle: {
              marginTop: 2,
            },
            tabBarButton: (props) => {
              return (
                <TouchableOpacity
                  {...props}
                  activeOpacity={0.7}
                  onPress={() => {
                    playClickSound();
                    props.onPress();
                  }}
                />
              );
            },
          })}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name="grid-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Products"
            component={ProductsStack}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name="cube-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Sales"
            component={SalesStack}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name="cart-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Customers"
            component={CustomersStack}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name="people-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Analytics"
            component={AnalyticsScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon name="analytics-outline" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
