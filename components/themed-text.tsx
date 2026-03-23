import { useThemeColor } from "@/hooks/use-theme-color";
import { Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

const typeClass: Record<NonNullable<ThemedTextProps["type"]>, string> = {
  default: "text-base leading-6",
  defaultSemiBold: "text-base leading-6 font-semibold",
  title: "text-[32px] font-bold leading-8",
  subtitle: "text-xl font-bold",
  link: "text-base leading-[30px] text-[#0a7ea4]",
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  className,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  return (
    <Text
      className={`${typeClass[type]} ${className ?? ""}`}
      style={[{ color }, style]}
      {...rest}
    />
  );
}
