import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { getUserProfile } from '../lib/services/userService.js';
import { createPOSBAccount, getAccountDetails } from '../lib/services/accService.js';
import NotificationService from '../lib/services/NotificationService.js';
import { checkPaynowLinked } from '../lib/services/userService.js';

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [customerData, setCustomerData] = useState(null);
    const [customerId, setCustomerId] = useState(null);
    const [accountDetails, setAccountDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => { // This will run on component mount
        const fetchUserAndCustomerData = async () => {
            try {
                console.log('Starting fetchUserAndCustomerData...');

                // Get current session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                console.log('Session result:', { session: !!session, user: !!session?.user, error: sessionError });

                if (sessionError) {
                    console.error('Error getting session:', sessionError);
                    router.replace('/');
                    return;
                }

                if (!session?.user) {
                    console.log('No session or user found, redirecting to login');
                    router.replace('/');
                    return;
                }

                console.log('User ID:', session.user.id);
                setUser(session.user);

                // Fetch customer data using the user ID
                console.log('Fetching customer profile...');
                const customerData = await getUserProfile(session.user.id);
                console.log('Customer data result:', customerData);

                if (customerData) {
                    setCustomerData(customerData);
                    setCustomerId(customerData.customer_id);
                    console.log('Customer ID set to:', customerData.customer_id);
                } else {
                    console.log('No customer data found');
                    setError('Could not find customer profile');
                }

                setLoading(false);
            } catch (err) {
                console.error('Error in fetchUserAndCustomerData:', err);
                setError('An error occurred while loading user data');
                setLoading(false);
            }
        };

        fetchUserAndCustomerData();
    }, []);

    // Function to refresh account details
    const refreshAccountDetails = useCallback(async () => {
        if (customerId) {
            try {
                console.log('Refreshing account details for customer ID:', customerId);
                const details = await getAccountDetails(customerId);
                setAccountDetails(details);
                if (details) {
                    console.log('Account details refreshed:', details);
                } else {
                    console.log('No account found for customer - user needs to create an account');
                }
            } catch (error) {
                console.error('Error refreshing account details:', error);
                setAccountDetails(null);
            }
        }
    }, [customerId]);

    useEffect(() => { // This useEffect will run when customerId changes
        refreshAccountDetails();
    }, [customerId, refreshAccountDetails]);

    // Refresh account details when screen comes into focus (e.g., returning from transfer page)
    useFocusEffect(
        useCallback(() => {
            if (customerId) {
                console.log('Screen focused, refreshing account details...');
                refreshAccountDetails();
            }
        }, [customerId, refreshAccountDetails])
    );

    const handleLogout = async () => {
        NotificationService.deleteFCMToken();
        const { error } = await supabase.auth.signOut();
        if (!error) {
            router.replace('/'); // Redirect to login page
        }
    };

    // Show loading while checking session
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // If no user (shouldn't happen due to redirect, but safety check)
    if (!user) {
        return null;
    }

    const handlePayNow = async () => {
        try {
            const { linked: isLinked, value: linkedValue } = await checkPaynowLinked(customerId);

            if (isLinked) {
                // Already linked -> go to manage/use page
                console.log("##################### PayNow already linked, navigating to query screen " + accountDetails?.account_number);
                router.push({
                    pathname: "/paynow/paynowQuery",   // or your final PayNow screen
                    params: {
                        userAccNumber: accountDetails?.account_number ?? null,
                        userAccBalance: accountDetails?.current_balance ?? null,
                        recipientPhone: linkedValue,
                    },
                });
            } else {
                // Not linked yet -> go to link flow
                router.push({
                    pathname: "/paynow/paynowScreen",
                    params: {
                        userAccNumber: accountDetails?.account_number ?? null,
                        userAccBalance: accountDetails?.current_balance ?? null,
                        customerid: customerId,
                        accountid: accountDetails.account_id
                    },
                });
            }
        } catch (err) {
            console.error("handlePayNow error:", err);
        }
    };

    const handleScanPay = () => {
        console.log('Scan & Pay pressed');
        if (accountDetails) {
            router.push({
                pathname: '/scanScreen',
                params: {
                    userAccountNumber: accountDetails.account_number,
                    userAccountBalance: accountDetails.current_balance,
                }
            });
        } else {
            router.push('/scanScreen');
        }

    };

    const handleFundTransfer = () => {
        // Navigate to local transfer page with user's account info
        if (accountDetails) {
            router.push({
                pathname: '/localAccCheck',
                params: {
                    userAccountNumber: accountDetails.account_number,
                    userAccountBalance: accountDetails.current_balance,
                }
            });
        } else {
            router.push('/localAccCheck');
        }
    };

    const handleAccounts = async () => {
        console.log('Accounts pressed');
        console.log('Customer ID:', customerId);

        if (!customerId) {
            console.error('No customer ID available');
            setError('Customer ID not found. Please try logging out and back in.');
            return;
        }

        try {
            setLoading(true);
            const account = await createPOSBAccount(customerId);
            console.log('Account created successfully:', account);

            // Refresh account details after successful creation
            if (account) {
                const updatedDetails = await getAccountDetails(customerId);
                setAccountDetails(updatedDetails);
                console.log('Account details refreshed:', updatedDetails);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error creating account:', error);
            setError('Failed to create account: ' + error.message);
            setLoading(false);
        }
    };

    const handleChat = () => {
        // Changed this to LiveChat for now
        router.push({
                pathname: '/LiveChatScreen',
                params: {
                    customerId: customerId
                }
        });
    };

    const handleUpdateParticulars = () => {
        // Navigate to user info page
        // router.push('/userinfo');
        router.push({
                pathname: '/userinfo',
                params: {
                    customerId: customerId
                }
        });
    };

    function handleOpenWebview() {
        router.push({
            pathname: "/webview",
            params: { url: "https://www.csa.gov.sg/", title: "CSA's Website" },
        })
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0e273c" />
            {/* Header with Zentra Bank branding */}
            <LinearGradient
                colors={['#0e273c', '#1a3a52']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView>
                    <View style={styles.headerContainer}>
                        <View style={styles.headerTop}>
                            <View style={styles.logoContainer}>
                                <View style={styles.logo}>
                                    <Text style={styles.logoText}>💳</Text>
                                </View>
                                <Text style={styles.bankName}>Zentra Bank</Text>
                            </View>
                            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.header}>
                            <Text style={styles.welcomeText}>Welcome Back</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* White content area */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Account Balance Card */}
                <View style={styles.balanceCard}>
                    {accountDetails ? (
                        <>
                            <Text style={styles.balanceLabel}>Account Balance</Text>
                            <Text style={styles.balanceAmount}>
                                ${parseFloat(accountDetails.current_balance).toFixed(2)}
                            </Text>
                            <Text style={styles.accountNumber}>
                                {accountDetails.account_number}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.balanceLabel}>Welcome to Zentra Banking</Text>
                            <Text style={styles.noAccountMessage}>
                                You don't have an account yet
                            </Text>
                            <Text style={styles.noAccountSubtext}>
                                Create your first account to start banking with us
                            </Text>
                            <TouchableOpacity
                                style={styles.createAccountButton}
                                onPress={handleAccounts}
                            >
                                <Text style={styles.createAccountButtonText}>Create Account</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Quick Actions Card */}
                <View style={styles.actionsCard}>
                    <Text style={styles.actionsTitle}>Quick Actions</Text>
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.actionButton} onPress={handlePayNow}>
                            <View style={styles.actionIconPlaceholder}>
                                <Text style={styles.actionIconText}>💳</Text>
                            </View>
                            <Text style={styles.actionText} numberOfLines={2} adjustsFontSizeToFit>PayNow</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleScanPay}>
                            <View style={styles.actionIconPlaceholder}>
                                <Text style={styles.actionIconText}>📱</Text>
                            </View>
                            <Text style={styles.actionText} numberOfLines={2} adjustsFontSizeToFit>Scan & Pay</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleFundTransfer}>
                            <View style={styles.actionIconPlaceholder}>
                                <Text style={styles.actionIconText}>💸</Text>
                            </View>
                            <Text style={styles.actionText} numberOfLines={2} adjustsFontSizeToFit>Fund Transfer</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Others Card */}
                <View style={styles.actionsCard}>
                    <Text style={styles.actionsTitle}>Others</Text>
                    <View style={styles.applyContainer}>
                        <TouchableOpacity style={styles.applyButton} onPress={handleAccounts}>
                            <View style={styles.actionIconPlaceholder}>
                                <Text style={styles.actionIconText}>🏦</Text>
                            </View>
                            <Text style={styles.actionText} numberOfLines={2} adjustsFontSizeToFit>Accounts</Text>
                        </TouchableOpacity>


                        <TouchableOpacity style={styles.actionButton} onPress={handleUpdateParticulars}>
                            <View style={styles.actionIconPlaceholder}>
                                <Text style={styles.actionIconText}>✏️</Text>
                            </View>
                            <Text style={styles.actionText} numberOfLines={2} adjustsFontSizeToFit>View Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.applyButton} onPress={handleChat}>
                            <View style={styles.actionIconPlaceholder}>
                                <Text style={styles.actionIconText}>💬</Text>
                            </View>
                            <Text style={styles.actionText}>Support</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Webview Card */}
                <View style={styles.actionsCard}>
                    <Text style={styles.actionsTitle}>Webview</Text>
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleOpenWebview}>
                            <View style={styles.actionIconPlaceholder}>
                                <Text style={styles.actionIconText}>🌐</Text>
                            </View>
                            <Text style={styles.actionText}>Open Webview</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerGradient: {
        paddingBottom: 20,
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        paddingBottom: 30,
        paddingTop: 10,
    },
    headerContainer: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
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
    logoText: {
        fontSize: 20,
    },
    bankName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fffffe',
        letterSpacing: 1,
    },
    header: {
        alignItems: 'flex-start',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fffffe',
        letterSpacing: 0.5,
    },
    userEmail: {
        fontSize: 16,
        color: '#dcb24e',
        marginTop: 4,
        fontWeight: '400',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0e273c',
    },
    loadingText: {
        fontSize: 18,
        color: '#fffffe',
        fontWeight: '500',
    },
    logoutButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(220, 178, 78, 0.15)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#dcb24e',
    },
    logoutText: {
        fontSize: 14,
        color: '#dcb24e',
        fontWeight: '600',
    },
    balanceCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        marginTop: 20,
        padding: 24,
        borderRadius: 12,
        shadowColor: '#64748b',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    balanceLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    accountNumber: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    noAccountMessage: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6,
        textAlign: 'center',
    },
    noAccountSubtext: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    createAccountButton: {
        backgroundColor: '#1e40af',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#1e40af',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    createAccountButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    actionsCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        marginTop: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#64748b',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    actionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 16,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    applyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: 20,
        paddingHorizontal: 8,
        backgroundColor: 'transparent',
        marginHorizontal: 6,
        minHeight: 110,
    },
    applyButton: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: 20,
        paddingHorizontal: 12,
        maxWidth: '45%',
        backgroundColor: 'transparent',
        marginHorizontal: 6,
        minHeight: 110,
    },
    actionIconPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    actionIconText: {
        fontSize: 22,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        textAlign: 'center',
        letterSpacing: 0.2,
        lineHeight: 16,
        maxWidth: '100%',
        flexWrap: 'wrap',
        marginTop: 2,
    },
});
