/**
 * Tests for components/search/search-card.tsx
 * Covers: time picker toggle, time values in callback, validation
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { SearchCard } from "../../../components/search/search-card";

// Mock i18n
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "home.planJourney": "Plan Journey",
        "home.from": "From",
        "home.to": "To",
        "home.departurePlaceholder": "Departure city",
        "home.destinationPlaceholder": "Destination city",
        "home.travelDate": "Travel Date",
        "home.selectDate": "Select date",
        "home.searchBuses": "Search Buses",
        "home.errorFrom": "Enter departure",
        "home.errorTo": "Enter destination",
        "home.errorDate": "Select a date",
        "home.errorSameLocation": "Same location",
        "search.addTimeFilter": "Add time filter",
        "search.hideTimeFilter": "Hide time filter",
      };
      return map[key] ?? key;
    },
  }),
}));

// Mock child components to keep tests focused
jest.mock("../../../components/search/location-input", () => ({
  LocationInput: ({ label, onChangeText }: any) => {
    const { TextInput, Text } = require("react-native");
    return (
      <>
        <Text>{label}</Text>
        <TextInput testID={`input-${label}`} onChangeText={onChangeText} />
      </>
    );
  },
}));

jest.mock("../../../components/search/date-picker", () => ({
  DatePicker: ({ onChange }: any) => {
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity
        testID="date-picker"
        onPress={() => onChange("2026-04-06")}
      >
        <Text>Select date</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock("../../../components/search/time-range-picker", () => ({
  TimeRangePicker: ({ onChange }: any) => {
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity
        testID="time-range-picker"
        onPress={() => onChange("06:00", "12:00")}
      >
        <Text>Time picker</Text>
      </TouchableOpacity>
    );
  },
}));

describe("SearchCard", () => {
  it('"Add time filter" chip toggles TimeRangePicker visibility', () => {
    render(<SearchCard onSearch={jest.fn()} />);

    expect(screen.queryByTestId("time-range-picker")).toBeNull();

    fireEvent.press(screen.getByText("Add time filter"));
    expect(screen.getByTestId("time-range-picker")).toBeTruthy();

    fireEvent.press(screen.getByText("Hide time filter"));
    expect(screen.queryByTestId("time-range-picker")).toBeNull();
  });

  it("onSearch receives timeFrom and timeTo when time picker is used", () => {
    const onSearch = jest.fn();
    render(<SearchCard onSearch={onSearch} />);

    // Fill required fields
    fireEvent.changeText(screen.getByTestId("input-From"), "Kigali");
    fireEvent.changeText(screen.getByTestId("input-To"), "Musanze");
    fireEvent.press(screen.getByTestId("date-picker"));

    // Open time picker and set times
    fireEvent.press(screen.getByText("Add time filter"));
    fireEvent.press(screen.getByTestId("time-range-picker"));

    fireEvent.press(screen.getByText("Search Buses"));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ timeFrom: "06:00", timeTo: "12:00" }),
    );
  });

  it("onSearch receives undefined time values when picker is hidden", () => {
    const onSearch = jest.fn();
    render(<SearchCard onSearch={onSearch} />);

    fireEvent.changeText(screen.getByTestId("input-From"), "Kigali");
    fireEvent.changeText(screen.getByTestId("input-To"), "Musanze");
    fireEvent.press(screen.getByTestId("date-picker"));

    fireEvent.press(screen.getByText("Search Buses"));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ timeFrom: undefined, timeTo: undefined }),
    );
  });

  it("existing validation blocks empty from/to/date", () => {
    const onSearch = jest.fn();
    render(<SearchCard onSearch={onSearch} />);

    fireEvent.press(screen.getByText("Search Buses"));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByText("Enter departure")).toBeTruthy();
  });
});
