#!/bin/sh
set -eu
cd "$(dirname "$0")"
: "${ANDROID_HOME:=${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
: "${BUILD_TOOLS:=34.0.0}"
: "${ANDROID_PLATFORM:=android-34}"
tools="$ANDROID_HOME/build-tools/$BUILD_TOOLS"
platform="$ANDROID_HOME/platforms/$ANDROID_PLATFORM/android.jar"
out=build
rm -rf "$out"
mkdir -p "$out/classes" "$out/dex" "$out/assets/icons"
cp ../index.html ../style.css ../app.js ../channels.js ../playlist.js ../pwa.js ../sw.js ../manifest.webmanifest "$out/assets/"
cp ../icons/* "$out/assets/icons/"
"$tools/aapt" package -f -M AndroidManifest.xml -S res -A "$out/assets" -I "$platform" -F "$out/unsigned.apk"
javac -source 8 -target 8 -bootclasspath "$platform" -d "$out/classes" src/com/signaltv/app/MainActivity.java
"$tools/d8" --min-api 23 --lib "$platform" --output "$out/dex" "$out/classes"/com/signaltv/app/*.class
(cd "$out/dex" && "$tools/aapt" add ../unsigned.apk classes.dex)
"$tools/zipalign" -f 4 "$out/unsigned.apk" "$out/aligned.apk"
: "${KEYSTORE:=$HOME/.android/debug.keystore}"
: "${KEY_ALIAS:=androiddebugkey}"
: "${KEYSTORE_PASSWORD:=android}"
: "${KEY_PASSWORD:=$KEYSTORE_PASSWORD}"
export KEYSTORE_PASSWORD KEY_PASSWORD
"$tools/apksigner" sign --ks "$KEYSTORE" --ks-key-alias "$KEY_ALIAS" --ks-pass env:KEYSTORE_PASSWORD --key-pass env:KEY_PASSWORD --out "$out/signal-tv.apk" "$out/aligned.apk"
"$tools/apksigner" verify "$out/signal-tv.apk"
printf 'Built %s\n' "$PWD/$out/signal-tv.apk"
