/**
 * Payment Method Selector Component
 * Shows wallet for authenticated users, MoMo for guests
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type PaymentMethod = "wallet" | "mtn" | "airtel" | "cash";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  isAuthenticated: boolean;
  walletBalance?: number;
  currency?: string;
  isDispatcher?: boolean; // Added for dispatcher check
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  isAuthenticated,
  walletBalance,
  currency = "RWF",
  isDispatcher = false, // Default to false
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation();

  const methods = isAuthenticated
    ? [
        {
          id: "wallet" as PaymentMethod,
          name: t("payment.wallet", "Wallet"),
          icon: "wallet" as const,
        },
        ...(isDispatcher 
          ? [{
              id: "cash" as PaymentMethod,
              name: t("payment.cash", "Cash"),
              icon: "cash" as const,
            }]
          : []
        )
      ]
    : [
        {
          id: "mtn" as PaymentMethod,
          name: "MTN MoMo",
          icon: "phone-portrait" as const,
        },
        {
          id: "airtel" as PaymentMethod,
          name: "Airtel Money",
          icon: "phone-portrait" as const,
        },
      ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {t("payment.paymentMethod", "Payment Method")}
      </Text>

      {isAuthenticated && walletBalance !== undefined && (
        <View style={styles.balanceCard}>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet" size={20} color="#38A169" />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>
              {t("payment.walletBalance", "Wallet Balance")}
            </Text>
            <Text style={styles.balanceAmount}>
              {currency} {walletBalance.toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.methods}>
        {methods.map((method) => {
          const isSelected = selected === method.id;

          return (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                isSelected && styles.methodCardSelected,
              ]}
              onPress={() => onSelect(method.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.methodIcon,
                  isSelected && styles.methodIconSelected,
                ]}
              >
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={isSelected ? "#fff" : "#0A4370"}
                />
              </View>
              <Text
                style={[
                  styles.methodName,
                  isSelected && styles.methodNameSelected,
                ]}
              >
                {method.name}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={20} color="#38A169" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 12,
  },
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF4",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#C6F6D5",
  },
  balanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22543D",
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#22543D",
  },
  methods: {
    gap: 10,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E8EDF5",
  },
  methodCardSelected: {
    borderColor: "#0A4370",
    backgroundColor: "#EEF4FF",
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  methodIconSelected: {
    backgroundColor: "#0A4370",
  },
  methodName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1A202C",
  },
  methodNameSelected: {
    color: "#0A4370",
  },
  checkmark: {
    marginLeft: 8,
  },
});
