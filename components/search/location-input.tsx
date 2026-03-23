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
      duration: 200,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDropdown, results.length]);

  function highlightMatch(text: string, query: string) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1)
      return <Text className="text-[14px] text-dark-text">{text}</Text>;
    return (
      <Text className="text-[14px] text-dark-text">
        {text.slice(0, idx)}
        <Text className="text-primary font-bold">
          {text.slice(idx, idx + query.length)}
        </Text>
        {text.slice(idx + query.length)}
      </Text>
    );
  }

  function handleSelect(loc: Location) {
    onSelect(loc);
    setFocused(false);
  }

  return (
    <View>
      <Text className="text-[11px] font-semibold text-secondary-text mb-1.5 tracking-wider uppercase">
        {label}
      </Text>
      <View
        className={`flex-row items-center rounded-xl px-3.5 h-[48px] ${
          focused
            ? "bg-primary/5 border-[1.5px] border-primary"
            : error
              ? "bg-red-50 border-[1.5px] border-danger"
              : "bg-[#F8F9FB] border border-border"
        }`}
      >
        <TextInput
          className="flex-1 text-[15px] text-dark-text"
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
            onPress={() => {
              onChangeText("");
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={17} color="#A0A8B4" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="location-outline" size={17} color="#A0A8B4" />
        )}
      </View>
      {!!error && (
        <View className="flex-row items-center gap-1 mt-1">
          <Ionicons name="alert-circle-outline" size={12} color="#E53E3E" />
          <Text className="text-[11px] text-danger">{error}</Text>
        </View>
      )}

      {showDropdown && results.length > 0 && (
        <Animated.View
          className="absolute left-0 right-0 bg-white rounded-2xl border border-border z-[999]"
          style={{
            top: 72,
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
          }}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={results.length > 4}
            style={{ maxHeight: 220 }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                className={`flex-row items-center px-4 py-3 ${index === 0 ? "rounded-t-2xl" : ""}`}
                onPress={() => handleSelect(item)}
                activeOpacity={0.6}
              >
                <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <Ionicons name="location-outline" size={15} color="#0A4370" />
                </View>
                <View className="flex-1">
                  {highlightMatch(item.name, value)}
                  <Text className="text-[11px] text-secondary-text mt-0.5">
                    {item.city}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#C8CDD6" />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View className="h-px bg-border ml-[60px]" />
            )}
          />
        </Animated.View>
      )}
    </View>
  );
}
