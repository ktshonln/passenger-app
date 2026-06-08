import { useLocations } from "@/hooks/use-locations";
import { LocationSuggestion } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (location: LocationSuggestion) => void;
  error?: string;
}

export function LocationInput({
  label,
  placeholder,
  value,
  onChangeText,
  onSelect,
  error,
}: Props) {
  const [focused, setFocused] = useState(false);
  const { results, loading } = useLocations(value);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const showDropdown = focused && value.length >= 2;

  React.useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: showDropdown && results.length > 0 ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDropdown, results.length]);

  function highlight(text: string, query: string) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1)
      return (
        <Text
          style={{
            fontSize: 15,
            color: "#1A202C",
            fontWeight: "700",
            letterSpacing: -0.2,
          }}
        >
          {text}
        </Text>
      );
    return (
      <Text
        style={{
          fontSize: 15,
          color: "#1A202C",
          fontWeight: "700",
          letterSpacing: -0.2,
        }}
      >
        {text.slice(0, idx)}
        <Text style={{ color: "#0A4370", fontWeight: "900" }}>
          {text.slice(idx, idx + query.length)}
        </Text>
        {text.slice(idx + query.length)}
      </Text>
    );
  }

  return (
    <View style={{ zIndex: 99999, position: "relative" }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "800",
          color: "#6A717D",
          marginBottom: 6,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 12,
          height: 44,
          paddingHorizontal: 14,
          backgroundColor: error ? "#FFF5F5" : focused ? "#EEF4FF" : "#F8F9FB",
          borderWidth: focused ? 2 : 1.5,
          borderColor: focused ? "#0A4370" : error ? "#E53E3E" : "#E8EDF5",
          shadowColor: focused ? "#0A4370" : "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: focused ? 0.08 : 0.01,
          shadowRadius: 3,
          elevation: focused ? 1 : 0,
        }}
      >
        <TextInput
          style={{ flex: 1, fontSize: 14, color: "#1A202C", fontWeight: "500" }}
          placeholder={placeholder}
          placeholderTextColor="#A0A8B4"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {loading ? (
          <ActivityIndicator size="small" color="#0A4370" />
        ) : (value?.length ?? 0) > 0 ? (
          <TouchableOpacity
            onPress={() => onChangeText("")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={17} color="#A0A8B4" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="location-outline" size={17} color="#A0A8B4" />
        )}
      </View>

      {!!error && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginTop: 6,
          }}
        >
          <Ionicons name="alert-circle-outline" size={13} color="#E53E3E" />
          <Text style={{ fontSize: 12, color: "#E53E3E", fontWeight: "600" }}>
            {error}
          </Text>
        </View>
      )}

      {showDropdown && results.length > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 84,
            backgroundColor: "#fff",
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: "#E8EDF5",
            zIndex: 99999,
            opacity: dropdownAnim,
            transform: [
              {
                translateY: dropdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
            shadowColor: "#0A4370",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 15,
            overflow: "hidden",
          }}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={results.length > 4}
            style={{ maxHeight: 280 }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  setFocused(false);
                }}
                activeOpacity={0.6}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  backgroundColor: index % 2 === 0 ? "#fff" : "#FAFBFC",
                }}
              >
                {/* Location icon */}
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: "#EEF4FF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                    borderWidth: 1,
                    borderColor: "#D6E4FF",
                  }}
                >
                  <Ionicons name="location" size={18} color="#0A4370" />
                </View>

                {/* Name + city */}
                <View style={{ flex: 1 }}>
                  {highlight(item.name, value)}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 7,
                      marginTop: 3,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#6A717D",
                        fontWeight: "500",
                      }}
                    >
                      {item.city}
                    </Text>
                    {/* Trip count badge */}
                    {item.tripsToday > 0 && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "#F0FFF4",
                          borderRadius: 8,
                          paddingHorizontal: 7,
                          paddingVertical: 3,
                          borderWidth: 1,
                          borderColor: "#C6F6D5",
                        }}
                      >
                        <Ionicons
                          name="bus-outline"
                          size={11}
                          color="#38A169"
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            color: "#38A169",
                            fontWeight: "800",
                            letterSpacing: 0.2,
                          }}
                        >
                          {item.tripsToday} trips today
                        </Text>
                      </View>
                    )}
                  </View>
                  {/* Popular destinations */}
                  {item.popularDestinations?.length > 0 && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#A0A8B4",
                        marginTop: 3,
                        fontWeight: "500",
                      }}
                    >
                      → {item.popularDestinations.join(" · ")}
                    </Text>
                  )}
                </View>

                {/* Station code chip */}
                <View
                  style={{
                    backgroundColor: "#EEF4FF",
                    borderRadius: 8,
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    marginLeft: 10,
                    borderWidth: 1,
                    borderColor: "#D6E4FF",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "900",
                      color: "#0A4370",
                      letterSpacing: 0.8,
                    }}
                  >
                    {item.code}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: "#F0F2F5",
                  marginLeft: 70,
                }}
              />
            )}
          />
        </Animated.View>
      )}
    </View>
  );
}
