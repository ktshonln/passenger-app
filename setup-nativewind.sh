#!/bin/bash
# ─────────────────────────────────────────────
# NativeWind v4 + Expo Router - Full Setup Script
# Usage: bash setup-nativewind.sh <your-app-name>
# ─────────────────────────────────────────────

APP_NAME=${1:-my-app}

echo "🚀 Creating Expo app: $APP_NAME"
npx create-expo-app@latest "$APP_NAME"
cd "$APP_NAME" || exit

echo "📦 Installing NativeWind v4 + dependencies..."
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context

echo "⚙️  Generating metro.config.js..."
npx expo customize metro.config.js

echo "📝 Writing metro.config.js..."
cat > metro.config.js << EOF
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
EOF

echo "📝 Writing tailwind.config.js..."
cat > tailwind.config.js << EOF
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
EOF

echo "📝 Creating global.css at project root..."
cat > global.css << EOF
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

echo "📝 Creating nativewind-env.d.ts..."
cat > nativewind-env.d.ts << EOF
/// <reference types="nativewind/types" />
EOF

echo "📝 Patching app/_layout.tsx..."
LAYOUT_FILE="app/_layout.tsx"
if [ -f "$LAYOUT_FILE" ]; then
  if ! grep -q "global.css" "$LAYOUT_FILE"; then
    printf '%s\n' 'import "../global.css";' | cat - "$LAYOUT_FILE" > tmp_layout && mv tmp_layout "$LAYOUT_FILE"
    echo "  ✔ Added import to app/_layout.tsx"
  else
    echo "  ⚠️  global.css already imported in app/_layout.tsx"
  fi
else
  echo "  Creating app/_layout.tsx..."
  cat > "$LAYOUT_FILE" << EOF
import "../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
EOF
fi

echo ""
echo "════════════════════════════════════════"
echo "  ✅  NativeWind v4 Setup Complete!"
echo "════════════════════════════════════════"
echo ""
echo "Files created/modified:"
echo "  ✔ metro.config.js          (withNativeWind wrapper)"
echo "  ✔ tailwind.config.js       (nativewind/preset added)"
echo "  ✔ global.css               (at project root)"
echo "  ✔ nativewind-env.d.ts      (TypeScript types)"
echo "  ✔ app/_layout.tsx          (import ../global.css at top)"
echo ""
echo "To start your app:"
echo "  npx expo start"
echo ""
echo "Test NativeWind works — add to any screen:"
echo '  <Text className="text-blue-500 text-xl font-bold">Hello NativeWind!</Text>'
echo ""
echo "⚠️  Key rule: ONLY import global.css in app/_layout.tsx"
echo "   Never import it inside app/(tabs)/_layout.tsx"
