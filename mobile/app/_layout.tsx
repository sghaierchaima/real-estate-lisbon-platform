import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation:
            "slide_from_right",

          contentStyle: {
            backgroundColor:
              "#F8F9FA",
          },
        }}
      >
        <Stack.Screen name="index" />

        <Stack.Screen
          name="login"
        />

        <Stack.Screen
          name="register"
        />

        <Stack.Screen
          name="(tabs)"
          options={{
            animation: "fade",
          }}
        />
      </Stack>
    </>
  );
}