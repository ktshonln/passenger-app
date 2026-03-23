import {
    fetchProfile,
    updateProfile,
    UpdateProfilePayload,
    UserProfile,
} from "@/lib/api";
import { useCallback, useState } from "react";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (payload: UpdateProfilePayload) => {
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
  }, []);

  return { profile, loading, error, load, update };
}
