import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { eventsAPI, reviewsAPI } from "../../lib/api";
import { colors } from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";


function StarRating({ value, size = 16 }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text
          key={star}
          style={{
            fontSize: size,
            color: star <= value ? "#f59e0b" : colors.gray[200],
          }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchEvent();
  }, [id]);

  async function fetchEvent() {
    try {
      setLoading(true);
      const [eventRes, reviewsRes] = await Promise.all([
        eventsAPI.getOne(id),
        reviewsAPI.getByEvent(id),
      ]);

      const fetchedEvent = eventRes.data.event;
      setEvent(fetchedEvent);
      setReviews(reviewsRes.data.reviews || []);
      setAvgRating(reviewsRes.data.avgRating || 0);

      const firstAvailable = fetchedEvent.ticketTypes?.find(
        (t) => t.totalSeats - t.bookedSeats > 0
      );
      if (firstAvailable) setSelectedTicket(firstAvailable.name);

      // Fetch related events
      const relatedRes = await eventsAPI.getAll({ category: fetchedEvent.category });
      setRelatedEvents(
        relatedRes.data.events?.filter((e) => e._id !== id).slice(0, 3) || []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `Check out ${event?.title} on EventHub!\nhttps://eventhubpk.vercel.app/events/${id}`,
      });
    } catch (err) {
      console.error(err);
    }
  }

  function handleBookNow() {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }
    router.push({
      pathname: "/checkout",
      params: { eventId: id, ticketType: selectedTicket, quantity },
    });
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) return null;

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = new Date(event.date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const selectedTicketData = event.ticketTypes?.find((t) => t.name === selectedTicket);
  const totalPrice = selectedTicketData ? selectedTicketData.price * quantity : 0;
  const totalBooked = event.ticketTypes?.reduce((s, t) => s + t.bookedSeats, 0);
  const totalSeats = event.ticketTypes?.reduce((s, t) => s + t.totalSeats, 0);
  const occupancyPct = totalSeats > 0 ? (totalBooked / totalSeats) * 100 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        {/* Cover image */}
        <View style={{ height: 240, backgroundColor: colors.primary, position: "relative" }}>
          {event.image ? (
            <Image
              source={{ uri: event.image }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Ionicons name="calendar-outline" size={64} color="rgba(255,255,255,0.3)" />
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: 48,
              left: 16,
              backgroundColor: "rgba(0,0,0,0.4)",
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.white, fontSize: 18 }}>←</Text>
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity
            onPress={handleShare}
            style={{
              position: "absolute",
              top: 48,
              right: 16,
              backgroundColor: "rgba(0,0,0,0.4)",
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.white, fontSize: 16 }}>↗</Text>
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20 }}>
          {/* Category + title */}
          <View style={{
            backgroundColor: colors.primaryLight,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 20,
            alignSelf: "flex-start",
            marginBottom: 10,
          }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>
              {event.category}
            </Text>
          </View>

          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.gray[900], marginBottom: 16, lineHeight: 30 }}>
            {event.title}
          </Text>

          {/* Meta info */}
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
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
              <View style={{ flex: 1, backgroundColor: colors.gray[50], borderRadius: 12, padding: 12 }}>
                <Text style={{ color: colors.gray[400], fontSize: 11, fontWeight: "600", marginBottom: 4 }}>DATE</Text>
                <Text style={{ color: colors.gray[800], fontSize: 13, fontWeight: "600" }}>{formattedDate}</Text>
                <Text style={{ color: colors.gray[500], fontSize: 12 }}>{formattedTime}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.gray[50], borderRadius: 12, padding: 12 }}>
                <Text style={{ color: colors.gray[400], fontSize: 11, fontWeight: "600", marginBottom: 4 }}>VENUE</Text>
                <Text style={{ color: colors.gray[800], fontSize: 13, fontWeight: "600" }}>{event.venue?.name}</Text>
                <Text style={{ color: colors.gray[500], fontSize: 12 }}>{event.venue?.city}</Text>
              </View>
            </View>

            {/* Organizer */}
            {event.organizer && (
              <TouchableOpacity
                onPress={() => router.push(`/organizer/${event.organizer._id}`)}
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primaryLight,
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
                    {event.organizer.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: colors.gray[400], fontSize: 11 }}>Organizer</Text>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
                    {event.organizer.name}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Capacity bar */}
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray[700] }}>Capacity</Text>
              <Text style={{ fontSize: 13, color: colors.gray[500] }}>{totalBooked}/{totalSeats} booked</Text>
            </View>
            <View style={{ height: 8, backgroundColor: colors.gray[100], borderRadius: 4, overflow: "hidden" }}>
              <View style={{
                height: "100%",
                width: `${Math.min(occupancyPct, 100)}%`,
                backgroundColor: occupancyPct >= 90 ? colors.error : occupancyPct >= 60 ? "#f59e0b" : "#22c55e",
                borderRadius: 4,
              }} />
            </View>
            <Text style={{
              fontSize: 12,
              marginTop: 6,
              color: occupancyPct >= 90 ? colors.error : occupancyPct >= 60 ? "#f59e0b" : "#22c55e",
              fontWeight: "600",
            }}>
              {occupancyPct >= 90 ? "Almost sold out!" : `${Math.round(occupancyPct)}% sold`}
            </Text>
          </View>

          {/* Description */}
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
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.gray[900], marginBottom: 10 }}>
              About this event
            </Text>
            <Text style={{ color: colors.gray[600], fontSize: 14, lineHeight: 22 }}>
              {event.description}
            </Text>
          </View>

          {/* Ticket selector */}
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
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.gray[900], marginBottom: 12 }}>
              Select Ticket
            </Text>

            {event.ticketTypes?.map((ticket) => {
              const available = ticket.totalSeats - ticket.bookedSeats;
              const isSelected = selectedTicket === ticket.name;
              const isSoldOut = available === 0;

              return (
                <TouchableOpacity
                  key={ticket.name}
                  onPress={() => !isSoldOut && setSelectedTicket(ticket.name)}
                  disabled={isSoldOut}
                  style={{
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.gray[200],
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    backgroundColor: isSelected ? colors.primaryLight : colors.white,
                    opacity: isSoldOut ? 0.5 : 1,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[800] }}>
                        {ticket.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: isSoldOut ? colors.error : colors.gray[500], marginTop: 2 }}>
                        {isSoldOut ? "Sold out" : `${available} available`}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
                      {ticket.price === 0 ? "Free" : `Rs. ${ticket.price.toLocaleString()}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Quantity */}
            {selectedTicket && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.gray[700], marginBottom: 10 }}>
                  Quantity
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <TouchableOpacity
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 1.5,
                      borderColor: colors.gray[300],
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20, color: colors.gray[600] }}>−</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.gray[900] }}>{quantity}</Text>
                  <TouchableOpacity
                    onPress={() => setQuantity(Math.min(10, quantity + 1))}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 1.5,
                      borderColor: colors.gray[300],
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20, color: colors.gray[600] }}>+</Text>
                  </TouchableOpacity>
                  <Text style={{ color: colors.gray[400], fontSize: 13 }}>max 10</Text>
                </View>
              </View>
            )}
          </View>

          {/* Reviews */}
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.gray[900] }}>
                Reviews {reviews.length > 0 ? `(${reviews.length})` : ""}
              </Text>
              {reviews.length > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <StarRating value={Math.round(avgRating)} />
                  <Text style={{ color: colors.gray[600], fontSize: 13, fontWeight: "600" }}>
                    {avgRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            {reviews.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Ionicons name="star-outline" size={36} color={colors.gray[300]} />
                <Text style={{ color: colors.gray[400], fontSize: 14, marginTop: 8 }}>
                  No reviews yet
                </Text>
              </View>
            ) : (
              reviews.slice(0, 5).map((review) => (
                <View key={review._id} style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.gray[100],
                  paddingTop: 12,
                  marginTop: 12,
                }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.primaryLight,
                        justifyContent: "center",
                        alignItems: "center",
                      }}>
                        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
                          {review.user?.name?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ fontWeight: "600", color: colors.gray[800], fontSize: 13 }}>
                        {review.user?.name}
                      </Text>
                    </View>
                    <StarRating value={review.rating} size={13} />
                  </View>
                  <Text style={{ color: colors.gray[600], fontSize: 13, lineHeight: 20, marginLeft: 40 }}>
                    {review.comment}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Related events */}
          {relatedEvents.length > 0 && (
            <View style={{ marginBottom: 120 + insets.bottom }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.gray[900], marginBottom: 12 }}>
                More {event.category?.charAt(0).toUpperCase() + event.category?.slice(1)} Events
              </Text>
              {relatedEvents.map((relEvent) => (
                <TouchableOpacity
                  key={relEvent._id}
                  onPress={() => router.push(`/event-detail/${relEvent._id}`)}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 10,
                    backgroundColor: colors.primary,
                    overflow: "hidden",
                  }}>
                    {relEvent.image ? (
                      <Image source={{ uri: relEvent.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="calendar-outline" size={24} color="rgba(255,255,255,0.4)" />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: colors.gray[800], fontSize: 14 }} numberOfLines={1}>
                      {relEvent.title}
                    </Text>
                    <Text style={{ color: colors.gray[500], fontSize: 12, marginTop: 2 }}>
                      {new Date(relEvent.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 16 }}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom booking bar */}
      {event.status !== "cancelled" && (
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.white,
          paddingTop: 16,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
          borderTopWidth: 1,
          borderTopColor: colors.gray[100],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        }}>
          <View>
            <Text style={{ color: colors.gray[500], fontSize: 12 }}>Total</Text>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.primary }}>
              {totalPrice === 0 ? "Free" : `Rs. ${totalPrice.toLocaleString()}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleBookNow}
            disabled={!selectedTicket}
            style={{
              backgroundColor: selectedTicket ? colors.primary : colors.gray[300],
              borderRadius: 14,
              paddingHorizontal: 32,
              paddingVertical: 14,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "700", fontSize: 16 }}>
              {isAuthenticated ? "Book Now" : "Login to Book"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}