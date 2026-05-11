import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { eventsAPI } from "../../lib/api";
import { colors } from "../../constants/colors";
import { toast } from "../../lib/toast";

export default function DashboardEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await eventsAPI.getMine();
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

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await eventsAPI.delete(id);
      setEvents(events.filter((e) => e._id !== id));
      setDeleteModal(null);
      toast.success("Event deleted successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await eventsAPI.update(id, { status });
      setEvents(events.map((e) => e._id === id ? { ...e, status } : e));
      toast.success(`Event ${status}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  const statusColors = {
    published: "#16a34a",
    pending: "#d97706",
    rejected: colors.error,
    cancelled: colors.error,
    draft: colors.gray[400],
    completed: colors.primary,
  };

  function EventItem({ event }) {
    const booked = event.ticketTypes.reduce((s, t) => s + t.bookedSeats, 0);
    const total = event.ticketTypes.reduce((s, t) => s + t.totalSeats, 0);

    return (
      <View style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ fontWeight: "700", color: colors.gray[900], fontSize: 15 }} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={{ color: colors.gray[400], fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>
              {event.category} • {new Date(event.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
            backgroundColor: `${statusColors[event.status]}15`,
          }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: statusColors[event.status], textTransform: "capitalize" }}>
              {event.status}
            </Text>
          </View>
        </View>

        {/* Rejection reason */}
        {event.status === "rejected" && event.rejectionReason && (
          <View style={{
            backgroundColor: "#fef2f2",
            borderRadius: 8,
            padding: 10,
            marginBottom: 10,
          }}>
            <Text style={{ color: colors.error, fontSize: 12 }}>
              Reason: {event.rejectionReason}
            </Text>
          </View>
        )}

        {/* Seats bar */}
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: colors.gray[500] }}>Bookings</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray[700] }}>{booked}/{total}</Text>
          </View>
          <View style={{ height: 6, backgroundColor: colors.gray[100], borderRadius: 3, overflow: "hidden" }}>
            <View style={{
              height: "100%",
              width: `${total > 0 ? (booked / total) * 100 : 0}%`,
              backgroundColor: colors.primary,
              borderRadius: 3,
            }} />
          </View>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => router.push(`/dashboard/edit-event/${event._id}`)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              backgroundColor: colors.primaryLight,
              borderRadius: 10,
              padding: 10,
            }}
          >
            <Ionicons name="create-outline" size={15} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>Edit</Text>
          </TouchableOpacity>

          {event.status === "published" && (
            <TouchableOpacity
              onPress={() => handleStatusChange(event._id, "cancelled")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                backgroundColor: "#fff7ed",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <Ionicons name="close-circle-outline" size={15} color="#ea580c" />
              <Text style={{ color: "#ea580c", fontSize: 13, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setDeleteModal(event._id)}
            style={{
              width: 40,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fef2f2",
              borderRadius: 10,
              padding: 10,
            }}
          >
            <Ionicons name="trash-outline" size={15} color={colors.error} />
          </TouchableOpacity>
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
        justifyContent: "space-between",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[800]} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900] }}>My Events</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/dashboard/create-event")}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Ionicons name="add" size={16} color={colors.white} />
          <Text style={{ color: colors.white, fontWeight: "600", fontSize: 13 }}>Create</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <EventItem event={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="calendar-outline" size={56} color={colors.gray[300]} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.gray[700], marginTop: 12 }}>
                No events yet
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/dashboard/create-event")}
                style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 }}
              >
                <Text style={{ color: colors.white, fontWeight: "700" }}>Create Event</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Delete modal */}
      <Modal
        visible={!!deleteModal}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: colors.white, borderRadius: 24, padding: 24 }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: "#fef2f2",
              justifyContent: "center", alignItems: "center", marginBottom: 16,
            }}>
              <Ionicons name="trash-outline" size={28} color={colors.error} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900], marginBottom: 8 }}>
              Delete Event
            </Text>
            <Text style={{ color: colors.gray[500], fontSize: 14, marginBottom: 24, lineHeight: 22 }}>
              Are you sure? This action cannot be undone.
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setDeleteModal(null)}
                style={{ flex: 1, borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: 14, padding: 14, alignItems: "center" }}
              >
                <Text style={{ color: colors.gray[700], fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(deleteModal)}
                disabled={deleting}
                style={{ flex: 1, backgroundColor: deleting ? colors.gray[300] : colors.error, borderRadius: 14, padding: 14, alignItems: "center" }}
              >
                {deleting ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={{ color: colors.white, fontWeight: "700" }}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}