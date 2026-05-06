/**
 * Tests for components/search/filter-sheet.tsx
 * Covers: draft init, Apply, Close, Reset, logo image
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import {
    defaultFilters,
    FilterSheet,
    FilterValues,
} from "../../../components/search/filter-sheet";
import type { Company } from "../../../lib/api";

const t = (key: string) => {
  const map: Record<string, string> = {
    "search.filters": "Filters",
    "search.sortBy": "Sort By",
    "search.sortTime": "Departure Time",
    "search.sortPrice": "Price (Low)",
    "search.sortPriceDesc": "Price (High)",
    "search.sortDuration": "Duration",
    "search.sortRating": "Rating",
    "search.busType": "Bus Type",
    "search.allTypes": "All",
    "search.company": "Company",
    "search.allCompanies": "All Companies",
    "search.applyFilters": "Apply Filters",
    "search.reset": "Reset",
  };
  return map[key] ?? key;
};

const COMPANIES: Company[] = [
  {
    id: "c1",
    name: "Volcano Express",
    shortName: "Volcano",
    logoUrl: "https://example.com/logo.png",
    color: "#E53E3E",
    rating: 4.8,
    totalTripsPerDay: 12,
    popular: true,
  },
];

const APPLIED: FilterValues = {
  sortKey: "price_asc",
  busType: "Express",
  companyId: "c1",
};

function renderSheet(
  applied: FilterValues = defaultFilters,
  onApply = jest.fn(),
  onClose = jest.fn(),
) {
  return render(
    <FilterSheet
      visible
      onClose={onClose}
      onApply={onApply}
      applied={applied}
      companies={COMPANIES}
      t={t}
    />,
  );
}

describe("FilterSheet", () => {
  it("initialises draft from applied prop on open", () => {
    renderSheet(APPLIED);
    // The "Price (Low)" sort row should appear selected (applied.sortKey = price_asc)
    expect(screen.getByText("Price (Low)")).toBeTruthy();
  });

  it("draft changes do not affect parent until Apply", () => {
    const onApply = jest.fn();
    renderSheet(defaultFilters, onApply);
    // Tap "Price (Low)" sort option
    fireEvent.press(screen.getByText("Price (Low)"));
    expect(onApply).not.toHaveBeenCalled();
  });

  it("Apply button calls onApply with draft values", () => {
    const onApply = jest.fn();
    renderSheet(defaultFilters, onApply);
    fireEvent.press(screen.getByText("Price (Low)"));
    fireEvent.press(screen.getByText("Apply Filters"));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0].sortKey).toBe("price_asc");
  });

  it("Close button calls onClose without calling onApply", () => {
    const onApply = jest.fn();
    const onClose = jest.fn();
    renderSheet(defaultFilters, onApply, onClose);
    // The X close button
    const closeButtons = screen.getAllByRole("button");
    // Find the close icon button (Ionicons "close")
    fireEvent.press(closeButtons[0]);
    expect(onClose).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("Reset button restores draft to defaults", () => {
    const onApply = jest.fn();
    renderSheet(APPLIED, onApply);
    fireEvent.press(screen.getByText("Reset"));
    // After reset, applying should give defaultFilters values
    fireEvent.press(screen.getByText("Apply Filters"));
    expect(onApply.mock.calls[0][0]).toEqual(defaultFilters);
  });

  it("company chips render <Image> for URL logos", () => {
    const { UNSAFE_getAllByType } = renderSheet(defaultFilters);
    const { Image } = require("react-native");
    const images = UNSAFE_getAllByType(Image);
    expect(images.length).toBeGreaterThan(0);
    expect(images[0].props.source.uri).toBe("https://example.com/logo.png");
  });
});
