import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    Animated,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function AuthInput({
  label,
  error,
  isPassword,
  icon,
  ...props
}: AuthInputProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
    props.onFocus?.({} as never);
  };

  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
    props.onBlur?.({} as never);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? Colors.error : Colors.border, Colors.primary],
  });

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: Colors.darkText,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <Animated.View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: focused ? "#F8FAFF" : Colors.white,
          borderWidth: 1.5,
          borderColor: error ? Colors.error : borderColor,
          borderRadius: 14,
          height: 54,
          paddingHorizontal: 14,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? Colors.primary : Colors.secondaryText}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          style={{
            flex: 1,
            fontSize: 15,
            color: Colors.darkText,
            paddingVertical: 0,
          }}
          placeholderTextColor="#B0B7C3"
          secureTextEntry={isPassword && !visible}
          autoCapitalize="none"
          onFocus={onFocus}
          onBlur={onBlur}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setVisible((v) => !v)} hitSlop={10}>
            <Ionicons
              name={visible ? "eye-outline":"eye-off-outline" }
              size={20}
              color={focused ? Colors.primary : Colors.secondaryText}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error ? (
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}
        >
          <Ionicons
            name="alert-circle-outline"
            size={13}
            color={Colors.error}
          />
          <Text style={{ fontSize: 12, color: Colors.error, marginLeft: 4 }}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
