# Proof-of-Concept - Validating mobile app security controls

This PoC tests whether recommended mobile app security controls can be implemented and if they can really help in stopping potential threats.

## Goals Checklist

- [X] Build a working banking mobile app with decoupled components
- [ ] Perform threat modelling on each component
- [ ] Implement relevant mobile app security controls and validate their effectiveness
- [ ] Recommend practical mobile app security controls

## User Stories

As a user,

- [X] I want to set up a new account so that I can start using the app's services
- [X] I want to sign in to my account so that I can securely access my personal information and features
- [X] I want to sign out of my account so that I can ensure my information is protected when I'm not using the app
- [X] I want to transfer funds to other accounts so that I can send money to others
- [X] I want to transfer funds using PayNow so that I can make quick and easy payments using just a mobile number or NRIC
- [X] I want to receive push notifications so that I stay informed about important updates in my account
- [X] I want to view web content within the app so that I don't have to switch to an external browser
- [X] I want to send real-time messages to customer support so that I can get immediate help with my issues

## Contributing

Contributions are welcome and appreciated! If you have an idea or suggestion to improve this project:

- Fork the repo
- Create a feature branch
- Commit your Changes
- Push to your Branch
- Open a Pull Request

```
MMMMMMMM      MMMMMMMM     OOOOOOOOOOO     BBBBBBBBBB      IIIIIIIII      LLL             EEEEEEEEEEE
MMMMMMMMM    MMMMMMMMM    OOOOOOOOOOOOO    BBBBBBBBBBBB       III         LLL             EEEEEEEEEEE
MMMM MMMMM  MMMMM MMMM   OOOO       OOOO   BBBB    BBBBB      III         LLL             EEE
MMMM  MMMMMMMM  MMMMMM   OOOO       OOOO   BBBBBBBBBBBB       III         LLL             EEEEEEEEE
MMMM   MMMMMM   MMMMMM   OOOO       OOOO   BBBBBBBBBBBB       III         LLL             EEEEEEEEE
MMMM    MMMM    MMMMMM   OOOO       OOOO   BBBB    BBBBB      III         LLL             EEE
MMMM           MMMMMMM   OOOOOOOOOOOOOO    BBBBBBBBBBBB     IIIIIII       LLLLLLLLL       EEEEEEEEEEE
MMMM           MMMMMMM    OOOOOOOOOOO      BBBBBBBBBB      IIIIIIIII      LLLLLLLLL       EEEEEEEEEEE

```

# 🚀 Getting Started with the App (Expo + React Native)

This project uses **React Native** with **Expo** for rapid mobile development. Follow the steps below to set up your environment and run the app locally.

---

## 📦 Prerequisites

Before running the app, ensure the following are installed:

- **Node.js (v18 or later recommended)**: [https://nodejs.org](https://nodejs.org)
- **Git**: [https://git-scm.com](https://git-scm.com)
- **Expo CLI**: Install globally using `npm install -g expo-cli`
- **Expo Go App** on your phone:

  - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [iOS](https://apps.apple.com/app/expo-go/id982107779)

> ⚠️ Only physical devices are supported with **Expo Go** (not emulators). If you want to run on Android Emulator, see below.

---

## 🧑‍💻 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Add environmental variables

- Create a .env file and add relevant variables (e.g. Supabase url and key)

### 4. Start the Development Server

```bash
npx expo run:android
```

This will open a browser tab with the Expo Developer Tools.

### 5. Run the App

#### On Android Emulator

If you want to test using an emulator:

1. Install **Android Studio**: [https://developer.android.com/studio](https://developer.android.com/studio)
2. During installation, ensure the **Android SDK**, **AVD Manager**, and **HAXM** are checked.
3. Open Android Studio:

   - Go to **More Actions → Virtual Device Manager**.
   - Create a new Android Virtual Device (Pixel 5 or similar, API 33 or higher recommended).
   - Click the **play** ▶️ button to start the emulator.

4. In your terminal (make sure emulator is running):

```bash
npx expo run:android
```

## Troubleshooting issues

If you have certain issues, it might be due to caching from previous build versions. For that just troubleshoot with the following:

- run `npx expo start -c` OR
- run `cd android & ./gradlew clean` (ensure that you have gradle installed)

---

## Create an apk

```bash
npx expo run:android --variant release
```

---

## 🔄 Common Commands

- **Start Expo project with cleared cache**: `npx expo start -c`
- **Start Expo project**: `expo start`
- **Run on Android Emulator**: `expo start --android`
- **Run on iOS Simulator (Mac only)**: `expo start --ios`
- **Build Android APK** (optional): `npx expo build:android`
- **Build iOS app** (Mac + Apple Developer account): `npx expo build:ios`

---

## 📁 Project Structure

```
├───app.json
├───babel.config.js
├───eas.json
├───package-lock.json
├───package.json
├───README.md
├───app
│   ├───home.jsx
│   ├───index.jsx
│   ├───LiveChatScreen.jsx
│   ├───localAccCheck.jsx
│   ├───qrScreen.jsx
│   ├───scanScreen.jsx
│   ├───signup.jsx
│   ├───userinfo.jsx
│   ├───webview.jsx
│   ├───_layout.jsx
│   ├───component
│   │   └───ScanOverlay.jsx
│   └───paynow
│       ├───paynowQuery.jsx
│       └───paynowScreen.jsx
├───assets
│   ├───adaptive-icon.png
│   ├───favicon.png
│   ├───icon.png
│   ├───ic_launcher.png
│   ├───splash-icon.png
│   ├───ZentraAppIcon.png
│   ├───ZentraBankLogo.png
│   └───icons
│       ├───left.png
│       ├───refresh.png
│       ├───safari.png
│       └───share.png
├───docs
│   ├───annotations
│   │   └───signInTrack.txt
│   ├───diagrams
│   │   ├───LocalAccTransferDiagram.puml
│   │   ├───PostNotificationsReceiver.puml
│   │   ├───SignInDiagram.puml
│   │   ├───SignoutDiagram.puml
│   │   ├───SignupDiagram.puml
│   │   ├───SupabaseSignupDiagram.puml
│   │   ├───SupabaseSignupDiagram.puml
│   │   └───WebViewDiagram.puml
│   └───pngOfDiagrams
│       ├───DetailedSignInDiagram.png
│       ├───DetailedSignUpDiagram.jpg
│       ├───SimpleSignUpDiagram.jpg
│       ├───SupabaseSignupDiagram.png
│       └───TransferProcess.svg
├───lib
│   ├───supabase.js
│   └───services
│       ├───accService.js
│       ├───NotificationService.js
│       ├───paynowService.js
│       ├───transferService.js
│       └───userService.js
└───supabase
    ├───config.toml
    ├───.temp
    │   ├───cli-latest
    │   ├───gotrue-version
    │   ├───pooler-url
    │   ├───postgres-version
    │   ├───project-ref
    │   ├───rest-version
    │   └───storage-version
    └───functions
        └───send-notification
            ├───.npmrc
            ├───deno.json
            └───index.ts
```

---

## ❓ Troubleshooting

- **Expo Go stuck or blank screen?** → Close and restart Expo Go, clear cache: `expo start -c`
- **Android Emulator not detected?** → Make sure it's started via Android Studio **before** running `expo start --android`.
- **Dependencies missing or breaking?** → Try deleting `node_modules` and `package-lock.json` or `yarn.lock`, then reinstall:

```bash
rm -rf node_modules
rm package-lock.json # or yarn.lock
npm install
```

---

Colour scheme used: blue (#0e273c), gold (#dcb24e) and white (#fffffe)