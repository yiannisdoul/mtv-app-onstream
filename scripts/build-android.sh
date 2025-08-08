#!/bin/bash

echo "📱 OnStream Android APK Builder"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_step "Checking build requirements..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    print_error "Java is not installed. Please install Java 17+"
    print_warning "Install with: sudo apt install openjdk-17-jdk"
    exit 1
else
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    print_success "Java $JAVA_VERSION installed"
fi

# Check if Android SDK is configured
if [ -z "$ANDROID_HOME" ]; then
    print_warning "ANDROID_HOME not set. You may need to configure Android SDK path."
    # Try to detect Android SDK
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
        export PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools"
        print_success "Auto-detected Android SDK at $ANDROID_HOME"
    elif [ -d "/opt/android-sdk" ]; then
        export ANDROID_HOME="/opt/android-sdk"
        export PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools"
        print_success "Auto-detected Android SDK at $ANDROID_HOME"
    fi
fi

# Check if Capacitor is installed
if ! command -v cap &> /dev/null; then
    print_step "Installing Capacitor CLI..."
    npm install -g @capacitor/cli
    if [ $? -eq 0 ]; then
        print_success "Capacitor CLI installed"
    else
        print_error "Failed to install Capacitor CLI"
        exit 1
    fi
else
    print_success "Capacitor CLI found"
fi

# Step 1: Build frontend
print_step "Building frontend for production..."

cd frontend || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_step "Installing frontend dependencies..."
    yarn install
fi

# Build production bundle
yarn build
if [ $? -eq 0 ]; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

cd ..

# Step 2: Initialize Capacitor if needed
if [ ! -f "capacitor.config.ts" ]; then
    print_step "Initializing Capacitor..."
    npx cap init OnStream com.onstream.app --web-dir=frontend/build
    print_success "Capacitor initialized"
else
    print_success "Capacitor already initialized"
fi

# Install Capacitor dependencies
print_step "Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/cli @capacitor/android

# Step 3: Add Android platform
if [ ! -d "android" ]; then
    print_step "Adding Android platform..."
    npx cap add android
    print_success "Android platform added"
else
    print_success "Android platform already exists"
fi

# Step 4: Sync with Capacitor
print_step "Syncing with Capacitor..."
npx cap sync android
if [ $? -eq 0 ]; then
    print_success "Capacitor sync completed"
else
    print_error "Capacitor sync failed"
    exit 1
fi

# Step 5: Configure Android app
print_step "Configuring Android app..."

# Update app name and package
if [ -f "android/app/src/main/res/values/strings.xml" ]; then
    sed -i 's/<string name="app_name">.*<\/string>/<string name="app_name">OnStream<\/string>/' android/app/src/main/res/values/strings.xml
    print_success "App name configured"
fi

# Enable cleartext traffic for streaming
ANDROID_MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$ANDROID_MANIFEST" ]; then
    if ! grep -q "usesCleartextTraffic" "$ANDROID_MANIFEST"; then
        sed -i 's/android:theme="@style\/AppTheme"/android:theme="@style\/AppTheme"\n        android:usesCleartextTraffic="true"/' "$ANDROID_MANIFEST"
        print_success "Cleartext traffic enabled for streaming"
    fi
    
    # Add network permissions
    if ! grep -q "android.permission.INTERNET" "$ANDROID_MANIFEST"; then
        sed -i '/<manifest/a\    <uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />' "$ANDROID_MANIFEST"
        print_success "Network permissions added"
    fi
fi

# Step 6: Build APK
print_step "Building Android APK..."

cd android || exit 1

# Build debug APK (for testing)
print_step "Building debug APK..."
./gradlew assembleDebug
if [ $? -eq 0 ]; then
    print_success "Debug APK built successfully"
    DEBUG_APK="app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$DEBUG_APK" ]; then
        cp "$DEBUG_APK" "../onstream-debug.apk"
        print_success "Debug APK copied to: onstream-debug.apk"
    fi
else
    print_error "Debug APK build failed"
fi

# Build release APK (for distribution)
print_step "Building release APK..."
./gradlew assembleRelease
if [ $? -eq 0 ]; then
    print_success "Release APK built successfully"
    RELEASE_APK="app/build/outputs/apk/release/app-release-unsigned.apk"
    if [ -f "$RELEASE_APK" ]; then
        cp "$RELEASE_APK" "../onstream-release-unsigned.apk"
        print_success "Release APK copied to: onstream-release-unsigned.apk"
    fi
else
    print_warning "Release APK build failed (this is normal without signing key)"
    print_warning "Using debug APK for testing purposes"
fi

cd ..

# Step 7: Final instructions
echo ""
echo "🎉 OnStream Android APK Build Complete!"
echo "======================================="
echo ""
echo "📱 Generated APK files:"
if [ -f "onstream-debug.apk" ]; then
    APK_SIZE=$(du -h onstream-debug.apk | cut -f1)
    echo "   🔧 Debug APK: onstream-debug.apk ($APK_SIZE)"
fi
if [ -f "onstream-release-unsigned.apk" ]; then
    APK_SIZE=$(du -h onstream-release-unsigned.apk | cut -f1)
    echo "   📦 Release APK: onstream-release-unsigned.apk ($APK_SIZE)"
fi
echo ""
echo "📋 Installation Options:"
echo "1. 📲 Direct Install:"
echo "   - Copy APK to Android device"
echo "   - Enable 'Unknown Sources' in Settings"
echo "   - Tap APK file to install"
echo ""
echo "2. 🔧 ADB Install:"
echo "   adb install onstream-debug.apk"
echo ""
echo "3. 🏗️  Android Studio:"
echo "   npx cap open android"
echo "   # Build and run from Android Studio"
echo ""
echo "🔐 For Production (Play Store):"
echo "   1. Generate signing key: keytool -genkey -v -keystore release.keystore -alias onstream -keyalg RSA -keysize 2048 -validity 10000"
echo "   2. Configure signing in android/app/build.gradle"
echo "   3. Build signed release: ./gradlew assembleRelease"
echo ""
echo "✨ Features included in APK:"
echo "   ✅ Free movie/TV streaming"
echo "   ✅ PWA offline functionality"
echo "   ✅ Mobile-optimized UI"
echo "   ✅ Multiple streaming servers"
echo "   ✅ No subscription required"
echo ""
print_success "OnStream APK is ready for Android devices! 🚀"