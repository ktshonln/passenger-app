/**
 * PrintTicketButton
 *
 * Shows a "Print Ticket" button. On press:
 *  - Checks AsyncStorage for a saved size preference
 *  - If found → calls print endpoint directly (shows "Change size" link)
 *  - If not found → opens size selector popup
 *
 * On size confirmed → injects HTML into a WebView that auto-calls window.print()
 * via the injectedJavaScript prop (web) or opens a share sheet (native fallback).
 */

import {
  fetchPrintHtml,
  type PrintSize,
  type PrintTicketData,
} from "@/src/services/print.service";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WebView from "react-native-webview";

const STORAGE_KEY = "katisha_print_size";

interface Props {
  ticketId: string;
  /** Ticket data for building the mock receipt */
  ticketData?: PrintTicketData;
  /** Optional style override for the button */
  style?: object;
}

// ─── Size option data ─────────────────────────────────────────────────────────
const SIZE_OPTIONS: {
  value: PrintSize;
  label: string;
  subtitle: string;
  icon: "phone-portrait-outline" | "receipt-outline" | "document-outline";
  preview: string; // emoji visual
}[] = [
  {
    value: "58mm",
    label: "58 mm",
    subtitle: "Small POS / Mobile terminal",
    icon: "phone-portrait-outline",
    preview: "📱",
  },
  {
    value: "80mm",
    label: "80 mm",
    subtitle: "Standard POS / Receipt printer",
    icon: "receipt-outline",
    preview: "🖨️",
  },
  {
    value: "a4",
    label: "A4",
    subtitle: "Office printer / Save as PDF",
    icon: "document-outline",
    preview: "📄",
  },
];

