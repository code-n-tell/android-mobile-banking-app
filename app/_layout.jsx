import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const requestNotificationPermission = async () => {
    try {
      // Only request permission on Android
      if (Platform.OS === 'android') {
        // Check if permission is already granted
        const checkResult = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (checkResult) {
          console.log('Notification permission already granted');
          return true;
        }

        // Request the permission
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'This app needs notification permission to keep you updated',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        // Handle the result
        switch (result) {
          case PermissionsAndroid.RESULTS.GRANTED:
            console.log('Notification permission granted');
            return true;
          case PermissionsAndroid.RESULTS.DENIED:
            console.log('Notification permission denied');
            return false;
          case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
            console.log('Notification permission denied permanently');
            Alert.alert(
              'Permission Required',
              'Please enable notifications in app settings to receive updates',
              [{ text: 'OK' }]
            );
            return false;
          default:
            return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Simple authentication protection
  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0];
    const protectedRoutes = ['home', 'userinfo', 'localAccCheck', 'scanScreen'];

    if (!isAuthenticated && protectedRoutes.includes(currentRoute)) {
      router.replace('/');
    } else if (isAuthenticated && (currentRoute === 'index' || !currentRoute)) {
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return null; // Or a loading screen component
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="signup"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="home"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name="userinfo"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="localAccCheck"
        options={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back gesture
        }}
      />

        <Stack.Screen
            name="scanScreen"
            options={{
                headerShown: false,
                gestureEnabled: false, // Disable swipe back gesture
            }}
        />

        <Stack.Screen
            name="paynow/paynowScreen"
            options={{
                headerShown: false,
                gestureEnabled: false, // Disable swipe back gesture
            }}
        />

        <Stack.Screen
            name="paynow/paynowQuery"
            options={{
                headerShown: false,
                gestureEnabled: false, // Disable swipe back gesture
            }}
        />

        <Stack.Screen
            name="LiveChatScreen"
            options={{
                headerShown: false,
            }}
        />

        <Stack.Screen
          name="webview"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

    </Stack>
  );
}
