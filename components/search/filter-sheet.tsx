import { resolveLogoUrl } from "@/components/search/trip-card";
import type { Company } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DatePicker } from "./date-picker";
import { LocationInput } from "./location-input";
import { TimeRangePicker } from "./time-range-picker";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "price_asc" | "price_desc" | "time" | "duration" | "rating";

export interface FilterValues {
  sortKey: SortKey;
  companyId: string | null;
  origin: string;
  date: string;
  timeFrom: string;
  timeTo: string;
}

export const defaultFilters: FilterValues = {
  sortKey: "time",
  companyId: null,
  origin: "",
  date: "",
  timeFrom: "",
  timeTo: "",
};

// ─── CompanyChip ──────────────────────────────────────────────────────────────

function CompanyChip({
  company,
  selected,
  onPress,
}: {
  company: Company;
  selected: boolean;
  onPress: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = resolveLogoUrl(company.logoUrl);

  return (
    <TouchableOpacity
      style={[S.filterChip, selected && S.filterChipActive]}
      onPress={onPress}
    >
      {logoUrl && !imgError ? (
        <Image
          source={{ uri: logoUrl }}
          style={S.chipLogo}
          onError={() => setImgError(true)}
        />
      ) : (
        <Text style={{ fontSize: 14 }}>{company.name[0]}</Text>
      )}
      <Text style={[S.filterChipText, selected && S.filterChipTextActive]}>
        {company.shortName}
      </Text>
    </TouchableOpacity>
  );
}

// ─── FilterSheet ──────────────────────────────────────────────────────────────

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  applied: FilterValues;
  companies: Company[];
  t: (key: string) => string;
}

export function FilterSheet({
  visible,
  onClose,
  onApply,
  applied,
  companies,
  t,
}: FilterSheetProps) {
  const [draft, setDraft] = useState<FilterValues>(applied);

  useEffect(() => {
    if (visible) setDraft(applied);
  }, [visible]);

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleReset() {
    setDraft(defaultFilters);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={S.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={S.filterSheet}>
          <View style={S.filterHandle} />

          {/* Header */}
          <View style={S.filterHeader}>
            <Text style={S.filterTitle}>{t("search.filters")}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={S.filterClose}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={18} color="#1A202C" />
            </TouchableOpacity>
          </View>

          {/* Scrollable content */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sort options */}
            <Text style={S.filterSection}>{t("search.sortBy")}</Text>
            <View style={S.filterRows}>
              {[
                {
                  key: "time",
                  label: t("search.sortTime"),
                  icon: "time-outline",
                },
                {
                  key: "price_asc",
                  label: t("search.sortPrice"),
                  icon: "trending-down-outline",
                },
                {
                  key: "price_desc",
                  label: t("search.sortPriceDesc"),
                  icon: "trending-up-outline",
                },
                {
                  key: "duration",
                  label: t("search.sortDuration"),
                  icon: "hourglass-outline",
                },
                {
                  key: "rating",
                  label: t("search.sortRating"),
                  icon: "star-outline",
                },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    S.filterRow,
                    draft.sortKey === opt.key && S.filterRowActive,
                  ]}
                  onPress={() =>
                    setDraft((d) => ({ ...d, sortKey: opt.key as SortKey }))
                  }
                >
                  <View style={S.filterRowIcon}>
                    <Ionicons
                      name={opt.icon as any}
                      size={18}
                      color={draft.sortKey === opt.key ? "#0A4370" : "#6A717D"}
                    />
                  </View>
                  <Text
                    style={[
                      S.filterRowText,
                      draft.sortKey === opt.key && S.filterRowTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {draft.sortKey === opt.key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#0A4370"
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Origin location */}
            <Text style={S.filterSection}>{t("search.origin")}</Text>
            <LocationInput
              label=""
              placeholder={t("home.departurePlaceholder")}
              value={draft.origin}
              onChangeText={(text) => setDraft((d) => ({ ...d, origin: text }))}
              onSelect={(loc) => setDraft((d) => ({ ...d, origin: loc.name }))}
            />

            {/* Date */}
            <Text style={S.filterSection}>{t("home.travelDate")}</Text>
            <DatePicker
              label=""
              placeholder={t("home.selectDate")}
              value={draft.date}
              onChange={(date) => setDraft((d) => ({ ...d, date }))}
            />

            {/* Time range */}
            <Text style={S.filterSection}>{t("search.timeRange")}</Text>
            <TimeRangePicker
              fromTime={draft.timeFrom}
              toTime={draft.timeTo}
              onChange={(from, to) =>
                setDraft((d) => ({ ...d, timeFrom: from, timeTo: to }))
              }
            />

            {/* Company */}
            <Text style={S.filterSection}>{t("search.company")}</Text>
            <View style={S.filterChips}>
              <TouchableOpacity
                style={[
                  S.filterChip,
                  draft.companyId === null && S.filterChipActive,
                ]}
                onPress={() => setDraft((d) => ({ ...d, companyId: null }))}
              >
                <Text
                  style={[
                    S.filterChipText,
                    draft.companyId === null && S.filterChipTextActive,
                  ]}
                >
                  {t("search.allCompanies")}
                </Text>
              </TouchableOpacity>
              {companies.map((c) => (
                <CompanyChip
                  key={c.id}
                  company={c}
                  selected={draft.companyId === c.id}
                  onPress={() => setDraft((d) => ({ ...d, companyId: c.id }))}
                />
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={S.footer}>
            <TouchableOpacity
              style={S.resetBtn}
              onPress={handleReset}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={S.resetBtnText}>{t("search.reset")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={S.applyBtn}
              onPress={handleApply}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={S.applyBtnText}>{t("search.applyFilters")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 67, 112, 0.5)",
    justifyContent: "flex-end",
  },
  filterSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "85%",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  filterHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D1D9E6",
    alignSelf: "center",
    marginBottom: 20,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A202C",
    letterSpacing: -0.5,
  },
  filterClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },
  filterSection: {
    fontSize: 12,
    fontWeight: "900",
    color: "#6A717D",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 24,
  },
  filterRows: { gap: 8 },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F8F9FB",
    borderWidth: 1.5,
    borderColor: "#E8EDF5",
  },
  filterRowActive: {
    backgroundColor: "#EEF4FF",
    borderColor: "#0A4370",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  filterRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#E8EDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  filterRowIconActive: { backgroundColor: "#0A4370" },
  filterRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#6A717D",
    letterSpacing: -0.1,
  },
  filterRowTextActive: { color: "#0A4370", fontWeight: "800" },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#E8EDF5",
    backgroundColor: "#F8F9FB",
  },
  filterChipActive: {
    backgroundColor: "#0A4370",
    borderColor: "#0A4370",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6A717D",
    letterSpacing: 0.1,
  },
  filterChipTextActive: { color: "#fff", fontWeight: "800" },
  chipLogo: { width: 22, height: 22, borderRadius: 6 },
  footer: {
    flexDirection: "row",
    gap: 14,
    marginTop: 24,
  },
  resetBtn: {
    flex: 1,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#0A4370",
    backgroundColor: "#fff",
  },
  resetBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0A4370",
    letterSpacing: 0.2,
  },
  applyBtn: {
    flex: 2,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#0A4370",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  applyBtnText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
});
