import { Platform } from "react-native";

/** Bottom padding to clear the floating tab bar */
export const TAB_BAR_BOTTOM_PADDING = Platform.OS === "ios" ? 120 : 96;
