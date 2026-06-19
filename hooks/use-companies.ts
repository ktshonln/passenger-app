import {
    Company,
    fetchPublicOrganizations,
    PublicOrganization,
} from "@/lib/api";
import { useEffect, useState } from "react";

function mapToCompany(org: PublicOrganization): Company {
  return {
    id: org.id,
    name: org.name,
    shortName: org.name,
    logo_path: org.logo_path,
    logoUrl: org.logo_path ?? "",
    story: org.story,
    color: "#0A4370",
    rating: org.rating ?? 0,
    totalTripsPerDay: 10,
    popular: true,
  };
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPublicOrganizations()
      .then((orgs) => {
        if (!cancelled) setCompanies(orgs.map(mapToCompany));
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { companies, loading, error };
}
