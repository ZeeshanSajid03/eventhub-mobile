import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { organizerAPI } from "../../lib/api";
import { colors } from "../../constants/colors";

function EventCard({ event, onPress }) {
  const lowestPrice = event.ticketTypes?.reduce(
    (min, t) => (t.price < min ? t.price : min), Infinity
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.white,
        borderRadius: 14,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: "row",
        overflow: "hidden",
        height: 90,
      }}
    >
      <View style={{ width: 90, backgroundColor: colors.primary }}>
        {event.image ? (
          <Image source={{ uri: event.image }} style={{ width: 90, height: 90 }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={24} color="rgba(255,255,255,0.4)" />
          </View>
        )}
      </View>
      <View style={{ flex: 1, padding: 12, justifyContent: "space-between" }}>
        <Text style={{ fontWeight: "700", color: colors.gray[900], fontSize: 14 }} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="calendar-outline" size={11} color={colors.gray[400]} />
          <Text style={{ color: colors.gray[500], fontSize: 12 }}>
            {new Date(event.date).toLocaleDateString()}
          </Text>
        </View>
        <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
          {lowestPrice === 0 ? "Free" : `From Rs. ${lowestPrice?.toLocaleString()}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OrganizerProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrganizer();
  }, [id]);

  async function fetchOrganizer() {
    try {
      const res = await organizerAPI.getProfile(id);
      setOrganizer(res.data.organizer);
      setEvents(res.data.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <Text style={{ color: colors.gray[500], textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date());
  const pastEvents = events.filter((e) => new Date(e.date) < new Date());

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: 48,
          left: 16,
          zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.4)",
          borderRadius: 20,
          width: 40,
          height: 40,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="arrow-back" size={20} color={colors.white} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View style={{
          backgroundColor: colors.primary,
          paddingTop: 80,
          paddingBottom: 32,
          paddingHorizontal: 20,
          alignItems: "center",
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(255,255,255,0.2)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 12,
            overflow: "hidden",
          }}>
            {organizer?.avatar ? (
              <Image source={{ uri: organizer.avatar }} style={{ width: 80, height: 80 }} resizeMode="cover" />
            ) : (
              <Text style={{ color: colors.white, fontSize: 32, fontWeight: "700" }}>
                {organizer?.name?.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <Text style={{ color: colors.white, fontSize: 20, fontWeight: "700" }}>
            {organizer?.name}
          </Text>

          <View style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 20,
            marginTop: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}>
            <Ionicons name="checkmark-circle" size={14} color={colors.white} />
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: "600" }}>
              Verified Organizer
            </Text>
          </View>

          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 8 }}>
            Member since {new Date(organizer?.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>

          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 32, marginTop: 20 }}>
            {[
              { label: "Total Events", value: events.length },
              { label: "Upcoming", value: upcomingEvents.length },
              { label: "Past", value: pastEvents.length },
            ].map((stat) => (
              <View key={stat.label} style={{ alignItems: "center" }}>
                <Text style={{ color: colors.white, fontSize: 20, fontWeight: "800" }}>{stat.value}</Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {/* Upcoming events */}
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.gray[900], marginBottom: 12 }}>
            Upcoming Events
          </Text>
          {upcomingEvents.length === 0 ? (
            <View style={{
              backgroundColor: colors.white,
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              marginBottom: 20,
            }}>
              <Ionicons name="calendar-outline" size={40} color={colors.gray[300]} />
              <Text style={{ color: colors.gray[400], fontSize: 14, marginTop: 10 }}>
                No upcoming events
              </Text>
            </View>
          ) : (
            <View style={{ marginBottom: 20 }}>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onPress={() => router.push(`/event-detail/${event._id}`)}
                />
              ))}
            </View>
          )}

          {/* Past events */}
          {pastEvents.length > 0 && (
            <>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.gray[900], marginBottom: 12 }}>
                Past Events
              </Text>
              <View style={{ opacity: 0.7 }}>
                {pastEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onPress={() => router.push(`/event-detail/${event._id}`)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}