import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isOrganizer, isAdmin } = useAuth();
  const router = useRouter();

  // Determine what the middle tab should show
  const middleTabLabel = isAdmin ? "Admin" : isOrganizer ? "Dashboard" : "Bookings";
  const middleTabIcon = isAdmin ? "shield-outline" : isOrganizer ? "grid-outline" : "ticket-outline";
  const middleTabRoute = isAdmin ? "/admin" : isOrganizer ? "/dashboard" : null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[100],
          borderTopWidth: 1,
          paddingBottom: insets.bottom || 8,
          paddingTop: 8,
          height: 60 + (insets.bottom || 0),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: middleTabLabel,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={middleTabIcon} size={size} color={color} />
          ),
          tabBarButton: middleTabRoute
            ? (props) => (
                <TouchableOpacity
                  {...props}
                  onPress={() => router.push(middleTabRoute)}
                />
              )
            : undefined,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}