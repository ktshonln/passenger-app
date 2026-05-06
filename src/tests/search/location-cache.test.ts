import { LocationSuggestion } from "../../../lib/api";
import * as cache from "../../../lib/location-cache";

const makeResults = (label: string): LocationSuggestion[] => [
  {
    id: label,
    name: label,
    city: label,
    code: label.slice(0, 3).toUpperCase(),
    tripsToday: 0,
    popularDestinations: [],
  },
];

describe("location-cache", () => {
  let dateSpy: jest.SpyInstance;

  beforeEach(() => {
    cache.clear();
  });

  afterEach(() => {
    dateSpy?.mockRestore();
  });

  it("stores and retrieves a result by query", () => {
    const results = makeResults("Kigali");
    cache.set("kig", results);
    expect(cache.get("kig")).toEqual(results);
  });

  it("returns null for unknown query", () => {
    expect(cache.get("xyz")).toBeNull();
  });

  it("returns null for expired entry (TTL)", () => {
    const baseTime = 1_000_000;
    dateSpy = jest.spyOn(Date, "now").mockReturnValue(baseTime);

    cache.set("kig", makeResults("Kigali"));

    // Advance time by just over 5 minutes
    dateSpy.mockReturnValue(baseTime + 300_001);

    expect(cache.get("kig")).toBeNull();
  });

  it("evicts oldest entry when size exceeds 30", () => {
    for (let i = 0; i < 31; i++) {
      cache.set(`key-${i}`, makeResults(`Result ${i}`));
    }
    // key-0 was inserted first and should have been evicted
    expect(cache.get("key-0")).toBeNull();
    // key-30 (the last inserted) should still be present
    expect(cache.get("key-30")).not.toBeNull();
  });

  it("set overwrites existing entry", () => {
    const results1 = makeResults("Kigali v1");
    const results2 = makeResults("Kigali v2");
    cache.set("kig", results1);
    cache.set("kig", results2);
    expect(cache.get("kig")).toEqual(results2);
  });
});
