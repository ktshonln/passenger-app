import { cleanup, renderHook, waitFor } from "@testing-library/react-native";
import { useCompanies } from "../../../hooks/use-companies";
import { useAuthStore } from "../../store/auth.store";

// Force mock mode
jest.mock("../../services/mock.data", () => ({
  ...jest.requireActual("../../services/mock.data"),
  mockDelay: () => Promise.resolve(),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  process.env.EXPO_PUBLIC_USE_MOCK = "true";
  useAuthStore.setState({
    isAuthenticated: true,
    token: "mock-token",
    user: { id: "u1" } as any,
  });
});

describe("useCompanies", () => {
  it("loads companies on mount", async () => {
    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.companies.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it("returns companies matching PublicOrganization mapped shape", async () => {
    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const company = result.current.companies[0];
    expect(company).toHaveProperty("id");
    expect(company).toHaveProperty("name");
    expect(company).toHaveProperty("shortName");
    expect(company).toHaveProperty("logoUrl");
  });
});

describe("useCompanies — public API (no auth)", () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCK = "false";
    mockFetch.mockClear();
    global.fetch = mockFetch as any;
  });

  it("calls /api/v1/organizations/public without Authorization header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "1",
          name: "Volcano",
          slug: "volcano",
          org_type: "bus_company",
          logo_path: "/logos/volcano.png",
        },
      ],
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const calls = mockFetch.mock.calls.filter(([url]: [string]) =>
      url.includes("/api/v1/organizations/public"),
    );
    expect(calls.length).toBeGreaterThan(0);
    const [, options] = calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it("maps logo_path to logoUrl", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "1",
          name: "Volcano",
          slug: "volcano",
          org_type: "bus_company",
          logo_path: "/logos/volcano.png",
        },
      ],
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies[0].logoUrl).toBe("/logos/volcano.png");
  });

  it("maps name to both name and shortName", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "1",
          name: "Volcano Express",
          slug: "volcano",
          org_type: "bus_company",
          logo_path: "/logos/volcano.png",
        },
      ],
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const company = result.current.companies[0];
    expect(company.name).toBe("Volcano Express");
    expect(company.shortName).toBe("Volcano Express");
  });

  it("handles empty response gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies).toEqual([]);
  });

  it("loads even when no auth token is set", async () => {
    useAuthStore.setState({ isAuthenticated: false, token: null });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "1",
          name: "Volcano",
          slug: "volcano",
          org_type: "bus_company",
          logo_path: "/logos/volcano.png",
        },
      ],
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies.length).toBeGreaterThan(0);
  });
});
