/**
 * Tests for components/search/trip-card-skeleton.tsx
 * Covers: render count, no text content, animation starts on mount
 */
import { render } from "@testing-library/react-native";
import React from "react";
import { Animated } from "react-native";
import { TripCardSkeleton } from "../../../components/search/trip-card-skeleton";

describe("TripCardSkeleton", () => {
  it("renders three skeleton cards", () => {
    const { UNSAFE_getAllByType } = render(<TripCardSkeleton />);
    // Each card is an Animated.View — there should be at least 3 top-level ones
    const animatedViews = UNSAFE_getAllByType(Animated.View);
    // 3 cards + inner animated boxes = more than 3, but at least 3 card-level ones
    expect(animatedViews.length).toBeGreaterThanOrEqual(3);
  });

  it("skeleton containers have no readable text content", () => {
    const { queryAllByText } = render(<TripCardSkeleton />);
    // No text nodes should be present in the skeleton
    const allText = queryAllByText(/.+/);
    expect(allText).toHaveLength(0);
  });

  it("animation starts on mount", () => {
    const loopSpy = jest.spyOn(Animated, "loop");
    render(<TripCardSkeleton />);
    expect(loopSpy).toHaveBeenCalled();
    loopSpy.mockRestore();
  });
});
