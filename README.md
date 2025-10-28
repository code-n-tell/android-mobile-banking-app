<img width="768" height="266" alt="ChatGPT Image Oct 28, 2025, 10_16_47 AM" src="https://github.com/user-attachments/assets/46b336b2-943b-4859-9480-a458cd0fe1ff" />

# 🧭 About
Zentra is an Android mobile banking app for security practitioners who seeks to understand how a mobile app works, experiment with features, and safely test security concepts in a realistic environment.

# ✨ Features
As a user,
- [X] I want to set up a new account so that I can start using the app's services
- [X] I want to sign in to my account so that I can securely access my personal information and features
- [X] I want to sign out of my account so that I can ensure my information is protected when I'm not using the app
- [X] I want to transfer funds to other accounts so that I can send money to others
- [X] I want to transfer funds using PayNow so that I can make quick and easy payments using just a mobile number or NRIC
- [X] I want to receive push notifications so that I stay informed about important updates in my account
- [X] I want to view web content within the app so that I don't have to switch to an external browser
- [X] I want to send real-time messages to customer support so that I can get immediate help with my issues

# 🛠️ Tech Stack
- Built with [React Native](https://reactnative.dev/) and [Expo](https://expo.dev/)
- Backend powered by [Supabase](https://supabase.com/)

# ⚡ Quick Start
1. Download and install the APK from the [latest release] on your device  
2. Allow necessary permissions on your device  
3. Open the app and start playing immediately  

# 👩‍💻 Developer Setup
## 📦 Prerequisites
Before running Zentra app, make sure you have the following:
| Tool | Why You Need It | How to Install / Download | How to Verify |
|------|----------------|--------------------------|---------------|
| **Node.js & npm** | Node.js runs JavaScript on your machine, and npm manages project dependencies. | Download from [https://nodejs.org](https://nodejs.org) (v18 or later recommended) | `node -v` and `npm -v` should show version numbers |
| **Git** | Used to clone the repo, track changes, and contribute. | Download from [https://git-scm.com](https://git-scm.com) and follow installer instructions | `git --version` should show a version number |
| **Expo CLI** | Simplifies running and managing React Native apps. | Run `npm install -g expo-cli` after Node.js is installed | `expo --version` should show a version number |
| **Java JDK** | Required for Android builds. | Download from [https://www.oracle.com/java/technologies/javase-jdk17-downloads.html](https://www.oracle.com/java/technologies/javase-jdk18-downloads.html) and set `JAVA_HOME` environment variable | `java -version` should show a version number |
| **Android SDK** | Required to build Android apps locally. | Install via [Android Studio](https://developer.android.com/studio) and set `ANDROID_HOME` environment variable | `adb --version` should show a version number |
| **Expo Go App** | Lets you run the app on a physical device without building a full APK/IPA. | Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) or [App Store](https://apps.apple.com/app/expo-go/id982107779) | Open the app on your phone; it should launch successfully |

## 🚀 Getting Started
### Step 1
First, clone the repository to your local machine using `git clone https://github.com/your-username/your-repo-name.git` and navigate into the project folder with `cd your-repo-name`. You may optionally shorten the folder name to `zentra` using `mv your-repo-name zentra` and continue working inside the renamed folder.  
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### Step 2
Next, install all necessary Node.js dependencies by running `npm install` in the root directory. This ensures all required packages for the project are available.  
```bash
npm install
```

### Step 3
To prepare the Android build, navigate to the `android` folder and run `./gradlew clean`. This clears any previous build artifacts, helping to prevent build errors caused by old files. After cleaning, return to the root folder.  
```bash
cd android
gradlew clean
```

### Step 4
You must then set up environment variables by creating a `.env` file in the root directory. Include any required keys, such as the Supabase URL and key. These variables are essential for connecting the app to backend services. Please approach the team if you require them.
  
### Step 5
Before running the app, connect a physical device with USB debugging enabled. This allows your computer to install and run the app directly on the device.  

### Step 6
Finally, start the development server with `npx expo run:android`. Expo will build the app and install it on your connected device, while also opening the Expo Developer Tools in your browser. Once complete, you should see the app running on your device. Any changes you make to the code will reload automatically, making development smooth and interactive.  

Alternatively, if you want to build the app and run it on an Android emulator instead of a physical device, start by installing Android Studio. During installation, make sure that the Android SDK, AVD Manager, and HAXM options are checked. Once installed, open Android Studio, go to More Actions → Virtual Device Manager, and create a new Android Virtual Device (for example, a Pixel 5 or similar, API 33 or higher is recommended). Click the play ▶️ button to start the emulator. With the emulator running, you can then run npx expo run:android in your terminal to build and launch the app on the virtual device.

```bash
npx expo run:android
```

## 🔄 Common Commands
- **Start Expo project with cleared cache**: `npx expo start -c`
- **Start Expo project**: `expo start`
- **Run on Android Emulator**: `expo start --android`
- **Run on iOS Simulator (Mac only)**: `expo start --ios`
- **Build Android APK** (optional): `npx expo build:android`
- **Build iOS app** (Mac + Apple Developer account): `npx expo build:ios`
- **Create an apk**: `npx expo run:android --variant release`

## ❓ Troubleshooting
- **Expo Go stuck or blank screen?** → Close and restart Expo Go, clear cache: `expo start -c`
- **Android Emulator not detected?** → Make sure it's started via Android Studio **before** running `expo start --android`.
- **Dependencies missing or breaking?** → Try deleting `node_modules` and `package-lock.json` or `yarn.lock`, then reinstall:
```bash
rm -rf node_modules
rm package-lock.json # or yarn.lock
npm install
```

# 🤝 Contributing
Contributions are welcome and appreciated! If you wish to improve this project:
- Fork the repo
- Create a feature branch
- Commit your Changes
- Push to your Branch
- Open a Pull Request

# 📄 License
This project is released under the MIT License, which means you are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, as long as you include the original copyright notice. The software is provided “as is,” without warranty of any kind, either express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, or non-infringement. For full details, please refer to the [License](./LICENSE).

# 🙏 Acknowledgements
- Cybersecurity software engineer, Nicholas Tok
- Cybersecurity software engineer, Ahmad Syuaib
- Product delivery manager, Gerald Lau
