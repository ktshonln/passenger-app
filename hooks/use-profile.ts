import {
    fetchProfile,
    getAuthToken,
    updateProfile,
    UpdateProfilePayload,
    UserProfile,
} from "@/lib/api";
import { useAuthStore } from "@/src/store/auth.store";
import { useCallback, useEffect, useState } from "react";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Clear profile on sign-out
  useEffect(() => {
    if (!isAuthenticated) setProfile(null);
  }, [isAuthenticated]);

  const load = useCallback(async () => {
    if (!getAuthToken()) return;
    setLoading(true);
    setError(null);
    try {
      setProfile(await fetchProfile());
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(
    async (payload: UpdateProfilePayload): Promise<UserProfile> => {
      setLoading(true);
      setError(null);
      try {
        const data = await updateProfile(payload);
        setProfile(data);
        return data;
      } catch {
        setError("Failed to update profile");
        throw new Error("Failed to update profile");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { profile, loading, error, load, update };
}
