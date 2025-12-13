# Mobile Setup Guide (Android Only)

This guide will help you set up the Inventory Management app for Android testing using Capacitor.

## Prerequisites

1. **Node.js** (v18 or higher recommended)
2. **Android Studio** with Android SDK installed
3. **Java JDK** (version 11 or higher)
4. **Android device** or **Android Emulator**

## Step 1: Install Dependencies

Navigate to the `Inventory-Management` directory and install Capacitor packages:

```bash
cd Inventory-Management
npm install
```

This will install:
- `@capacitor/core` - Core Capacitor functionality
- `@capacitor/cli` - Capacitor command-line tools
- `@capacitor/android` - Android platform support
- `@capacitor/camera` - Camera plugin for barcode scanning

## Step 2: Build the Angular App for Mobile

Build the Angular app with the mobile configuration:

```bash
npm run build:mobile
```

This will:
- Use the `environment.mobile.ts` configuration
- Build optimized production files
- Output to `dist/inventory-management`

## Step 3: Initialize Capacitor (First Time Only)

If this is the first time setting up Capacitor, initialize it:

```bash
npx cap init
```

When prompted:
- **App name**: Inventory Management
- **App ID**: com.vinayakainventory.app (or your preferred package name)
- **Web dir**: dist/inventory-management

**Note**: The `capacitor.config.json` file is already created, so you can skip this step if the file exists.

## Step 4: Add Android Platform

Add the Android platform to your project:

```bash
npx cap add android
```

This will:
- Create the `android/` folder
- Set up the Android project structure
- Configure the Android app

## Step 5: Sync Capacitor

Sync your web assets to the native Android project:

```bash
npx cap sync
```

This copies your built web app to the Android project.

## Step 6: Open in Android Studio

Open the Android project in Android Studio:

```bash
npx cap open android
```

Or manually:
1. Open Android Studio
2. Select "Open an Existing Project"
3. Navigate to `Inventory-Management/android` folder
4. Click "OK"

## Step 7: Configure Android App

### Update AndroidManifest.xml (if needed)

The app should work with default settings, but you may need to add internet permission if not already present:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
```

### Update API URL for Development

If testing on a physical device, you'll need to update the API URL in `environment.mobile.ts` to point to your computer's IP address instead of `localhost`:

```typescript
export const environment = {
  production: true,
  baseUrl: 'http://YOUR_COMPUTER_IP:8000', // Replace with your computer's IP
  baseUri: '',
  apiUrl: 'http://YOUR_COMPUTER_IP:8000', // Replace with your computer's IP
  mobile: true
};
```

**To find your computer's IP:**
- Windows: Run `ipconfig` in Command Prompt, look for "IPv4 Address"
- Mac/Linux: Run `ifconfig` or `ip addr`, look for your network interface IP

**Important**: Make sure your computer and Android device are on the same network.

## Step 8: Run on Android Device/Emulator

### Option A: Physical Device

1. Enable **Developer Options** on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. Connect your device via USB

3. In Android Studio:
   - Click the "Run" button (green play icon)
   - Select your connected device
   - The app will install and launch on your device

### Option B: Android Emulator

1. In Android Studio:
   - Click "Device Manager" (phone icon in toolbar)
   - Click "Create Device"
   - Select a device (e.g., Pixel 5)
   - Download and select a system image (e.g., API 33)
   - Finish setup

2. Start the emulator from Device Manager

3. Click "Run" in Android Studio and select the emulator

## Step 9: Development Workflow

### Making Changes

1. **Update Angular code** in `src/`
2. **Rebuild** the app:
   ```bash
   npm run build:mobile
   ```
3. **Sync** to Android:
   ```bash
   npx cap sync
   ```
4. **Reload** the app in Android Studio (or use Live Reload if configured)

### Testing Barcode Scanner

The barcode scanner should work using the device camera. Make sure:
- Camera permission is granted
- The app has access to the camera
- You're testing with actual barcodes or QR codes

## Troubleshooting

### App won't connect to API

- Check that your computer's IP address is correct in `environment.mobile.ts`
- Ensure your computer and device are on the same network
- Check that the PHP server is running and accessible
- Verify firewall settings allow connections on port 8000

### Build errors

- Make sure all dependencies are installed: `npm install`
- Clear Angular cache: `rm -rf .angular/cache` (or delete `.angular` folder)
- Rebuild: `npm run build:mobile`

### Android Studio issues

- Make sure Android SDK is properly installed
- Update Android Studio to the latest version
- Sync Gradle files: File → Sync Project with Gradle Files

### Camera not working

- Check app permissions in Android Settings
- Ensure `@capacitor/camera` is properly installed
- Verify camera permissions in AndroidManifest.xml

## Quick Commands Reference

```bash
# Build for mobile
npm run build:mobile

# Sync to Android
npx cap sync

# Open Android Studio
npx cap open android

# Add Android platform (first time)
npx cap add android
```

## Production Build

For production deployment:

1. Update `environment.mobile.ts` with production API URL:
   ```typescript
   apiUrl: 'https://vinayakashot.net'
   ```

2. Build:
   ```bash
   npm run build:mobile
   ```

3. Sync:
   ```bash
   npx cap sync
   ```

4. Generate signed APK/AAB in Android Studio:
   - Build → Generate Signed Bundle / APK
   - Follow the signing wizard

## Notes

- The app uses Capacitor 6.x
- Camera plugin is included for barcode scanning
- All API calls use HTTPS in production
- The app is configured for Android only (iOS support can be added later if needed)

