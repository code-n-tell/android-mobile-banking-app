import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../lib/services/userService';

export default function UserInfo() {
    const router = useRouter();
    const { customerId } = useLocalSearchParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
        try {
            // Get current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.user) {
                router.replace('/');
                return;
            }

            setUser(session.user);
            setLoading(false);
        } catch (err) {
            console.error('Error in fetchUserData:', err);
            setError('An error occurred while loading user data');
            setLoading(false);
        }
        };

        fetchUserData();
    }, []);

    const handleContactSupport = () => {
        router.push({
                pathname: '/LiveChatScreen',
                params: {
                    customerId: customerId
                }
        });
    };

    if (loading) {
        return (
        <LinearGradient colors={['#0e273c', '#1a3a5c']} style={styles.container}>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0e273c" />
                <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#dcb24e" />
                <Text style={styles.loadingText}>Loading user information...</Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
        );
    }

    if (error) {
        return (
        <LinearGradient colors={['#0e273c', '#1a3a5c']} style={styles.container}>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0e273c" />
                <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#0e273c', '#1a3a5c']} style={styles.container}>
            <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0e273c" />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logo}>
                            <Text style={styles.logoText}>👤</Text>
                        </View>
                        <Text style={styles.headerTitle}>Profile</Text>
                    </View>
                </View>

                {/* User Profile Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Account Information</Text>
                    {user && (
                        <>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Email:</Text>
                            <Text style={styles.value}>{user.email}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Account Status:</Text>
                            <Text style={styles.valueVerified}>
                                {user.email_confirmed_at ? '✓ Verified' : 'Pending Verification'}
                            </Text>
                        </View>
                        </>
                    )}
                </View>

                {/* Support Card */}
                <View style={styles.supportCard}>
                    <View style={styles.supportHeader}>
                        <Text style={styles.supportIcon}>💬</Text>
                        <Text style={styles.supportTitle}>Need Help?</Text>
                    </View>
                    <Text style={styles.supportDescription}>
                        Our customer support team is available 24/7 to assist you with any questions or concerns.
                    </Text>
                    <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
                        <Text style={styles.supportButtonText}>Contact Live Support</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Tips Card */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>Quick Tips</Text>
                    <View style={styles.tipItem}>
                        <Text style={styles.tipIcon}>🔒</Text>
                        <Text style={styles.tipText}>Keep your login credentials secure and never share them with anyone</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Text style={styles.tipIcon}>🚨</Text>
                        <Text style={styles.tipText}>Monitor your account regularly for any unauthorized transactions</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Text style={styles.tipIcon}>⚠️</Text>
                        <Text style={styles.tipText}>Our staff will never ask you to click any links or ask for your passwords</Text>
                    </View>
                </View>

            </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(220, 178, 78, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#dcb24e',
    },
    logoText: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fffffe',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        color: '#fffffe',
        marginTop: 12,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        fontSize: 16,
        color: '#dcb24e',
        textAlign: 'center',
        fontWeight: '500',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        marginHorizontal: 24,
        marginTop: 20,
        padding: 24,
        borderRadius: 20,
        shadowColor: '#0e273c',
        shadowOffset: {
        width: 0,
        height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(220, 178, 78, 0.2)',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0e273c',
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(220, 178, 78, 0.1)',
    },
    label: {
        fontSize: 15,
        color: '#6b7280',
        fontWeight: '600',
        flex: 1,
    },
    value: {
        fontSize: 15,
        color: '#0e273c',
        flex: 2,
        textAlign: 'right',
        fontWeight: '500',
    },
    valueVerified: {
        fontSize: 15,
        color: '#dcb24e',
        fontWeight: '700',
        flex: 2,
        textAlign: 'right',
    },
    supportCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        marginHorizontal: 24,
        marginTop: 20,
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(220, 178, 78, 0.2)',
        shadowColor: '#0e273c',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    supportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    supportIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    supportTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0e273c',
        letterSpacing: 0.5,
    },
    supportDescription: {
        fontSize: 16,
        color: '#0e273c',
        lineHeight: 24,
        marginBottom: 20,
        fontWeight: '400',
    },
    supportButton: {
        backgroundColor: '#dcb24e',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#dcb24e',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    supportButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0e273c',
        letterSpacing: 0.5,
    },
    tipsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        marginHorizontal: 24,
        marginTop: 20,
        padding: 24,
        borderRadius: 20,
        shadowColor: '#0e273c',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(220, 178, 78, 0.2)',
    },
    tipsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0e273c',
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    tipIcon: {
        fontSize: 20,
        marginRight: 12,
        marginTop: 2,
    },
    tipText: {
        fontSize: 15,
        color: '#0e273c',
        lineHeight: 22,
        flex: 1,
        fontWeight: '400',
    },
    //   debugCard: {
    //     backgroundColor: '#f3f4f6',
    //     marginHorizontal: 24,
    //     marginTop: 16,
    //     padding: 16,
    //     borderRadius: 8,
    //     borderWidth: 1,
    //     borderColor: '#e5e7eb',
    //   },
    //   debugTitle: {
    //     fontSize: 14,
    //     fontWeight: '600',
    //     color: '#6b7280',
    //     marginBottom: 8,
    //   },
    //   debugText: {
    //     fontSize: 12,
    //     color: '#6b7280',
    //     fontFamily: 'monospace',
    //     marginBottom: 4,
    //   },
});
