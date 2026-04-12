import { useLocations } from "@/hooks/use-locations";
import { Location } from "@/lib/api";
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
  onSelect: (location: Location) => void;
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
        <Text style={{ fontSize: 14, color: "#1A202C", fontWeight: "600" }}>
          {text}
        </Text>
      );
    return (
      <Text style={{ fontSize: 14, color: "#1A202C", fontWeight: "600" }}>
        {text.slice(0, idx)}
        <Text style={{ color: "#0A4370", fontWeight: "800" }}>
          {text.slice(idx, idx + query.length)}
        </Text>
        {text.slice(idx + query.length)}
      </Text>
    );
  }

  return (
    <View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: "#6A717D",
          marginBottom: 6,
          letterSpacing: 0.8,
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
          height: 48,
          paddingHorizontal: 14,
          backgroundColor: error ? "#FFF5F5" : focused ? "#EEF4FF" : "#F8F9FB",
          borderWidth: focused ? 1.5 : 1,
          borderColor: focused ? "#0A4370" : error ? "#E53E3E" : "#E2E8F0",
        }}
      >
        <TextInput
          style={{ flex: 1, fontSize: 15, color: "#1A202C" }}
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
        ) : value.length > 0 ? (
          <TouchableOpacity
            onPress={() => onChangeText("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
            gap: 4,
            marginTop: 4,
          }}
        >
          <Ionicons name="alert-circle-outline" size={12} color="#E53E3E" />
          <Text style={{ fontSize: 11, color: "#E53E3E" }}>{error}</Text>
        </View>
      )}

      {showDropdown && results.length > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 76,
            backgroundColor: "#fff",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            zIndex: 999,
            opacity: dropdownAnim,
            transform: [
              {
                translateY: dropdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-8, 0],
                }),
              },
            ],
            shadowColor: "#0A4370",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 12,
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
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  backgroundColor: index % 2 === 0 ? "#fff" : "#FAFBFC",
                }}
              >
                {/* Location icon */}
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: "#EEF4FF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="location" size={16} color="#0A4370" />
                </View>

                {/* Name + city */}
                <View style={{ flex: 1 }}>
                  {highlight(item.name, value)}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 2,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: "#6A717D" }}>
                      {item.city}
                    </Text>
                    {/* Trip count badge */}
                    {(item as any).tripsToday > 0 && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 3,
                          backgroundColor: "#F0FFF4",
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                        }}
                      >
                        <Ionicons
                          name="bus-outline"
                          size={10}
                          color="#38A169"
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            color: "#38A169",
                            fontWeight: "700",
                          }}
                        >
                          {(item as any).tripsToday} trips today
                        </Text>
                      </View>
                    )}
                  </View>
                  {/* Popular destinations */}
                  {(item as any).popularDestinations?.length > 0 && (
                    <Text
                      style={{ fontSize: 10, color: "#A0A8B4", marginTop: 2 }}
                    >
                      → {(item as any).popularDestinations.join(" · ")}
                    </Text>
                  )}
                </View>

                {/* Station code chip */}
                <View
                  style={{
                    backgroundColor: "#EEF4FF",
                    borderRadius: 6,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    marginLeft: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "800",
                      color: "#0A4370",
                      letterSpacing: 0.5,
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
                  marginLeft: 64,
                }}
              />
            )}
          />
        </Animated.View>
      )}
    </View>
  );
}
