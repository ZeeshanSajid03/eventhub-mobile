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
import { dashboardAPI, eventsAPI } from "../../lib/api";
import { colors } from "../../constants/colors";
import { Image } from "react-native";
import { images } from "../../constants/images"

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [eventsRes, statsRes] = await Promise.all([
        eventsAPI.getMine(),
        dashboardAPI.getStats(),
      ]);
      setEvents(eventsRes.data.events || []);
      setBookings(statsRes.data.bookings || []);
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

  const totalRevenue = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const totalBookings = bookings.length;
  const publishedEvents = events.filter((e) => e.status === "published").length;
  const pendingEvents = events.filter((e) => e.status === "pending").length;
  const bookedSeats = events.reduce(
    (sum, e) => sum + e.ticketTypes.reduce((s, t) => s + t.bookedSeats, 0), 0
  );
  const totalSeats = events.reduce(
    (sum, e) => sum + e.ticketTypes.reduce((s, t) => s + t.totalSeats, 0), 0
  );
  const occupancyRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  const statCards = [
    {
      label: "Total Revenue",
      value: `Rs. ${totalRevenue.toLocaleString()}`,
      icon: "cash-outline",
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    {
      label: "Published",
      value: publishedEvents,
      icon: "checkmark-circle-outline",
      color: colors.primary,
      bg: colors.primaryLight,
    },
    {
      label: "Bookings",
      value: totalBookings,
      icon: "ticket-outline",
      color: "#7c3aed",
      bg: "#f5f3ff",
    },
    {
      label: "Occupancy",
      value: `${occupancyRate}%`,
      icon: "analytics-outline",
      color: "#ea580c",
      bg: "#fff7ed",
    },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.gray[50] }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{
        backgroundColor: colors.primary,
        paddingTop: 56,
        paddingBottom: 24,
        paddingHorizontal: 20,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Organizer</Text>
            <Text style={{ color: colors.white, fontSize: 22, fontWeight: "700" }}>Dashboard</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/dashboard/create-event")}
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: "600", fontSize: 13 }}>New Event</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        {/* Pending notice */}
        {pendingEvents > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/dashboard/events")}
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
            <Ionicons name="time-outline" size={20} color="#d97706" />
            <Text style={{ flex: 1, color: "#92400e", fontSize: 13, fontWeight: "600" }}>
              {pendingEvents} event{pendingEvents !== 1 ? "s" : ""} waiting for admin approval
            </Text>
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
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.gray[900] }}>
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
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { label: "My Events", icon: "calendar-outline", route: "/dashboard/events" },
              { label: "Create", icon: "add-circle-outline", route: "/dashboard/create-event" },
              { label: "Bookings", icon: "ticket-outline", route: "/dashboard/bookings" },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => router.push(item.route)}
                style={{
                  flex: 1,
                  backgroundColor: colors.gray[50],
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Ionicons name={item.icon} size={22} color={colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray[700] }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent events */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[900] }}>
              Recent Events
            </Text>
            <TouchableOpacity onPress={() => router.push("/dashboard/events")}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>View all</Text>
            </TouchableOpacity>
          </View>

          {events.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Ionicons name="calendar-outline" size={40} color={colors.gray[300]} />
              <Text style={{ color: colors.gray[400], fontSize: 14, marginTop: 8 }}>
                No events yet
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/dashboard/create-event")}
                style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 14 }}
              >
                <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>Create Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            events.slice(0, 5).map((event) => {
              const booked = event.ticketTypes.reduce((s, t) => s + t.bookedSeats, 0);
              const total = event.ticketTypes.reduce((s, t) => s + t.totalSeats, 0);
              const statusColors = {
                published: "#16a34a",
                pending: "#d97706",
                rejected: colors.error,
                cancelled: colors.error,
                draft: colors.gray[400],
              };

              return (
                <TouchableOpacity
                  key={event._id}
                  onPress={() => router.push(`/dashboard/edit-event/${event._id}`)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.gray[50],
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: colors.gray[800], fontSize: 14 }} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={{ color: colors.gray[400], fontSize: 12, marginTop: 2 }}>
                      {new Date(event.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      backgroundColor: `${statusColors[event.status]}20`,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: statusColors[event.status], textTransform: "capitalize" }}>
                        {event.status}
                      </Text>
                    </View>
                    <Text style={{ color: colors.gray[500], fontSize: 11 }}>{booked}/{total} booked</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}