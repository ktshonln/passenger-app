import { AppBar } from "@/components/ui/app-bar";
import { useProfile } from "@/hooks/use-profile";
import * as userService from "@/src/services/user.service";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label,
  value,
  original,
  onChangeText,
  error,
  placeholder,
  keyboardType = "default",
  editable = true,
  icon,
}: {
  label: string;
  value: string;
  original?: string;
  onChangeText: (t: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  editable?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const [focused, setFocused] = useState(false);
  const changed = original !== undefined && value.trim() !== original.trim();

  return (
    <View style={S.fieldWrap}>
      <View style={S.fieldLabelRow}>
        <Text style={S.fieldLabel}>{label}</Text>
        {changed && (
          <View style={S.changedBadge}>
            <Text style={S.changedText}>edited</Text>
          </View>
        )}
      </View>
      <View
        style={[
          S.fieldBox,
          focused && S.fieldBoxFocused,
          !!error && S.fieldBoxError,
          !editable && S.fieldBoxDisabled,
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={!editable ? "#A0A8B4" : focused ? "#0A4370" : "#6A717D"}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={[S.fieldInput, !editable && { color: "#A0A8B4" }]}
          placeholder={placeholder}
          placeholderTextColor="#A0A8B4"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          autoCorrect={false}
          editable={editable}
        />
        {!editable && (
          <Ionicons name="lock-closed-outline" size={14} color="#C8CDD6" />
        )}
        {editable && changed && (
          <TouchableOpacity
            onPress={() => onChangeText(original ?? "")}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={16} color="#A0A8B4" />
          </TouchableOpacity>
        )}
      </View>
      {!!error && (
        <View style={S.fieldError}>
          <Ionicons name="alert-circle-outline" size={12} color="#E53E3E" />
          <Text style={S.fieldErrorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatarPath,
  size = 80,
}: {
  name: string;
  avatarPath?: string | null;
  size?: number;
}) {
  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  return (
    <View
      style={[S.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {avatarPath ? (
        <Image
          source={{ uri: `https://api.katisha.online/storage/${avatarPath}` }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <Text style={[S.avatarText, { fontSize: size * 0.32 }]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

// ─── Password Modal ───────────────────────────────────────────────────────────

function PasswordModal({
  visible,
  onSubmit,
  onCancel,
  loading,
  title = "Enter Password",
}: {
  visible: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
}) {
  const [password, setPassword] = useState("");

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={S.modalBackdrop}>
        <View style={S.modalContent}>
          <Text style={S.modalTitle}>{title}</Text>
          <Text style={S.modalSubtitle}>
            Please enter your current password
          </Text>
          <View style={[S.fieldBox, { marginVertical: 16 }]}>
            <Ionicons
              name="lock-closed-outline"
              size={17}
              color="#6A717D"
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={S.fieldInput}
              placeholder="Password"
              placeholderTextColor="#A0A8B4"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <View style={S.modalButtons}>
            <TouchableOpacity style={S.modalCancelBtn} onPress={onCancel}>
              <Text style={S.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.modalSubmitBtn, loading && { opacity: 0.5 }]}
              onPress={() => onSubmit(password)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={S.modalSubmitBtnText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, loading, load, update } = useProfile();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  // Pre-fill from auth store immediately, then override with profile API data
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [phone, setPhone] = useState(user?.phone_number ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatarPath, setAvatarPath] = useState<string | null>(
    user?.avatar_path ?? null,
  );
  const [tempAvatarUri, setTempAvatarUri] = useState<string | null>(null);

  // Track originals to detect changes
  const [origFirstName, setOrigFirstName] = useState(firstName);
  const [origLastName, setOrigLastName] = useState(lastName);
  const [origPhone, setOrigPhone] = useState(phone);
  const [origEmail, setOrigEmail] = useState(email);
  const [origAvatarPath, setOrigAvatarPath] = useState(avatarPath);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    load();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 16,
        bounciness: 4,
      }),
    ]).start();
  }, [load]);

  // When profile loads from API, update fields and originals
  useEffect(() => {
    if (profile) {
      // Backward compatibility for name:
      if (profile.first_name !== undefined) {
        setFirstName(profile.first_name);
        setLastName(profile.last_name);
      } else if (profile.name) {
        const parts = profile.name.split(" ");
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(" "));
      }
      setPhone(profile.phone_number);
      setEmail(profile.email || "");
      setAvatarPath(profile.avatar_path);
      setOrigFirstName(firstName);
      setOrigLastName(lastName);
      setOrigPhone(profile.phone_number);
      setOrigEmail(profile.email || "");
      setOrigAvatarPath((profile as any).avatar_path);
    }
  }, [profile]);

  const hasChanges =
    firstName.trim() !== origFirstName ||
    lastName.trim() !== origLastName ||
    phone.trim() !== origPhone ||
    email.trim() !== origEmail ||
    avatarPath !== origAvatarPath;

  const name = `${firstName} ${lastName}`.trim();

  const pickImage = async () => {
    // Request permissions first
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setTempAvatarUri(result.assets[0].uri);
      await uploadAvatar(result.assets[0].uri, result.assets[0].mimeType);
    }
  };

  const uploadAvatar = async (uri: string, mimeType?: string | null) => {
    if (!token) return;
    setUploadingAvatar(true);
    try {
      // Get presigned URL
      const contentType = (mimeType || "image/jpeg") as any;
      const { upload_url: uploadUrl, path } =
        await userService.getAvatarPresignedUrl(token, contentType);
      // Upload image
      const formData = new FormData();
      // For React Native, uri should be file:// path:
      const file = {
        uri: uri,
        name: "avatar.jpg",
        type: contentType,
      };
      formData.append("file", file as any);
      // Use fetch to upload with PUT to presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: {
          uri,
          type: contentType,
        } as any, // React Native fetch uses this syntax
      });
      if (!uploadResponse.ok) throw new Error("Upload failed");
      // Update profile
      setAvatarPath(path);
    } catch (err) {
      Alert.alert("Failed to upload avatar", "Please try again later.");
      setTempAvatarUri(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!phone.trim()) e.phone = "Phone is required";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!hasChanges) {
      router.back();
      return;
    }

    setSaving(true);
    try {
      await update({
        first_name:
          firstName.trim() !== origFirstName ? firstName.trim() : undefined,
        last_name:
          lastName.trim() !== origLastName ? lastName.trim() : undefined,
        avatar_path: avatarPath !== origAvatarPath ? avatarPath : undefined,
      });
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(1400),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => router.back());
    } catch {
      setErrors({ submit: t("profile.failedToSave") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={S.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      {/* Header */}
      <AppBar
        title={t("profile.editProfile")}
        subtitle={t("profile.updateInfo")}
      />

      {loading && !profile && !user ? (
        <View style={S.loadingWrap}>
          <ActivityIndicator size="large" color="#0A4370" />
        </View>
      ) : (
        <ScrollView
          style={S.scroll}
          contentContainerStyle={S.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Avatar section */}
            <View style={S.avatarSection}>
              <View style={S.avatarWrap}>
                <Avatar
                  name={name}
                  avatarPath={tempAvatarUri || avatarPath}
                  size={88}
                />
                <View style={S.avatarRing} />
              </View>
              <Text style={S.avatarName}>{name || "—"}</Text>
              <Text style={S.avatarPhone}>{phone || "—"}</Text>
              <TouchableOpacity
                style={S.changePhotoBtn}
                activeOpacity={0.7}
                onPress={pickImage}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#0A4370" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={14} color="#0A4370" />
                    <Text style={S.changePhotoText}>
                      {t("profile.changePhoto")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Form card */}
            <View style={S.card}>
              <View style={S.cardHeader}>
                <Ionicons
                  name="person-circle-outline"
                  size={16}
                  color="#6A717D"
                />
                <Text style={S.cardTitle}>{t("profile.personalInfo")}</Text>
              </View>

              <Field
                label={t("profile.firstName")}
                value={firstName}
                original={origFirstName}
                onChangeText={setFirstName}
                error={errors.firstName}
                placeholder="First Name"
                icon="person-outline"
              />
              <Field
                label={t("profile.lastName")}
                value={lastName}
                original={origLastName}
                onChangeText={setLastName}
                error={errors.lastName}
                placeholder="Last Name"
                icon="person-outline"
              />
              <Field
                label={t("profile.phoneNumber")}
                value={phone}
                original={origPhone}
                onChangeText={setPhone}
                error={errors.phone}
                placeholder={t("profile.phonePlaceholder")}
                keyboardType="phone-pad"
                icon="call-outline"
                editable={false} // TODO: Implement login channel change
              />
              <Field
                label={t("profile.emailAddress")}
                value={email || ""}
                original={origEmail}
                onChangeText={setEmail}
                error={errors.email}
                placeholder={t("profile.emailPlaceholder")}
                keyboardType="email-address"
                icon="mail-outline"
                editable={false} // TODO: Implement login channel change
              />
            </View>

            {/* Changes indicator */}
            {hasChanges && (
              <View style={S.changesBanner}>
                <Ionicons name="pencil-outline" size={14} color="#0A4370" />
                <Text style={S.changesBannerText}>
                  You have unsaved changes
                </Text>
              </View>
            )}

            {/* Error */}
            {!!errors.submit && (
              <View style={S.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={15}
                  color="#E53E3E"
                />
                <Text style={S.errorBannerText}>{errors.submit}</Text>
              </View>
            )}

            {/* Success */}
            <Animated.View
              style={[
                S.successBanner,
                { opacity: successAnim, transform: [{ scale: successAnim }] },
              ]}
            >
              <Ionicons name="checkmark-circle" size={15} color="#38A169" />
              <Text style={S.successBannerText}>
                {t("profile.profileUpdated")}
              </Text>
            </Animated.View>

            {/* Save button */}
            <TouchableOpacity
              style={[S.saveBtn, (!hasChanges || saving) && S.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || !hasChanges}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-outline" size={18} color="#fff" />
                  <Text style={S.saveBtnText}>{t("profile.saveChanges")}</Text>
                </>
              )}
            </TouchableOpacity>

            {hasChanges && (
              <TouchableOpacity
                style={S.discardBtn}
                onPress={() => {
                  setFirstName(origFirstName);
                  setLastName(origLastName);
                  setPhone(origPhone);
                  setEmail(origEmail);
                  setAvatarPath(origAvatarPath);
                  setErrors({});
                }}
                activeOpacity={0.7}
              >
                <Text style={S.discardBtnText}>Discard changes</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      )}
      <PasswordModal
        visible={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        onSubmit={() => {}}
        loading={false}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F4F6" },

  header: {
    backgroundColor: "#0A4370",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  backText: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 3 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },

  // Avatar
  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: {
    backgroundColor: "#0A4370",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800" },
  avatarRing: {
    position: "absolute",
    inset: -3,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: "rgba(10,67,112,0.2)",
    width: 94,
    height: 94,
    top: -3,
    left: -3,
  },
  avatarName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A202C",
    marginBottom: 2,
  },
  avatarPhone: { fontSize: 13, color: "#6A717D", marginBottom: 10 },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF4FF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  changePhotoText: { fontSize: 12, color: "#0A4370", fontWeight: "700" },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#6A717D",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6A717D",
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#0A4370",
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#6A717D",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Field
  fieldWrap: { marginBottom: 14 },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6A717D",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  changedBadge: {
    backgroundColor: "#EEF4FF",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  changedText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0A4370",
    letterSpacing: 0.5,
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F8F9FB",
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  fieldBoxFocused: { borderColor: "#0A4370", backgroundColor: "#fff" },
  fieldBoxError: { borderColor: "#E53E3E", backgroundColor: "#FFF5F5" },
  fieldBoxDisabled: { backgroundColor: "#F3F4F6", borderColor: "#E2E8F0" },
  fieldInput: { flex: 1, fontSize: 15, color: "#1A202C" },
  fieldError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  fieldErrorText: { fontSize: 11, color: "#E53E3E" },

  // Banners
  changesBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EEF4FF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  changesBannerText: { fontSize: 13, color: "#0A4370", fontWeight: "600" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: "#E53E3E" },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FFF4",
    borderWidth: 1,
    borderColor: "#C6F6D5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  successBannerText: { fontSize: 13, color: "#38A169", fontWeight: "600" },

  // Buttons
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0A4370",
    borderRadius: 16,
    height: 56,
    marginBottom: 10,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  discardBtn: { alignItems: "center", paddingVertical: 12 },
  discardBtnText: { fontSize: 13, color: "#6A717D", fontWeight: "600" },
});
