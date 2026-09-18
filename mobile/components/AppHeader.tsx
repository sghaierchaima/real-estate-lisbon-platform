import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Menu,
} from "lucide-react-native";

import {
  Colors,
} from "@/constants/colors";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
};

export default function AppHeader({
  eyebrow,
  title,
  subtitle,
  onMenuPress,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {eyebrow ? (
          <Text style={styles.eyebrow}>
            {eyebrow}
          </Text>
        ) : null}

        <Text style={styles.title}>
          {title}
        </Text>

        {subtitle ? (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onMenuPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open application menu"
          hitSlop={8}
          onPress={onMenuPress}
          style={({ pressed }) => [
            styles.menuButton,
            pressed &&
              styles.menuButtonPressed,
          ]}
        >
          <Menu
            size={23}
            color={Colors.navy}
            strokeWidth={2.3}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  eyebrow: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  title: {
    marginTop: 7,
    color: Colors.navyDark,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -1,
  },

  subtitle: {
    marginTop: 8,
    maxWidth: 350,
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },

  menuButton: {
    width: 48,
    height: 48,
    marginTop: 2,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  menuButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },
});