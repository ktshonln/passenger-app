import { Company } from "@/src/services/mock.data";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  companies: Company[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

function CompanyChip({
  company,
  selected,
  onSelect,
}: {
  company: Company;
  selected: boolean;
  onSelect: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 80,
      bounciness: 0,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();

  return (
    <TouchableOpacity
      onPress={onSelect}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.chip,
          selected && {
            backgroundColor: company.color,
            borderColor: company.color,
          },
          { transform: [{ scale }] },
        ]}
      >
        <Text style={styles.chipLogo}>{company.logo}</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.chipName, selected && { color: "#fff" }]}
            numberOfLines={1}
          >
            {company.shortName}
          </Text>
          <View style={styles.chipMeta}>
            <Ionicons
              name="star"
              size={9}
              color={selected ? "rgba(255,255,255,0.8)" : "#F6AD55"}
            />
            <Text
              style={[
                styles.chipRating,
                selected && { color: "rgba(255,255,255,0.85)" },
              ]}
            >
              {company.rating}
            </Text>
          </View>
        </View>
        {selected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={10} color={company.color} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export function CompanySelector({ companies, selected, onSelect }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Bus Company</Text>
        {selected && (
          <TouchableOpacity onPress={() => onSelect(null)}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* "Any" chip */}
        <TouchableOpacity
          onPress={() => onSelect(null)}
          style={[styles.anyChip, !selected && styles.anyChipActive]}
        >
          <Text
            style={[styles.anyChipText, !selected && styles.anyChipTextActive]}
          >
            Any
          </Text>
        </TouchableOpacity>

        {companies.map((c) => (
          <CompanyChip
            key={c.id}
            company={c}
            selected={selected === c.id}
            onSelect={() => onSelect(selected === c.id ? null : c.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A202C",
    letterSpacing: 0.1,
  },

  clearBtn: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0A4370",
  },

  scroll: {
    gap: 8,
    paddingRight: 4,
  },

  anyChip: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8F9FB",
    alignItems: "center",
    justifyContent: "center",
  },

  anyChipActive: {
    backgroundColor: "#0A4370",
    borderColor: "#0A4370",
  },

  anyChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6A717D",
  },

  anyChipTextActive: {
    color: "#fff",
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 52,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8F9FB",
    minWidth: 100,
  },

  chipLogo: {
    fontSize: 20,
  },

  chipName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A202C",
    maxWidth: 72,
  },

  chipMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },

  chipRating: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6A717D",
  },

  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
