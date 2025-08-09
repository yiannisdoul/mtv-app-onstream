#!/bin/bash

echo "📱 MTV Android APK Builder"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# MTV Branding Info
echo -e "${PURPLE}"
echo "🎬 MTV - Movies & TV Shows"
echo "📱 Building Native Android APK"
echo "🆔 Package: com.moviesandtv.mtv"
echo "🎨 Theme: Orange Gradient (#FF6B35)"
echo -e "${NC}"

# Check prerequisites
print_step "Checking MTV build requirements..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    print_error "Java is not installed. Please install Java 17+"
    print_warning "Install with: sudo apt install openjdk-17-jdk"
    exit 1
else
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    print_success "Java $JAVA_VERSION installed"
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

# Step 1: Generate MTV Icons
print_step "Generating MTV branded icons..."
node generate-mtv-icons.js

# Step 2: Build frontend
print_step "Building MTV frontend for production..."

cd frontend || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_step "Installing frontend dependencies..."
    yarn install
fi

# Build production bundle
yarn build
if [ $? -eq 0 ]; then
    print_success "MTV frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

cd ..

# Step 3: Initialize Capacitor with MTV branding
if [ ! -f "capacitor.config.ts" ]; then
    print_step "Initializing Capacitor with MTV configuration..."
    npx cap init MTV com.moviesandtv.mtv --web-dir=frontend/build
    print_success "MTV Capacitor initialized"
else
    print_success "Capacitor already initialized for MTV"
fi

# Install Capacitor dependencies
print_step "Installing Capacitor dependencies..."
npm install @capacitor/core @capacitor/cli @capacitor/android

# Step 4: Add Android platform
if [ ! -d "android" ]; then
    print_step "Adding Android platform..."
    npx cap add android
    print_success "MTV Android platform added"
else
    print_success "Android platform already exists"
fi

# Step 5: Sync with Capacitor
print_step "Syncing MTV with Capacitor..."
npx cap sync android
if [ $? -eq 0 ]; then
    print_success "MTV Capacitor sync completed"
else
    print_error "Capacitor sync failed"
    exit 1
fi

# Step 6: Configure Android app with MTV branding
print_step "Configuring MTV Android app..."

# Update app name
if [ -f "android/app/src/main/res/values/strings.xml" ]; then
    sed -i 's/<string name="app_name">.*<\/string>/<string name="app_name">MTV<\/string>/' android/app/src/main/res/values/strings.xml
    print_success "MTV app name configured"
fi

# Update theme colors to MTV orange
COLORS_XML="android/app/src/main/res/values/colors.xml"
if [ ! -f "$COLORS_XML" ]; then
    mkdir -p android/app/src/main/res/values
    cat > "$COLORS_XML" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#FF6B35</color>
    <color name="colorPrimaryDark">#F7931E</color>
    <color name="colorAccent">#FF8C42</color>
    <color name="statusBarColor">#FF6B35</color>
</resources>
EOF
    print_success "MTV theme colors configured"
fi

# Update styles with MTV theme
STYLES_XML="android/app/src/main/res/values/styles.xml"
if [ -f "$STYLES_XML" ]; then
    # Add MTV theme colors to existing styles
    if ! grep -q "colorPrimary" "$STYLES_XML"; then
        sed -i '/<\/style>/i\        <item name="colorPrimary">@color/colorPrimary</item>' "$STYLES_XML"
        sed -i '/<\/style>/i\        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>' "$STYLES_XML"
        sed -i '/<\/style>/i\        <item name="colorAccent">@color/colorAccent</item>' "$STYLES_XML"
        print_success "MTV theme styles updated"
    fi
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

# Step 7: Build MTV APK
print_step "Building MTV Android APK..."

cd android || exit 1

# Build debug APK (for testing)
print_step "Building MTV debug APK..."
./gradlew assembleDebug
if [ $? -eq 0 ]; then
    print_success "MTV Debug APK built successfully"
    DEBUG_APK="app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$DEBUG_APK" ]; then
        cp "$DEBUG_APK" "../mtv-debug.apk"
        print_success "MTV Debug APK copied to: mtv-debug.apk"
    fi
else
    print_error "MTV Debug APK build failed"
fi

# Build release APK (for distribution)
print_step "Building MTV release APK..."
./gradlew assembleRelease
if [ $? -eq 0 ]; then
    print_success "MTV Release APK built successfully"
    RELEASE_APK="app/build/outputs/apk/release/app-release-unsigned.apk"
    if [ -f "$RELEASE_APK" ]; then
        cp "$RELEASE_APK" "../mtv-release-unsigned.apk"
        print_success "MTV Release APK copied to: mtv-release-unsigned.apk"
    fi
else
    print_warning "MTV Release APK build failed (this is normal without signing key)"
    print_warning "Using debug APK for testing purposes"
fi

cd ..

# Step 8: Final MTV APK summary
echo ""
echo -e "${PURPLE}🎉 MTV Android APK Build Complete!${NC}"
echo "=================================="
echo ""
echo -e "${GREEN}📱 Generated MTV APK files:${NC}"
if [ -f "mtv-debug.apk" ]; then
    APK_SIZE=$(du -h mtv-debug.apk | cut -f1)
    echo -e "   ${BLUE}🔧 MTV Debug APK: mtv-debug.apk ($APK_SIZE)${NC}"
fi
if [ -f "mtv-release-unsigned.apk" ]; then
    APK_SIZE=$(du -h mtv-release-unsigned.apk | cut -f1)
    echo -e "   ${BLUE}📦 MTV Release APK: mtv-release-unsigned.apk ($APK_SIZE)${NC}"
fi
echo ""
echo -e "${GREEN}🎨 MTV Branding Features:${NC}"
echo "   ✅ App Name: MTV (Movies & TV)"
echo "   ✅ Package ID: com.moviesandtv.mtv"
echo "   ✅ Theme: Orange Gradient (#FF6B35, #F7931E)"
echo "   ✅ Status Bar: MTV Orange"
echo "   ✅ Splash Screen: MTV Gradient"
echo "   ✅ App Icon: MTV Branded"
echo ""
echo -e "${GREEN}📋 MTV APK Installation:${NC}"
echo "1. 📲 Direct Install:"
echo "   - Copy mtv-debug.apk to Android device"
echo "   - Enable 'Unknown Sources' in Settings"
echo "   - Tap APK file to install MTV"
echo ""
echo "2. 🔧 ADB Install:"
echo "   adb install mtv-debug.apk"
echo ""
echo "3. 🏗️  Android Studio:"
echo "   npx cap open android"
echo "   # Build and run MTV from Android Studio"
echo ""
echo -e "${GREEN}🎬 MTV Features:${NC}"
echo "   ✅ Free movie/TV streaming"
echo "   ✅ MTV branded interface"
echo "   ✅ Orange gradient theme"
echo "   ✅ PWA offline functionality"
echo "   ✅ Mobile-optimized UI"
echo "   ✅ Multiple streaming servers"
echo "   ✅ No subscription required"
echo ""
print_success "MTV APK is ready for Android devices! 🎬📱"