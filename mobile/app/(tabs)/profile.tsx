import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/colors";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Profile
      </Text>

      <Text style={styles.subtitle}>
        Manage your account and personal
        information.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.navyDark,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 25,
    color: Colors.textSecondary,
  },
});