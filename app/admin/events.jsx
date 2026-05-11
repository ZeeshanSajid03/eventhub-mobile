import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { adminAPI } from "../../lib/api";
import { colors } from "../../constants/colors";
import { toast } from "../../lib/toast";

const FILTERS = ["all", "pending", "published", "rejected", "cancelled"];

const statusColors = {
  published: { color: "#16a34a", bg: "#f0fdf4" },
  pending: { color: "#d97706", bg: "#fffbeb" },
  rejected: { color: colors.error, bg: "#fef2f2" },
  cancelled: { color: colors.error, bg: "#fef2f2" },
  completed: { color: colors.primary, bg: colors.primaryLight },
  draft: { color: colors.gray[500], bg: colors.gray[100] },
};

export default function AdminEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
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
    await fetchEvents();
    setRefreshing(false);
  }, []);

  async function handleFeatureToggle(id, isFeatured) {
    setTogglingId(id);
    try {
      const res = await adminAPI.featureEvent(id);
      setEvents((prev) =>
        prev.map((e) => e._id === id ? { ...e, isFeatured: res.data.isFeatured } : e)
      );
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  const filtered = filter === "all" ? events : events.filter((e) => e.status === filter);

  function EventItem({ event }) {
    const sc = statusColors[event.status] || statusColors.draft;

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
              {event.title}
            </Text>
            <Text style={{ color: colors.gray[400], fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>
              {event.category}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: sc.bg }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: sc.color, textTransform: "capitalize" }}>
              {event.status}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="person-outline" size={12} color={colors.gray[400]} />
            <Text style={{ color: colors.gray[500], fontSize: 12 }}>{event.organizer?.name}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="calendar-outline" size={12} color={colors.gray[400]} />
            <Text style={{ color: colors.gray[500], fontSize: 12 }}>
              {new Date(event.date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => router.push(`/event-detail/${event._id}`)}
            style={{
              flex: 1,
              backgroundColor: colors.primaryLight,
              borderRadius: 10,
              padding: 10,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Ionicons name="eye-outline" size={14} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>View</Text>
          </TouchableOpacity>

          {event.status === "published" && (
            <TouchableOpacity
              onPress={() => handleFeatureToggle(event._id, event.isFeatured)}
              disabled={togglingId === event._id}
              style={{
                flex: 1,
                backgroundColor: event.isFeatured ? "#fffbeb" : colors.gray[50],
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 4,
                borderWidth: 1,
                borderColor: event.isFeatured ? "#fde68a" : colors.gray[200],
              }}
            >
              {togglingId === event._id ? (
                <ActivityIndicator size="small" color="#d97706" />
              ) : (
                <>
                  <Ionicons
                    name={event.isFeatured ? "star" : "star-outline"}
                    size={14}
                    color={event.isFeatured ? "#d97706" : colors.gray[400]}
                  />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: event.isFeatured ? "#d97706" : colors.gray[500],
                  }}>
                    {event.isFeatured ? "Featured" : "Feature"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
        paddingBottom: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[100],
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[800]} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900] }}>All Events</Text>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: filter === f ? "#dc2626" : colors.gray[100],
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: "600",
                  textTransform: "capitalize",
                  color: filter === f ? colors.white : colors.gray[600],
                }}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.error} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <EventItem event={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#dc2626"]} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="calendar-outline" size={56} color={colors.gray[300]} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.gray[700], marginTop: 12 }}>
                No events found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}