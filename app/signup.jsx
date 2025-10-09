import { useState, useRef } from 'react'
import { View, Text, TextInput, StyleSheet, Alert, SafeAreaView, StatusBar, TouchableOpacity, Dimensions, ScrollView, Animated, PanResponder } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSignupForm, setShowSignupForm] = useState(false)

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(1)).current
  const cardHeightAnim = useRef(new Animated.Value(120)).current

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy < -10 && Math.abs(gestureState.dx) < 50
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy < -50) {
          handleSignUpPress()
        }
      },
    })
  ).current

  const handleSignUpPress = () => {
    Animated.timing(cardHeightAnim, {
      toValue: height * 0.7,
      duration: 500,
      useNativeDriver: false,
    }).start(() => {
      setShowSignupForm(true)
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
      setShowSignupForm(false)
      Animated.timing(cardHeightAnim, {
        toValue: 120,
        duration: 300,
        useNativeDriver: false,
      }).start()
    })
  }

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      Alert.alert('Signup Failed', error.message)
    } else {
      Alert.alert(
        'Signup Success',
        'Please check your email to confirm your account.'
      )
      router.replace('/home')
    }
  }

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
            <Text style={styles.largeTagline}>Join the premium banking experience</Text>
          </View>

          {/* Expanding White Card at Bottom */}
          <View style={styles.expandingCardContainer}>
            <Animated.View style={[styles.expandingCard, { height: cardHeightAnim }]}>
              <TouchableOpacity
                style={styles.cardTouchable}
                onPress={handleSignUpPress}
                activeOpacity={0.9}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHandle} />
                  <Text style={styles.signUpCardText}>Create Account</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Signup Form (Slides up) */}
        <Animated.View
          style={[
            styles.signupFormContainer,
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
              <Text style={styles.welcomeTitle}>Create Account</Text>
              <Text style={styles.subtitle}>Start your secure banking journey</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
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
                  placeholder="Create a strong password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

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

              <View style={styles.buttonSection}>
                <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading}>
                  <LinearGradient
                    colors={['#dcb24e', '#dcb24e']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.signupButtonText}>
                      {loading ? 'Creating Account...' : 'Create Secure Account'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.loginButton} onPress={() => router.back()}>
                  <Text style={styles.loginButtonText}>Already have an account? Sign In</Text>
                </TouchableOpacity>

                <View style={styles.termsContainer}>
                  <Text style={styles.termsText}>
                    By creating an account, you agree to our{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </View>
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
  signUpCardText: {
    color: '#0e273c',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Signup form container (slides up)
  signupFormContainer: {
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

  // Form styles
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
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '400',
  },
  inputContainer: {
    marginBottom: 18,
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
  buttonSection: {
    marginTop: 20,
    paddingBottom: 20,
  },
  signupButton: {
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
  signupButtonText: {
    color: '#fffffe',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loginButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#0e273c',
    fontSize: 15,
    fontWeight: '500',
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
