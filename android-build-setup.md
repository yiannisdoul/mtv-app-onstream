# 📱 OnStream Android APK Build Guide

Complete guide to build OnStream as an Android APK using Capacitor.

## 🛠️ Prerequisites

### Required Software:
- **Node.js 18+** - JavaScript runtime
- **Java 17** - For Android development
- **Android Studio** - Official Android IDE
- **Capacitor CLI** - Cross-platform native runtime

### Installation Commands:
```bash
# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Java 17
sudo apt update
sudo apt install openjdk-17-jdk

# Install Android Studio
# Download from: https://developer.android.com/studio
# Or use snap: sudo snap install android-studio --classic

# Install Capacitor CLI
npm install -g @capacitor/cli @capacitor/core @capacitor/android
```

## 🔧 Project Setup

### 1. Initialize Capacitor in OnStream:
```bash
cd /app
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init OnStream com.onstream.app --web-dir=frontend/build
```

### 2. Build Frontend:
```bash
cd frontend
yarn build
```

### 3. Add Android Platform:
```bash
npx cap add android
npx cap sync android
```

## 🏗️ Android Studio Setup

### 1. Open Android Studio:
```bash
npx cap open android
```

### 2. Configure Android SDK:
- Open **Tools → SDK Manager**
- Install **Android API 33** (Android 13)
- Install **Android SDK Build-Tools 33.0.0**
- Install **Android SDK Platform-Tools**

### 3. Create Virtual Device (Optional):
- Open **Tools → AVD Manager**
- Create new Virtual Device (Pixel 6 recommended)
- Use **API 33 (Android 13)**

## 📋 Build Configuration

### Update `android/app/build.gradle`:
```gradle
android {
    namespace "com.onstream.app"
    compileSdkVersion 33
    
    defaultConfig {
        applicationId "com.onstream.app"
        minSdkVersion 24
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
        
        // Enable clear text traffic for streaming
        usesCleartextTraffic true
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Update `android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="true">
    
    <activity
        android:name=".MainActivity"
        android:exported="true"
        android:launchMode="singleTask"
        android:theme="@style/AppTheme.NoActionBarLaunch">
        
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
    </activity>
</application>
```

## 🔑 App Signing (Production)

### 1. Generate Signing Key:
```bash
cd android/app
keytool -genkey -v -keystore onstream-release-key.keystore -alias onstream-key -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Create `android/keystore.properties`:
```properties
storeFile=onstream-release-key.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=onstream-key
keyPassword=YOUR_KEY_PASSWORD
```

### 3. Update `android/app/build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## 🚀 Build Commands

### Debug Build (Development):
```bash
# Build debug APK
cd android
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug

# Or use Capacitor
npx cap run android
```

### Release Build (Production):
```bash
# Build release APK
cd android
./gradlew assembleRelease

# Output location:
# android/app/build/outputs/apk/release/app-release.apk
```

### Bundle for Play Store:
```bash
# Build Android App Bundle (AAB)
cd android
./gradlew bundleRelease

# Output location:
# android/app/build/outputs/bundle/release/app-release.aab
```

## 📦 Complete Build Script

Create `build-android.sh`:
```bash
#!/bin/bash
echo "🏗️ Building OnStream for Android..."

# Clean previous build
echo "🧹 Cleaning previous builds..."
cd frontend && yarn build
cd ..

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# Build APK
echo "📱 Building APK..."
cd android
./gradlew assembleRelease

echo "✅ Build complete!"
echo "📍 APK location: android/app/build/outputs/apk/release/app-release.apk"

# Copy APK to root folder
cp app/build/outputs/apk/release/app-release.apk ../onstream-v1.0.0.apk
echo "📲 APK copied to: onstream-v1.0.0.apk"
```

## 🔧 Troubleshooting

### Common Issues:

#### Build Fails:
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

#### Network Security Issues:
Add to `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">vidsrc.to</domain>
        <domain includeSubdomains="true">2embed.cc</domain>
        <domain includeSubdomains="true">api.themoviedb.org</domain>
    </domain-config>
</network-security-config>
```

#### Permission Issues:
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## 📲 Installation Options

### Option 1: Direct APK Install
1. Enable "Unknown Sources" in Android settings
2. Transfer `onstream-v1.0.0.apk` to device
3. Tap APK file to install

### Option 2: ADB Install
```bash
# Install via ADB
adb install onstream-v1.0.0.apk
```

### Option 3: Google Play Store
1. Upload `app-release.aab` to Play Console
2. Follow Play Store review process
3. Publish to store

## 🎯 Final Steps

### Test Installation:
1. ✅ Install APK on Android device
2. ✅ Test movie streaming functionality
3. ✅ Verify offline PWA features work
4. ✅ Test mobile navigation
5. ✅ Confirm streaming servers load

### Distribution:
- **Direct APK**: Share APK file directly
- **Play Store**: Submit for review and publication
- **Alternative Stores**: F-Droid, APKPure, etc.

## 🎉 Success!

Your OnStream APK is now ready for installation on Android devices! 

**APK Features:**
✅ Native Android app experience  
✅ Offline PWA functionality  
✅ Free movie/TV streaming  
✅ Professional mobile UI  
✅ Multiple streaming servers  
✅ No subscription required  

**Installation Size:** ~15-20MB  
**Minimum Android:** 7.0 (API 24)  
**Target Android:** 13.0 (API 33)