import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { adminAPI } from "../../lib/api";
import { colors } from "../../constants/colors";
import { toast } from "../../lib/toast";

export default function PendingEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [action, setAction] = useState("approve");
  const [reason, setReason] = useState("");
  const [featured, setFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    try {
      const res = await adminAPI.getEvents({ status: "pending" });
      setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPending();
    setRefreshing(false);
  }, []);

  async function handleReview() {
    if (action === "reject" && !reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setSubmitting(true);
    try {
      await adminAPI.reviewEvent(reviewModal._id, { action, reason, featured });
      setEvents((prev) => prev.filter((e) => e._id !== reviewModal._id));
      setReviewModal(null);
      setReason("");
      setAction("approve");
      setFeatured(false);
      toast.success(
        action === "approve" ? "Event approved and published!" : "Event rejected"
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function EventItem({ event }) {
    const booked = event.ticketTypes?.reduce((s, t) => s + t.bookedSeats, 0) || 0;
    const total = event.ticketTypes?.reduce((s, t) => s + t.totalSeats, 0) || 0;

    return (
      <View style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
        overflow: "hidden",
      }}>
        {/* Image */}
        {event.image ? (
          <Image
            source={{ uri: event.image }}
            style={{ width: "100%", height: 140 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            width: "100%",
            height: 100,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Ionicons name="calendar-outline" size={40} color="rgba(255,255,255,0.3)" />
          </View>
        )}

        <View style={{ padding: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.gray[900], marginBottom: 4 }}>
            {event.title}
          </Text>
          <Text style={{ color: colors.gray[500], fontSize: 13, marginBottom: 10 }} numberOfLines={2}>
            {event.description}
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="calendar-outline" size={13} color={colors.gray[400]} />
              <Text style={{ color: colors.gray[500], fontSize: 12 }}>
                {new Date(event.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="location-outline" size={13} color={colors.gray[400]} />
              <Text style={{ color: colors.gray[500], fontSize: 12 }}>
                {event.venue?.city}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="person-outline" size={13} color={colors.gray[400]} />
              <Text style={{ color: colors.gray[500], fontSize: 12 }}>
                {event.organizer?.name}
              </Text>
            </View>
            <View style={{
              backgroundColor: colors.primaryLight,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
            }}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>
                {event.category}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                setReviewModal(event);
                setAction("approve");
                setReason("");
                setFeatured(false);
              }}
              style={{
                flex: 1,
                backgroundColor: "#f0fdf4",
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#16a34a" />
              <Text style={{ color: "#16a34a", fontWeight: "700", fontSize: 13 }}>Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/event-detail/${event._id}`)}
              style={{
                flex: 1,
                backgroundColor: colors.primaryLight,
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="eye-outline" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>Preview</Text>
            </TouchableOpacity>
          </View>
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
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900] }}>Pending Events</Text>
          <Text style={{ color: colors.gray[400], fontSize: 12 }}>
            {events.length} waiting for review
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.error} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <EventItem event={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#dc2626"]} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#16a34a" />
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[700], marginTop: 16 }}>
                All caught up!
              </Text>
              <Text style={{ color: colors.gray[400], fontSize: 14, marginTop: 6 }}>
                No events pending review
              </Text>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      <Modal
        visible={!!reviewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setReviewModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: insets.bottom + 20,
          }}>
            {/* Handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.gray[200], borderRadius: 2 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.gray[900], marginBottom: 4 }}>
                Review Event
              </Text>
              <Text style={{ color: colors.gray[500], fontSize: 14, marginBottom: 20 }} numberOfLines={1}>
                {reviewModal?.title}
              </Text>

              {/* Action selector */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                <TouchableOpacity
                  onPress={() => setAction("approve")}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: action === "approve" ? "#16a34a" : colors.gray[200],
                    backgroundColor: action === "approve" ? "#f0fdf4" : colors.white,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={action === "approve" ? "#16a34a" : colors.gray[400]}
                  />
                  <Text style={{
                    fontWeight: "700",
                    color: action === "approve" ? "#16a34a" : colors.gray[500],
                  }}>
                    Approve
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAction("reject")}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: action === "reject" ? colors.error : colors.gray[200],
                    backgroundColor: action === "reject" ? "#fef2f2" : colors.white,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color={action === "reject" ? colors.error : colors.gray[400]}
                  />
                  <Text style={{
                    fontWeight: "700",
                    color: action === "reject" ? colors.error : colors.gray[500],
                  }}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Featured toggle for approve */}
              {action === "approve" && (
                <TouchableOpacity
                  onPress={() => setFeatured(!featured)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: featured ? "#fffbeb" : colors.gray[50],
                    borderWidth: 1.5,
                    borderColor: featured ? "#fde68a" : colors.gray[200],
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 20,
                  }}
                >
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: featured ? "#d97706" : colors.gray[300],
                    backgroundColor: featured ? "#d97706" : colors.white,
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    {featured && (
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: colors.gray[800], fontSize: 14 }}>
                      Mark as Featured
                    </Text>
                    <Text style={{ color: colors.gray[500], fontSize: 12, marginTop: 2 }}>
                      Event will appear in featured section
                    </Text>
                  </View>
                  <Ionicons name="star" size={18} color={featured ? "#d97706" : colors.gray[300]} />
                </TouchableOpacity>
              )}

              {/* Rejection reason */}
              {action === "reject" && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray[700], marginBottom: 8 }}>
                    Rejection Reason *
                  </Text>
                  <TextInput
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Tell the organizer why their event was rejected..."
                    placeholderTextColor={colors.gray[400]}
                    multiline
                    numberOfLines={4}
                    style={{
                      borderWidth: 1.5,
                      borderColor: colors.gray[200],
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 14,
                      color: colors.gray[900],
                      backgroundColor: colors.gray[50],
                      minHeight: 100,
                      textAlignVertical: "top",
                    }}
                  />
                </View>
              )}

              {/* Info box */}
              {action === "approve" && (
                <View style={{
                  backgroundColor: "#f0fdf4",
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: "row",
                  gap: 8,
                  marginBottom: 20,
                }}>
                  <Ionicons name="information-circle-outline" size={16} color="#16a34a" />
                  <Text style={{ color: "#15803d", fontSize: 13, flex: 1 }}>
                    Event will be published and visible to all users immediately.
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setReviewModal(null)}
                  style={{
                    flex: 1,
                    borderWidth: 1.5,
                    borderColor: colors.gray[200],
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.gray[700], fontWeight: "700" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleReview}
                  disabled={submitting}
                  style={{
                    flex: 2,
                    backgroundColor: submitting
                      ? colors.gray[300]
                      : action === "approve"
                      ? "#16a34a"
                      : colors.error,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={{ color: colors.white, fontWeight: "700" }}>
                      {action === "approve" ? "Approve Event" : "Reject Event"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}