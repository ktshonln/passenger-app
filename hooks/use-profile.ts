import { UserProfile } from "@/lib/api";
import * as userService from "@/src/services/user.service";
import { useAuthStore } from "@/src/store/auth.store";
import { useCallback, useEffect, useState } from "react";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  // Clear profile on sign-out
  useEffect(() => {
    if (!isAuthenticated) setProfile(null);
  }, [isAuthenticated]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const userProfile = await userService.fetchProfile(token);
      // Update auth store with user
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.getState().setUser({
          ...authUser,
          avatar_path: userProfile.avatar_path,
        });
      }
      // For backward compatibility:
      setProfile({
        ...userProfile,
        name: `${userProfile.first_name} ${userProfile.last_name}`,
        phone: userProfile.phone_number,
        email: userProfile.email,
        preferences: {
          smsNotifications: userProfile.notif_channel?.includes("sms"),
          emailNotifications: userProfile.notif_channel?.includes("email"),
          language: userProfile.locale,
        },
      } as any);
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const update = useCallback(
    async (payload: any) => {
      if (!token) throw new Error("Not authenticated");
      setLoading(true);
      setError(null);
      try {
        // Split first_name/last_name:
        let servicePayload: userService.UpdateProfilePayload = {};
        if (payload.first_name !== undefined)
          servicePayload.first_name = payload.first_name;
        if (payload.last_name !== undefined)
          servicePayload.last_name = payload.last_name;
        if (payload.avatar_path !== undefined)
          servicePayload.avatar_path = payload.avatar_path;
        if (payload.notif_channel !== undefined)
          servicePayload.notif_channel = payload.notif_channel;
        if (payload.locale !== undefined)
          servicePayload.locale = payload.locale;
        // For backward compatibility with old name split:
        if (payload.name) {
          const parts = payload.name.split(" ");
          servicePayload.first_name = parts[0] || "";
          servicePayload.last_name = parts.slice(1).join(" ") || "";
        }
        const updatedUser = await userService.updateProfile(
          token,
          servicePayload,
        );
        // Update auth store
        const authUser = useAuthStore.getState().user;
        if (authUser) {
          useAuthStore.getState().setUser({
            ...authUser,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            avatar_path: updatedUser.avatar_path,
          });
        }
        const updatedProfile: UserProfile = {
          ...updatedUser,
          name: `${updatedUser.first_name} ${updatedUser.last_name}`,
          phone: updatedUser.phone_number,
          email: updatedUser.email,
          preferences: {
            smsNotifications: updatedUser.notif_channel?.includes("sms"),
            emailNotifications: updatedUser.notif_channel?.includes("email"),
            language: updatedUser.locale,
          },
        } as any;
        setProfile(updatedProfile);
        return updatedProfile;
      } catch {
        setError("Failed to update profile");
        throw new Error("Failed to update profile");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  return { profile, loading, error, load, update };
}
