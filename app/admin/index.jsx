import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { adminAPI } from "../../lib/api";
import { colors } from "../../constants/colors";

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await adminAPI.getEvents();
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const pending = events.filter((e) => e.status === "pending").length;
  const published = events.filter((e) => e.status === "published").length;
  const rejected = events.filter((e) => e.status === "rejected").length;
  const total = events.length;

  const statCards = [
    { label: "Total Events", value: total, icon: "calendar-outline", color: colors.primary, bg: colors.primaryLight },
    { label: "Pending Review", value: pending, icon: "time-outline", color: "#d97706", bg: "#fffbeb" },
    { label: "Published", value: published, icon: "checkmark-circle-outline", color: "#16a34a", bg: "#f0fdf4" },
    { label: "Rejected", value: rejected, icon: "close-circle-outline", color: colors.error, bg: "#fef2f2" },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.error} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.gray[50] }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#dc2626"]} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{
        backgroundColor: "#dc2626",
        paddingTop: 56,
        paddingBottom: 24,
        paddingHorizontal: 20,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>EventHub</Text>
            <Text style={{ color: colors.white, fontSize: 22, fontWeight: "700" }}>Admin Panel</Text>
          </View>
          <View style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}>
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: "700" }}>ADMIN</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        {/* Pending alert */}
        {pending > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/admin/pending")}
            style={{
              backgroundColor: "#fffbeb",
              borderWidth: 1,
              borderColor: "#fde68a",
              borderRadius: 14,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Ionicons name="alert-circle-outline" size={22} color="#d97706" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#92400e", fontWeight: "700", fontSize: 14 }}>
                {pending} event{pending !== 1 ? "s" : ""} need review
              </Text>
              <Text style={{ color: "#a16207", fontSize: 12, marginTop: 2 }}>
                Tap to review pending events
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#d97706" />
          </TouchableOpacity>
        )}

        {/* Stat cards */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          {statCards.map((stat) => (
            <View
              key={stat.label}
              style={{
                width: "47%",
                backgroundColor: colors.white,
                borderRadius: 16,
                padding: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: stat.bg,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 10,
              }}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.gray[900] }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: 12, color: colors.gray[500], marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[900], marginBottom: 14 }}>
            Quick Actions
          </Text>
          {[
            { label: "Review Pending Events", icon: "time-outline", route: "/admin/pending", color: "#d97706", bg: "#fffbeb" },
            { label: "All Events", icon: "calendar-outline", route: "/admin/events", color: colors.primary, bg: colors.primaryLight },
            { label: "Broadcast Email", icon: "mail-outline", route: "/admin/broadcast", color: "#7c3aed", bg: "#f5f3ff" },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.gray[50],
                gap: 14,
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: item.bg,
                justifyContent: "center",
                alignItems: "center",
              }}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: "500", color: colors.gray[800] }}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray[300]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}