import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { eventsAPI, bookingsAPI } from "../lib/api";
import { colors } from "../constants/colors";
import { toast } from "../lib/toast";

export default function CheckoutScreen() {
  const { eventId, ticketType, quantity } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookedData, setBookedData] = useState(null);
  const [error, setError] = useState("");

  const qty = parseInt(quantity) || 1;

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  async function fetchEvent() {
    try {
      const res = await eventsAPI.getOne(eventId);
      setEvent(res.data.event);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmBooking() {
    setBooking(true);
    setError("");
    try {
      const res = await bookingsAPI.create({
        eventId,
        ticketType,
        quantity: qty,
      });
      setBookedData(res.data.booking);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Success screen
  if (success && bookedData) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.gray[50], justifyContent: "center", padding: 24 }}>
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 24,
          padding: 28,
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
        }}>
          <View style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: "#f0fdf4",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}>
            <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
          </View>

          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.gray[900], marginBottom: 8 }}>
            Booking Confirmed!
          </Text>
          <Text style={{ color: colors.gray[500], fontSize: 14, textAlign: "center", marginBottom: 24 }}>
            Your tickets have been booked. Check your email for confirmation.
          </Text>

          {/* Summary */}
          <View style={{
            backgroundColor: colors.gray[50],
            borderRadius: 16,
            padding: 16,
            width: "100%",
            marginBottom: 24,
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: colors.gray[500], fontSize: 13 }}>Event</Text>
              <Text style={{ color: colors.gray[800], fontWeight: "600", fontSize: 13, flex: 1, textAlign: "right" }} numberOfLines={1}>
                {event?.title}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: colors.gray[500], fontSize: 13 }}>Ticket</Text>
              <Text style={{ color: colors.gray[800], fontWeight: "600", fontSize: 13 }}>{ticketType}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: colors.gray[500], fontSize: 13 }}>Quantity</Text>
              <Text style={{ color: colors.gray[800], fontWeight: "600", fontSize: 13 }}>{qty}</Text>
            </View>
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              borderTopWidth: 1,
              borderTopColor: colors.gray[200],
              paddingTop: 10,
              marginTop: 4,
            }}>
              <Text style={{ color: colors.gray[800], fontWeight: "700", fontSize: 14 }}>Total Paid</Text>
              <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 16 }}>
                Rs. {bookedData.totalPrice?.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)/events")}
              style={{
                flex: 1,
                borderWidth: 1.5,
                borderColor: colors.gray[200],
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.gray[700], fontWeight: "700" }}>Browse Events</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)/bookings")}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.white, fontWeight: "700" }}>My Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const ticketData = event?.ticketTypes?.find((t) => t.name === ticketType);
  const totalPrice = ticketData ? ticketData.price * qty : 0;

  const formattedDate = event ? new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : "";

  const formattedTime = event ? new Date(event.date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }) : "";

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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900] }}>
          Confirm Booking
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 + insets.bottom }}
      >
        {error ? (
          <View style={{
            backgroundColor: "#fef2f2",
            borderWidth: 1,
            borderColor: "#fecaca",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}>
            <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text>
          </View>
        ) : null}

        {/* Event summary card */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <View style={{ height: 140, backgroundColor: colors.primary }}>
            {event?.image ? (
              <Image
                source={{ uri: event.image }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="calendar-outline" size={48} color="rgba(255,255,255,0.3)" />
              </View>
            )}
          </View>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.gray[900], marginBottom: 10 }}>
              {event?.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Ionicons name="calendar-outline" size={14} color={colors.gray[400]} />
              <Text style={{ color: colors.gray[600], fontSize: 13 }}>
                {formattedDate} at {formattedTime}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="location-outline" size={14} color={colors.gray[400]} />
              <Text style={{ color: colors.gray[600], fontSize: 13 }}>
                {event?.venue?.name}, {event?.venue?.city}
              </Text>
            </View>
          </View>
        </View>

        {/* Order summary */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.gray[900], marginBottom: 14 }}>
            Order Summary
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: colors.gray[500], fontSize: 14 }}>Ticket Type</Text>
            <Text style={{ color: colors.gray[800], fontWeight: "600", fontSize: 14 }}>{ticketType}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: colors.gray[500], fontSize: 14 }}>Price per ticket</Text>
            <Text style={{ color: colors.gray[800], fontWeight: "600", fontSize: 14 }}>
              Rs. {ticketData?.price?.toLocaleString()}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: colors.gray[500], fontSize: 14 }}>Quantity</Text>
            <Text style={{ color: colors.gray[800], fontWeight: "600", fontSize: 14 }}>{qty}</Text>
          </View>
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            borderTopWidth: 1,
            borderTopColor: colors.gray[100],
            paddingTop: 12,
            marginTop: 4,
          }}>
            <Text style={{ fontWeight: "700", color: colors.gray[900], fontSize: 15 }}>Total</Text>
            <Text style={{ fontWeight: "800", color: colors.primary, fontSize: 18 }}>
              Rs. {totalPrice.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Booking for */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.gray[900], marginBottom: 12 }}>
            Booking For
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primaryLight,
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 18 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={{ fontWeight: "600", color: colors.gray[800], fontSize: 15 }}>{user?.name}</Text>
              <Text style={{ color: colors.gray[500], fontSize: 13 }}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Cancellation policy */}
        <View style={{
          backgroundColor: colors.primaryLight,
          borderRadius: 14,
          padding: 14,
          flexDirection: "row",
          gap: 10,
          alignItems: "flex-start",
        }}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 13, flex: 1, lineHeight: 20 }}>
            Free cancellation up to 24 hours before the event starts.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.white,
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
        borderTopWidth: 1,
        borderTopColor: colors.gray[100],
        flexDirection: "row",
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 8,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: colors.gray[200],
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.gray[700], fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleConfirmBooking}
          disabled={booking}
          style={{
            flex: 2,
            backgroundColor: booking ? colors.gray[300] : colors.primary,
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {booking ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
              <Text style={{ color: colors.white, fontWeight: "700", fontSize: 15 }}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}