import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

function SkeletonBox({
  width,
  height,
}: {
  width: number | string;
  height: number;
}) {
  return <View style={[styles.box, { width: width as number, height }]} />;
}

function SkeletonCard({ opacity }: { opacity: Animated.Value }) {
  return (
    <Animated.View style={[styles.card, { opacity }]}>
      {/* Header row: logo placeholder + name placeholder */}
      <View style={styles.row}>
        <SkeletonBox width={42} height={42} />
        <View style={styles.spacer} />
        <SkeletonBox width={140} height={18} />
      </View>

      {/* Route row: origin + arrow placeholder + destination */}
      <View style={[styles.row, styles.routeRow]}>
        <SkeletonBox width={90} height={16} />
        <View style={styles.arrowPlaceholder} />
        <SkeletonBox width={90} height={16} />
      </View>

      {/* Footer row: price placeholder + button placeholder */}
      <View style={[styles.row, styles.footerRow]}>
        <SkeletonBox width={80} height={22} />
        <SkeletonBox width={100} height={36} />
      </View>
    </Animated.View>
  );
}

export function TripCardSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View>
      <SkeletonCard opacity={opacity} />
      <SkeletonCard opacity={opacity} />
      <SkeletonCard opacity={opacity} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 14,
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "#E8EDF5",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeRow: {
    marginTop: 16,
    justifyContent: "space-between",
  },
  footerRow: {
    marginTop: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  spacer: {
    width: 14,
  },
  box: {
    backgroundColor: "#E8EDF5",
    borderRadius: 8,
  },
  arrowPlaceholder: {
    width: 28,
    height: 16,
    backgroundColor: "#E8EDF5",
    borderRadius: 6,
  },
});
