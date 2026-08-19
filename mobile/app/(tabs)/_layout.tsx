import { Tabs } from "expo-router";

import {
  Home,
  Building2,
  Search,
  MessageCircle,
  User,
} from "lucide-react-native";

import { Colors } from "@/constants/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          Colors.navy,

        tabBarInactiveTintColor:
          Colors.muted,

        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor:
            Colors.border,
          backgroundColor:
            Colors.white,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Home
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="properties"
        options={{
          title: "Properties",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Building2
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Search
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <MessageCircle
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <User
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}