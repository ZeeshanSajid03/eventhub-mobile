import { Stack } from "expo-router";
import { colors } from "../../constants/colors";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.gray[50] },
      }}
    />
  );
}