import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, SafeAreaView, StatusBar, TouchableOpacity, Dimensions, ScrollView, Animated, PanResponder } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

import NotificationService from '../lib/services/NotificationService';

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [isSignupMode, setIsSignupMode] = useState(false) // Toggle between login and signup

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(1)).current
  const cardHeightAnim = useRef(new Animated.Value(120)).current // Initial small card height

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Detect upward swipe
        return gestureState.dy < -10 && Math.abs(gestureState.dx) < 50
      },
      onPanResponderMove: (evt, gestureState) => {
        // Optional: provide visual feedback during swipe
      },
      onPanResponderRelease: (evt, gestureState) => {
        // If swiped up significantly, trigger sign in
        if (gestureState.dy < -50) {
          handleSignInPress()
        }
      },
    })
  ).current

  useEffect(() => {
    // Check if user is already logged in
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍🔍🔍🔍🔍🔍🔍 Checking auth state, session:', session)
      if (session) {
        // User is already logged in, initialize Firebase messaging
        console.log('👤 User already logged in, initializing Firebase...')
        await NotificationService.init()
        router.replace('/home')
      }
    } catch (error) {
      console.error('❌ Auth check error:', error)
    }
  }

  const handleSignInPress = () => {
    // First expand the card
    Animated.timing(cardHeightAnim, {
      toValue: height * 0.7, // Expand to 70% of screen height
      duration: 500,
      useNativeDriver: false,
    }).start(() => {
      // Then slide up the full form
      setShowLoginForm(true)
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    })
  }

  const handleBackPress = () => {
    // Animate back down
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowLoginForm(false)
      // Reset card height back to small
      Animated.timing(cardHeightAnim, {
        toValue: 120,
        duration: 300,
        useNativeDriver: false,
      }).start()
    })
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        Alert.alert('Login Error', error.message)
      } else {
        // await logLogin() // Log the login event
        // console.log('✅🦄 Login successful, initializing Firebase...')
        // Login successful, navigate to home or protected route
        await NotificationService.init() // Initialize Firebase messaging after login
        router.replace('/home')
      }
    } catch (error) {
      Alert.alert('Unexpected Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        Alert.alert('Signup Failed', error.message)
      } else {
        Alert.alert(
          'Signup Success',
          'Please check your email to confirm your account.'
        )
        router.replace('/home')
      }
    } catch (error) {
      Alert.alert('Unexpected Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleSignupMode = () => {
    setIsSignupMode(!isSignupMode)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }
  // const showToast = () => {
  //   NativeModules.MyToastModule.showToast('Hello from native!');
  // };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0e273c" />
      <LinearGradient
        colors={['#0e273c', '#0e273c', '#1a3a52']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Main Logo Screen */}
        <Animated.View
          style={[styles.logoScreen, { opacity: fadeAnim }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.centerLogoContainer}>
            <View style={styles.largeLogo}>
              <Text style={styles.largeLogoText}>💳</Text>
            </View>
            <Text style={styles.largeBankName}>Zentra Bank</Text>
            <Text style={styles.largeTagline}>Your premium banking experience</Text>
          </View>

          {/* Expanding White Card at Bottom */}
          <View style={styles.expandingCardContainer}>
            <Animated.View style={[styles.expandingCard, { height: cardHeightAnim }]}>
              <TouchableOpacity
                style={styles.cardTouchable}
                onPress={handleSignInPress}
                activeOpacity={0.9}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHandle} />
                  <Text style={styles.signInCardText}>Sign In</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Login Form (Slides up) */}
        <Animated.View
          style={[
            styles.loginFormContainer,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height, 0],
                })
              }]
            }
          ]}
        >
          <View style={styles.formHeader}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.smallLogoContainer}>
              <View style={styles.smallLogo}>
                <Text style={styles.smallLogoText}>💳</Text>
              </View>
              <Text style={styles.smallBankName}>Zentra Bank</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.welcomeTitle}>
                {isSignupMode ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignupMode ? 'Start your secure banking journey' : 'Secure access to your account'}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder={isSignupMode ? "Enter your email address" : "Enter your email"}
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder={isSignupMode ? "Create a strong password" : "Enter your password"}
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {isSignupMode && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              )}

              <View style={styles.buttonSection}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#dcb24e" />
                    <Text style={styles.loadingText}>
                      {isSignupMode ? 'Creating Account...' : 'Signing you in...'}
                    </Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={isSignupMode ? handleSignup : handleLogin}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={['#dcb24e', '#dcb24e']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.loginButtonText}>
                          {isSignupMode ? 'Create Secure Account' : 'Sign In Securely'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.signupButton}
                      onPress={toggleSignupMode}
                      disabled={loading}
                    >
                      <Text style={styles.signupButtonText}>
                        {isSignupMode ? 'Already have an account? Sign In' : 'Create New Account'}
                      </Text>
                    </TouchableOpacity>

                    {isSignupMode && (
                      <View style={styles.termsContainer}>
                        <Text style={styles.termsText}>
                          By creating an account, you agree to our{' '}
                          <Text style={styles.termsLink}>Terms of Service</Text>
                          {' '}and{' '}
                          <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const { width, height } = Dimensions.get('window')

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },

  // Main logo screen styles
  logoScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  centerLogoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(220, 178, 78, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#dcb24e',
  },
  largeLogoText: {
    fontSize: 48,
  },
  largeBankName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fffffe',
    marginBottom: 8,
    letterSpacing: 2,
    textAlign: 'center',
  },
  largeTagline: {
    fontSize: 18,
    color: '#dcb24e',
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 8,
  },

  // Expanding white card at bottom
  expandingCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
  },
  expandingCard: {
    backgroundColor: '#fffffe',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  cardTouchable: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 16,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    marginBottom: 16,
  },
  signInCardText: {
    color: '#0e273c',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Login form container (slides up)
  loginFormContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    color: '#fffffe',
    fontSize: 20,
    fontWeight: '600',
  },
  smallLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 178, 78, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#dcb24e',
  },
  smallLogoText: {
    fontSize: 20,
  },
  smallBankName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fffffe',
    letterSpacing: 1,
  },
  formCard: {
    flex: 1,
    backgroundColor: '#fffffe',
    marginHorizontal: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 28,
    paddingTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Keep existing form styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0e273c',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '400',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0e273c',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#0e273c',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  buttonSection: {
    marginTop: 30,
    paddingBottom: 20,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#dcb24e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fffffe',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signupButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0e273c',
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#0e273c',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#0e273c',
    fontWeight: '600',
  },
})