/**
 * Tests for components/search/trip-card.tsx
 * Covers: logo image, fallback, urgency badge, onBook
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { TripCard } from "../../../components/search/trip-card";
import type { Company, Trip } from "../../../lib/api";

const t = (key: string, opts?: any) => {
  if (key === "trips.seatsLeft") return `${opts?.count} seats left`;
  if (key === "trips.bookNow") return "Book Now";
  if (key === "home.perPerson") return "per person";
  return key;
};

const BASE_TRIP: Trip = {
  id: "t1",
  from: { id: "l1", name: "Kigali", city: "Kigali", code: "KGL" },
  to: { id: "l2", name: "Musanze", city: "Musanze", code: "MSZ" },
  departureTime: "2026-04-06T08:00:00",
  arrivalTime: "2026-04-06T10:00:00",
  duration: "2h",
  operator: "Volcano Express",
  operatorId: "c1",
  price: 3000,
  currency: "RWF",
  seatsAvailable: 10,
  busType: "Express",
};

const COMPANY_WITH_URL: Company = {
  id: "c1",
  name: "Volcano Express",
  shortName: "Volcano",
  logoUrl: "https://example.com/logo.png",
  color: "#E53E3E",
  rating: 4.8,
  totalTripsPerDay: 12,
  popular: true,
};

const COMPANY_WITH_EMOJI: Company = {
  ...COMPANY_WITH_URL,
  logoUrl: "🌋",
};

describe("TripCard", () => {
  it("renders operator name", () => {
    render(
      <TripCard
        trip={BASE_TRIP}
        company={COMPANY_WITH_URL}
        onBook={() => {}}
        t={t}
      />,
    );
    expect(screen.getByText("Volcano Express")).toBeTruthy();
  });

  it("renders <Image> when company.logoUrl is an HTTP URL", () => {
    const { UNSAFE_getAllByType } = render(
      <TripCard
        trip={BASE_TRIP}
        company={COMPANY_WITH_URL}
        onBook={() => {}}
        t={t}
      />,
    );
    const { Image } = require("react-native");
    const images = UNSAFE_getAllByType(Image);
    expect(images.length).toBeGreaterThan(0);
    expect(images[0].props.source.uri).toBe("https://example.com/logo.png");
  });

  it("renders initial-letter fallback when logoUrl is emoji", () => {
    render(
      <TripCard
        trip={BASE_TRIP}
        company={COMPANY_WITH_EMOJI}
        onBook={() => {}}
        t={t}
      />,
    );
    // Image should NOT be rendered for emoji; fallback letter "V" should appear
    expect(screen.getByText("V")).toBeTruthy();
  });

  it("renders initial-letter fallback when company is undefined", () => {
    render(
      <TripCard trip={BASE_TRIP} company={undefined} onBook={() => {}} t={t} />,
    );
    expect(screen.getByText("V")).toBeTruthy();
  });

  it("shows urgency badge when seatsAvailable <= 5", () => {
    const lowSeatTrip = { ...BASE_TRIP, seatsAvailable: 3 };
    render(
      <TripCard
        trip={lowSeatTrip}
        company={COMPANY_WITH_URL}
        onBook={() => {}}
        t={t}
      />,
    );
    expect(screen.getByText("3 seats left")).toBeTruthy();
  });

  it("calls onBook when Book Now is pressed", () => {
    const onBook = jest.fn();
    render(
      <TripCard
        trip={BASE_TRIP}
        company={COMPANY_WITH_URL}
        onBook={onBook}
        t={t}
      />,
    );
    fireEvent.press(screen.getByText("Book Now"));
    expect(onBook).toHaveBeenCalledTimes(1);
  });
});
