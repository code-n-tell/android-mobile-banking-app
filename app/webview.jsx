import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Share, Linking, StyleSheet, Platform, SafeAreaView, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";

export default function InAppWebViewScreen() {
    const router = useRouter();
    const { url, title } = useLocalSearchParams();
    const webref = useRef(null);

    const [loading, setLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);
    const [currentUrl, setCurrentUrl] = useState(String(url || ""));

    // Header actions
    const goBack = useCallback(() => {
        if (canGoBack && webref.current) {
            webref.current.goBack();
        } else {
            router.back();
        }
    }, [canGoBack, router]);

    const done = () => router.back();

    const refresh = () => webref.current?.reload();

    const openExternal = () => {
        if (currentUrl) {
            Linking.openURL(currentUrl);
        }
    };

    const sharePage = async () => {
        try {
            await Share.share({
                message: `${title ?? "Link"}: ${currentUrl}`,
                url: currentUrl, // iOS uses this
                title: title ?? "Share link",
            });
        } catch { }
    };

    if (!currentUrl) {
        return (
            <View style={styles.center}>
                <Text>Missing URL</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
                    <Text style={styles.primaryBtnText}>Close</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? 20 : 0 }}>
            {/* Custom header */}
            <View style={styles.header}>
                {/* Left button */}
                <TouchableOpacity onPress={done} style={styles.headerBtnLeft}>
                    <Text style={styles.headerBtnText}>Done</Text>
                </TouchableOpacity>

                {/* Title */}
                <View style={styles.headerCenter}>
                    <Text numberOfLines={1} style={styles.headerTitle}>
                        {title || currentUrl}
                    </Text>
                </View>

                {/* Right button(s) */}
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={refresh} style={styles.headerBtnRight}>
                        <Image
                            source={require("../assets/icons/refresh.png")}
                            style={{ width: 24, height: 24 }}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* WebView */}
            <WebView
                ref={webref}
                source={{ uri: currentUrl }}
                javaScriptEnabled={true}  // Enable JavaScript
                sharedCookiesEnabled={true}  // important
                thirdPartyCookiesEnabled={true} // allow cross-site cookies
                allowFileAccess={true} // ANDROID ONLY
                allowFileAccessFromFileURLs={false} // ANDROID ONLY
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onNavigationStateChange={(nav) => {
                    setCanGoBack(nav.canGoBack);
                    if (nav.url) setCurrentUrl(nav.url);
                }}
                // Keep nav inside the WebView (don’t pop Safari)
                setSupportMultipleWindows={false}
                originWhitelist={["*"]}
                onShouldStartLoadWithRequest={(req) => {
                    // If you want to open certain domains externally, do it here.
                    // Example to keep everything inside:
                    return true;
                }}
                // Enable JS <-> RN bridge if needed:
                // onMessage={(e) => console.log(e.nativeEvent.data)}
                // injectedJavaScript={`window.ReactNativeWebView.postMessage("hello"); true;`}
                // iOS bounce behavior:
                bounces={false}
            // Android file chooser etc. might need extra props depending on use-case.
            />

            {/* Footer toolbar */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={goBack} style={styles.footerBtn}>
                    <Image
                        source={require("../assets/icons/left.png")}
                        style={{ width: 24, height: 24 }}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={sharePage} style={styles.footerBtn}>
                    <Image
                        source={require("../assets/icons/share.png")}
                        style={{ width: 24, height: 24 }}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={openExternal} style={styles.footerBtn}>
                    <Image
                        source={require("../assets/icons/safari.png")}
                        style={{ width: 24, height: 24 }}
                    />
                </TouchableOpacity>
            </View>

            {/* Loader overlay */}
            {loading && (
                <View pointerEvents="none" style={styles.loader}>
                    <ActivityIndicator />
                </View>
            )}
        </SafeAreaView>
    );
}

const HEADER_H = 52;
const FOOTER_H = 52;

const styles = StyleSheet.create({
    header: {
        height: HEADER_H,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#e5e7eb",
        backgroundColor: "#ebe5e5ff",
    },

    headerBtnLeft: {
        minWidth: 60,
        alignItems: "flex-start",
        justifyContent: "center",
        paddingHorizontal: 12,
    },
    headerBtnRight: {
        minWidth: 44,
        alignItems: "flex-end",
        justifyContent: "center",
        paddingHorizontal: 12,
    },
    headerBtnText: {
        fontSize: 15,
        color: "#3a73edff",
        fontWeight: "500",
    },

    headerCenter: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    loader: {
        position: "absolute", top: HEADER_H, left: 0, right: 0, bottom: 0,
        alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.2)",
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    primaryBtn: {
        marginTop: 12, paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 8, backgroundColor: "#3b82f6",
    },
    primaryBtnText: { color: "#fff", fontWeight: "600" },

    footer: {
        minHeight: FOOTER_H,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around", // evenly spaced
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#e5e7eb",
        backgroundColor: "#ebe5e5ff",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 24,
    },
    footerBtn: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 8,
        marginTop: 4,
    },
    footerBtnText: {
        fontSize: 18,
        color: "#111827",
        fontWeight: "500",
    },
});