export function PrintTicketButton({ ticketId, ticketData, style }: Props) {
  const { token } = useAuthStore();
  const [webViewRef, setWebViewRef] = useState<WebView | null>(null);

  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState<PrintSize | null>(null);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [savedSize, setSavedSize] = useState<PrintSize | null>(null);
  const [printing, setPrinting] = useState(false);
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);

  // Load saved size on mount
  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v) setSavedSize(v as PrintSize);
    });
  }, []);

  const doPrint = useCallback(
    async (size: PrintSize) => {
      setPrinting(true);
      try {
        const html = await fetchPrintHtml({
          ticketId,
          size,
          token: token ?? undefined,
          data: ticketData ?? { ticketId },
        });
        setPrintHtml(html);
        setShowWebView(true);
      } catch (err: any) {
        const code = err?.message ?? "";
        if (code === "FORBIDDEN") {
          Alert.alert(
            "Error",
            "You do not have permission to print this ticket.",
          );
        } else if (code === "TICKET_NOT_FOUND") {
          Alert.alert("Error", "Ticket not found.");
        } else {
          Alert.alert(
            "Error",
            "Failed to load print receipt. Please try again.",
          );
        }
      } finally {
        setPrinting(false);
      }
    },
    [ticketId, token, ticketData],
  );

  const handlePrintPress = async () => {
    const saved =
      savedSize ??
      ((await AsyncStorage.getItem(STORAGE_KEY)) as PrintSize | null);
    if (saved) {
      setSavedSize(saved);
      await doPrint(saved);
    } else {
      setSelectedSize(null);
      setRememberChoice(false);
      setShowSizeModal(true);
    }
  };

  const handleConfirmSize = async () => {
    if (!selectedSize) return;
    if (rememberChoice) {
      await AsyncStorage.setItem(STORAGE_KEY, selectedSize);
      setSavedSize(selectedSize);
    }
    setShowSizeModal(false);
    await doPrint(selectedSize);
  };

  const handleChangeSize = () => {
    setSelectedSize(savedSize);
    setRememberChoice(false);
    setShowSizeModal(true);
  };

  const handleDownload = () => {
    if (!printHtml) return;

    if (Platform.OS === "web") {
      // Web: Create a blob and download
      const blob = new Blob([printHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${ticketId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Native: Inject JavaScript to trigger download
      webViewRef?.injectJavaScript(`
        (function() {
          const html = document.documentElement.outerHTML;
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'ticket-${ticketId}.html';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          true;
        })();
      `);
    }
  };

  return (
    <>
      {/* ── Print button ── */}
      <View style={[styles.row, style]}>
        <TouchableOpacity
          style={styles.printBtn}
          onPress={handlePrintPress}
          disabled={printing}
          activeOpacity={0.85}
        >
          {printing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="print-outline" size={17} color="#fff" />
              <Text style={styles.printBtnText}>Print Ticket</Text>
            </>
          )}
        </TouchableOpacity>

        {savedSize && (
          <TouchableOpacity
            style={styles.changeSizeLink}
            onPress={handleChangeSize}
          >
            <Text style={styles.changeSizeLinkText}>Change size</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Size selector modal ── */}
      <Modal
        visible={showSizeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSizeModal(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setShowSizeModal(false)}
        >
          <View style={{ flex: 1 }} />
        </TouchableOpacity>

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Title */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select paper size</Text>
            <TouchableOpacity onPress={() => setShowSizeModal(false)}>
              <Ionicons name="close" size={22} color="#1A202C" />
            </TouchableOpacity>
          </View>

          {/* Size options */}
          <View style={styles.optionsRow}>
            {SIZE_OPTIONS.map((opt) => {
              const active = selectedSize === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => setSelectedSize(opt.value)}
                  activeOpacity={0.8}
                >
                  {/* Preview thumbnail */}
                  <View
                    style={[
                      styles.optionPreview,
                      active && styles.optionPreviewActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.previewPaper,
                        opt.value === "58mm" && styles.preview58,
                        opt.value === "80mm" && styles.preview80,
                        opt.value === "a4" && styles.previewA4,
                        active && styles.previewPaperActive,
                      ]}
                    >
                      <View style={styles.previewLine} />
                      <View style={[styles.previewLine, { width: "60%" }]} />
                      <View style={styles.previewQr} />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      active && styles.optionLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.optionSubtitle} numberOfLines={2}>
                    {opt.subtitle}
                  </Text>
                  {active && (
                    <View style={styles.optionCheck}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#0A4370"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Remember choice */}
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberChoice((v) => !v)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                rememberChoice && styles.checkboxChecked,
              ]}
            >
              {rememberChoice && (
                <Ionicons name="checkmark" size={12} color="#fff" />
              )}
            </View>
            <Text style={styles.rememberText}>Remember my choice</Text>
          </TouchableOpacity>

          {/* Confirm button */}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !selectedSize && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirmSize}
            disabled={!selectedSize}
            activeOpacity={0.85}
          >
            <Ionicons name="print-outline" size={17} color="#fff" />
            <Text style={styles.confirmBtnText}>Print</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Hidden WebView that renders the HTML and triggers print ── */}
      {showWebView && printHtml && (
        <Modal
          visible={showWebView}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setShowWebView(false)}
          statusBarTranslucent
        >
          <View style={styles.webViewContainer}>
            {/* Close bar */}
            <View style={styles.webViewBar}>
              <Text style={styles.webViewBarTitle}>Print Preview</Text>
              <View style={styles.webViewBarActions}>
                <TouchableOpacity
                  style={styles.webViewActionBtn}
                  onPress={handleDownload}
                >
                  <Ionicons name="download-outline" size={18} color="#0A4370" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.webViewCloseBtn}
                  onPress={() => setShowWebView(false)}
                >
                  <Ionicons name="close" size={20} color="#1A202C" />
                </TouchableOpacity>
              </View>
            </View>

            <WebView
              source={{ html: printHtml }}
              style={{ flex: 1 }}
              // On web the HTML itself calls window.print() on load.
              // On native we inject a JS call after load as well.
              injectedJavaScript={
                Platform.OS !== "web"
                  ? `(function(){try{window.print();window.ReactNativeWebView.postMessage('printed');}catch(e){}})();true;`
                  : undefined
              }
              onMessage={(event) => {
                if (event.nativeEvent.data === "printed") {
                  // Optional: handle print confirmation
                }
              }}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              ref={setWebViewRef}
            />
          </View>
        </Modal>
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  printBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0A4370",
    borderRadius: 14,
    paddingVertical: 14,
  },
  printBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  changeSizeLink: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  changeSizeLinkText: {
    fontSize: 13,
    color: "#0A4370",
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  // Bottom sheet
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A202C",
  },

  // Size option cards
  optionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    padding: 12,
    alignItems: "center",
    gap: 6,
    position: "relative",
    backgroundColor: "#FAFBFF",
  },
  optionCardActive: {
    borderColor: "#0A4370",
    backgroundColor: "#EEF4FF",
  },
  optionPreview: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  optionPreviewActive: {
    backgroundColor: "#D6E4F7",
  },
  previewPaper: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E0",
    borderRadius: 2,
    padding: 4,
    alignItems: "center",
    gap: 2,
  },
  previewPaperActive: {
    borderColor: "#0A4370",
  },
  preview58: { width: 22, height: 32 },
  preview80: { width: 30, height: 38 },
  previewA4: { width: 36, height: 46 },
  previewLine: { width: "80%", height: 1.5, backgroundColor: "#E2E8F0" },
  previewQr: { width: 8, height: 8, backgroundColor: "#E2E8F0", marginTop: 2 },
  optionEmoji: {
    fontSize: 18,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6A717D",
  },
  optionLabelActive: {
    color: "#0A4370",
  },
  optionSubtitle: {
    fontSize: 10,
    color: "#A0A8B4",
    textAlign: "center",
    lineHeight: 13,
  },
  optionCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  // Remember checkbox
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#0A4370",
    borderColor: "#0A4370",
  },
  rememberText: {
    fontSize: 14,
    color: "#1A202C",
    fontWeight: "500",
  },

  // Confirm button
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0A4370",
    borderRadius: 14,
    paddingVertical: 15,
  },
  confirmBtnDisabled: {
    backgroundColor: "#CBD5E0",
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  // WebView
  webViewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webViewBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 12 : 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
    backgroundColor: "#fff",
  },
  webViewBarTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A202C",
  },
  webViewBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  webViewActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  webViewCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F7F9FC",
    alignItems: "center",
    justifyContent: "center",
  },
});
