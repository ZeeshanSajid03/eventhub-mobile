import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { dashboardAPI } from "../../lib/api";
import { colors } from "../../constants/colors";

export default function DashboardBookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const res = await dashboardAPI.getBookings();
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, []);

  function BookingItem({ booking }) {
    return (
      <View style={{
        backgroundColor: colors.white,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ fontWeight: "700", color: colors.gray[900], fontSize: 14 }} numberOfLines={1}>
              {booking.user?.name}
            </Text>
            <Text style={{ color: colors.gray[400], fontSize: 12, marginTop: 2 }}>
              {booking.user?.email}
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: booking.status === "confirmed" ? "#f0fdf4" : "#fef2f2",
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: "700",
              color: booking.status === "confirmed" ? "#16a34a" : colors.error,
              textTransform: "capitalize",
            }}>
              {booking.status}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: colors.gray[600], fontSize: 13 }} numberOfLines={1}>
              {booking.event?.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Ionicons name="ticket-outline" size={12} color={colors.gray[400]} />
              <Text style={{ color: colors.gray[500], fontSize: 12 }}>
                {booking.ticketType} x {booking.quantity}
              </Text>
            </View>
          </View>
          <Text style={{ fontWeight: "700", color: colors.primary, fontSize: 15 }}>
            Rs. {booking.totalPrice?.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      {/* Header */}
      <View style={{
        backgroundColor: colors.white,
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[800]} />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900] }}>All Bookings</Text>
          <Text style={{ color: colors.gray[400], fontSize: 12 }}>{bookings.length} total</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <BookingItem booking={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="ticket-outline" size={56} color={colors.gray[300]} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.gray[700], marginTop: 12 }}>
                No bookings yet
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}