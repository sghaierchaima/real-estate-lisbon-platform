import {
  Pressable,
  StyleSheet,
} from "react-native";

import {
  Menu,
} from "lucide-react-native";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  Colors,
} from "@/constants/colors";

type Props = {
  onPress: () => void;
};

export default function FloatingMenuButton({
  onPress,
}: Props) {
  const insets =
    useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,

        {
          top:
            insets.top + 14,
        },

        pressed &&
          styles.pressed,
      ]}
    >
      <Menu
        size={32}
        color={Colors.navy}
        strokeWidth={2.2}
      />
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    button: {
      position: "absolute",

      right: 20,

      width: 58,
      height: 58,

      borderRadius: 19,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,
      borderColor:
        "#E4E7EC",

      zIndex: 9999,

      elevation: 20,

      shadowColor:
        "#000000",

      shadowOpacity: 0.08,

      shadowRadius: 14,

      shadowOffset: {
        width: 0,
        height: 5,
      },
    },

    pressed: {
      opacity: 0.78,

      transform: [
        {
          scale: 0.97,
        },
      ],
    },
  });