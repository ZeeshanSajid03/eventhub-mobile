import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { bookingsAPI } from "../../lib/api";
import { colors } from "../../constants/colors";
import { toast } from "../../lib/toast";
import { useAuth } from "../../context/AuthContext";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

function BookingCard({ booking, onCancel, onViewTicket }) {
  const event = booking.event;
  const isPast = new Date(event?.date) < new Date();
  const isCancelled = booking.status === "cancelled";
  const canCancel = !isCancelled && !isPast && new Date() < new Date(booking.cancellationDeadline);

  const formattedDate = event?.date
    ? new Date(event.date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "";

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
      opacity: isCancelled ? 0.7 : 1,
    }}>
      <View style={{ flexDirection: "row", height: 110 }}>
        {/* Image - fixed width and height */}
        <View style={{
          width: 90,
          height: 110,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
        }}>
          {event?.image ? (
            <Image
              source={{ uri: event.image }}
              style={{ width: 90, height: 110 }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="calendar-outline" size={28} color="rgba(255,255,255,0.4)" />
          )}
          {isCancelled && (
            <View style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Text style={{ color: colors.white, fontSize: 9, fontWeight: "700", letterSpacing: 1 }}>
                CANCELLED
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1, padding: 12, justifyContent: "space-between" }}>
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <Text style={{ fontWeight: "700", color: colors.gray[900], fontSize: 14, flex: 1, marginRight: 8 }} numberOfLines={1}>
                {event?.title}
              </Text>
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                backgroundColor: isCancelled ? "#fef2f2" : isPast ? colors.gray[100] : "#f0fdf4",
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: isCancelled ? colors.error : isPast ? colors.gray[500] : "#16a34a",
                }}>
                  {isCancelled ? "Cancelled" : isPast ? "Past" : "Confirmed"}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <Ionicons name="calendar-outline" size={11} color={colors.gray[400]} />
              <Text style={{ color: colors.gray[500], fontSize: 11 }}>{formattedDate}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="ticket-outline" size={11} color={colors.gray[400]} />
              <Text style={{ color: colors.gray[500], fontSize: 11 }}>
                {booking.ticketType} x {booking.quantity}
              </Text>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 11, marginLeft: 4 }}>
                Rs. {booking.totalPrice?.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {!isCancelled && (
              <TouchableOpacity
                onPress={() => onViewTicket(booking)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: colors.primaryLight,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="qr-code-outline" size={12} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "600" }}>Ticket</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity
                onPress={() => onCancel(booking)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "#fef2f2",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="close-circle-outline" size={12} color={colors.error} />
                <Text style={{ color: colors.error, fontSize: 11, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

async function handlePrintTicket(booking) {
  try {
    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 24px; max-width: 400px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563EB, #6366f1); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 22px;">EventHub Ticket</h1>
          </div>
          <h2 style="color: #111827;">${booking.event?.title}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280;">Date</td><td style="font-weight: 600;">${new Date(booking.event?.date).toLocaleDateString()}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Venue</td><td style="font-weight: 600;">${booking.event?.venue?.name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Ticket</td><td style="font-weight: 600;">${booking.ticketType} x ${booking.quantity}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; border-top: 1px solid #e5e7eb;">Total</td><td style="font-weight: 700; color: #2563EB; border-top: 1px solid #e5e7eb;">Rs. ${booking.totalPrice?.toLocaleString()}</td></tr>
          </table>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; text-align: center;">Booking ID: ${booking._id}</p>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share Ticket" });
  } catch (err) {
    toast.error("Could not generate ticket PDF");
  }
}

export default function BookingsScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [ticketModal, setTicketModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchBookings();
    else setLoading(false);
  }, [isAuthenticated]);

  async function fetchBookings() {
    try {
      const res = await bookingsAPI.getUserBookings();
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

  async function handleCancel() {
    setCancelling(true);
    try {
      await bookingsAPI.cancel(cancelModal._id);
      setBookings((prev) =>
        prev.map((b) => b._id === cancelModal._id ? { ...b, status: "cancelled" } : b)
      );
      setCancelModal(null);
      toast.success("Booking cancelled successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  }

  const filtered = bookings.filter((b) => {
    if (filter === "confirmed") return b.status === "confirmed";
    if (filter === "cancelled") return b.status === "cancelled";
    return true;
  });

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.gray[50], padding: 32 }}>
        <Ionicons name="ticket-outline" size={64} color={colors.gray[300]} />
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.gray[800], marginTop: 16, marginBottom: 8 }}>
          Sign in to view bookings
        </Text>
        <Text style={{ color: colors.gray[500], textAlign: "center", marginBottom: 24 }}>
          Login to see your booked tickets and manage your reservations
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          style={{ backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 }}
        >
          <Text style={{ color: colors.white, fontWeight: "700", fontSize: 15 }}>Login</Text>
        </TouchableOpacity>
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
        <Text style={{ fontSize: 22, fontWeight: "700", color: colors.gray[900], marginBottom: 12 }}>
          My Bookings
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {["all", "confirmed", "cancelled"].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: filter === f ? colors.primary : colors.gray[100],
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: "600",
                textTransform: "capitalize",
                color: filter === f ? colors.white : colors.gray[600],
              }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <BookingCard
                booking={item}
                onViewTicket={setTicketModal}
                onCancel={setCancelModal}
              />
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <Ionicons name="ticket-outline" size={56} color={colors.gray[300]} />
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.gray[700], marginTop: 12 }}>
                  {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
                </Text>
                <Text style={{ color: colors.gray[400], fontSize: 14, marginTop: 6, textAlign: "center" }}>
                  {filter === "all" ? "Browse events and book your first ticket" : "Try a different filter"}
                </Text>
                {filter === "all" && (
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/events")}
                    style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 }}
                  >
                    <Text style={{ color: colors.white, fontWeight: "700" }}>Browse Events</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
      )}

      {/* QR Ticket Modal */}
      <Modal
        visible={!!ticketModal}
        animationType="slide"
        transparent
        onRequestClose={() => setTicketModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: insets.bottom + 20,
          }}>
            {/* Handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.gray[200], borderRadius: 2 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
              {/* Ticket header */}
              <View style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
              }}>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
                  EVENTHUB TICKET
                </Text>
                <Text style={{ color: colors.white, fontSize: 18, fontWeight: "800" }} numberOfLines={2}>
                  {ticketModal?.event?.title}
                </Text>
              </View>

              {/* Ticket details */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "DATE", value: ticketModal?.event?.date ? new Date(ticketModal.event.date).toLocaleDateString() : "" },
                  { label: "TIME", value: ticketModal?.event?.date ? new Date(ticketModal.event.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "" },
                  { label: "VENUE", value: ticketModal?.event?.venue?.name },
                  { label: "TICKET", value: ticketModal?.ticketType },
                  { label: "QTY", value: ticketModal?.quantity?.toString() },
                  { label: "TOTAL", value: `Rs. ${ticketModal?.totalPrice?.toLocaleString()}` },
                ].map((item) => (
                  <View key={item.label} style={{
                    backgroundColor: colors.gray[50],
                    borderRadius: 12,
                    padding: 12,
                    width: "47%",
                  }}>
                    <Text style={{ color: colors.gray[400], fontSize: 10, fontWeight: "700", marginBottom: 4 }}>
                      {item.label}
                    </Text>
                    <Text style={{ color: colors.gray[800], fontSize: 13, fontWeight: "600" }} numberOfLines={1}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Dashed line */}
              <View style={{
                borderTopWidth: 2,
                borderTopColor: colors.gray[200],
                borderStyle: "dashed",
                marginBottom: 20,
              }} />

              {/* QR Code */}
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                {ticketModal?.qrCode ? (
                  <QRCode
                    value={ticketModal.qrCode}
                    size={160}
                    backgroundColor={colors.white}
                    color={colors.gray[900]}
                  />
                ) : null}
                <Text style={{ color: colors.gray[400], fontSize: 12, marginTop: 12, textAlign: "center" }}>
                  Show this QR code at the venue
                </Text>
                <Text style={{ color: colors.gray[300], fontSize: 11, marginTop: 4, fontFamily: "monospace" }} numberOfLines={1}>
                  {ticketModal?.qrCode?.substring(0, 28)}...
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handlePrintTicket(ticketModal)}
                style={{
                  backgroundColor: colors.primaryLight,
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <Ionicons name="share-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "700" }}>Share / Print Ticket</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTicketModal(null)}
                style={{
                  backgroundColor: colors.gray[100],
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.gray[700], fontWeight: "700" }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Cancel confirmation modal */}
      <Modal
        visible={!!cancelModal}
        animationType="fade"
        transparent
        onRequestClose={() => setCancelModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 24,
            padding: 24,
          }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#fef2f2",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}>
              <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900], marginBottom: 8 }}>
              Cancel Booking
            </Text>
            <Text style={{ color: colors.gray[500], fontSize: 14, marginBottom: 24, lineHeight: 22 }}>
              Are you sure you want to cancel this booking? The seats will be released back.
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setCancelModal(null)}
                style={{
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: colors.gray[200],
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.gray[700], fontWeight: "700" }}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={cancelling}
                style={{
                  flex: 1,
                  backgroundColor: cancelling ? colors.gray[300] : colors.error,
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                {cancelling ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={{ color: colors.white, fontWeight: "700" }}>Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}