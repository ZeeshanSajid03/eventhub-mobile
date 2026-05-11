import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { eventsAPI } from "../../lib/api";
import { colors } from "../../constants/colors";

const CATEGORIES = [
  { label: "All", value: "", icon: "grid-outline" },
  { label: "Concerts", value: "concert", icon: "musical-notes-outline" },
  { label: "Conferences", value: "conference", icon: "briefcase-outline" },
  { label: "Sports", value: "sports", icon: "trophy-outline" },
  { label: "Festivals", value: "festival", icon: "sparkles-outline" },
  { label: "Workshops", value: "workshop", icon: "construct-outline" },
];

function EventCard({ event, onPress }) {
  const availableSeats = event.ticketTypes?.reduce(
    (sum, t) => sum + (t.totalSeats - t.bookedSeats), 0
  );
  const lowestPrice = event.ticketTypes?.reduce(
    (min, t) => (t.price < min ? t.price : min),
    Infinity
  );
  const isSoldOut = availableSeats === 0;

  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: "hidden",
      }}
    >
      {/* Image */}
      <View style={{
        height: 160,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
      }}>
        {event.image ? (
          <Image
            source={{ uri: event.image }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="calendar-outline" size={48} color="rgba(255,255,255,0.4)" />
        )}
        {isSoldOut && (
          <View style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Text style={{ color: colors.white, fontWeight: "bold", fontSize: 16, letterSpacing: 2 }}>
              SOLD OUT
            </Text>
          </View>
        )}
        {event.isFeatured && (
          <View style={{
            position: "absolute",
            top: 10,
            left: 10,
            backgroundColor: "#f59e0b",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}>
            <Ionicons name="star" size={10} color={colors.white} />
            <Text style={{ color: colors.white, fontSize: 11, fontWeight: "700" }}>Featured</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <View style={{
            backgroundColor: colors.primaryLight,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 20,
          }}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "600", textTransform: "capitalize" }}>
              {event.category}
            </Text>
          </View>
          {!isSoldOut && (
            <Text style={{ color: colors.gray[400], fontSize: 12 }}>{availableSeats} seats left</Text>
          )}
        </View>

        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.gray[900], marginBottom: 8 }} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Ionicons name="calendar-outline" size={13} color={colors.gray[400]} />
          <Text style={{ color: colors.gray[500], fontSize: 13 }}>{formattedDate}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <Ionicons name="location-outline" size={13} color={colors.gray[400]} />
          <Text style={{ color: colors.gray[500], fontSize: 13 }} numberOfLines={1}>
            {event.venue?.name}, {event.venue?.city}
          </Text>
        </View>

        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderTopWidth: 1,
          borderTopColor: colors.gray[100],
          paddingTop: 10,
        }}>
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 15 }}>
            {lowestPrice === 0 ? "Free" : `From Rs. ${lowestPrice?.toLocaleString()}`}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>View Details</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user, isAuthenticated, isOrganizer } = useAuth();
  const router = useRouter();

  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEvents();
  }, [activeCategory]);

  async function fetchEvents() {
    try {
      setLoading(true);
      const params = {};
      if (activeCategory) params.category = activeCategory;

      const [featuredRes, upcomingRes] = await Promise.all([
        eventsAPI.getAll({ featured: true }),
        eventsAPI.getAll(params),
      ]);

      setFeaturedEvents(featuredRes.data.events?.slice(0, 3) || []);
      setUpcomingEvents(upcomingRes.data.events?.slice(0, 10) || []);
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
  }, [activeCategory]);

  function handleSearch() {
    if (searchQuery.trim()) {
      router.push(`/event-detail?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.gray[50] }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{
        backgroundColor: colors.primary,
        paddingTop: 56,
        paddingBottom: 28,
        paddingHorizontal: 20,
      }}>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 4 }}>
          {isAuthenticated ? "Welcome back," : "Welcome to"}
        </Text>
        <Text style={{ color: colors.white, fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          {isAuthenticated ? user?.name : "EventHub"}
        </Text>

        {/* Search bar */}
        <View style={{
          flexDirection: "row",
          backgroundColor: colors.white,
          borderRadius: 14,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: 14 }}>
            <Ionicons name="search-outline" size={18} color={colors.gray[400]} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder="Search events..."
              placeholderTextColor={colors.gray[400]}
              style={{ flex: 1, padding: 14, fontSize: 14, color: colors.gray[900] }}
            />
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 16, justifyContent: "center" }}
          >
            <Text style={{ color: colors.white, fontWeight: "700" }}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[100] }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            onPress={() => setActiveCategory(cat.value)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeCategory === cat.value ? colors.primary : colors.gray[100],
            }}
          >
            <Ionicons
              name={cat.icon}
              size={14}
              color={activeCategory === cat.value ? colors.white : colors.gray[500]}
            />
            <Text style={{
              fontSize: 13,
              fontWeight: "600",
              color: activeCategory === cat.value ? colors.white : colors.gray[600],
            }}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ padding: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Featured Events */}
            {featuredEvents.length > 0 && (
              <View style={{ marginBottom: 28 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900] }}>
                    Featured Events
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/(tabs)/events")}>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>View all</Text>
                  </TouchableOpacity>
                </View>
                {featuredEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onPress={() => router.push(`/event-detail/${event._id}`)}
                  />
                ))}
              </View>
            )}

            {/* Upcoming Events */}
            <View style={{ marginBottom: 28 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900] }}>
                  {activeCategory
                    ? `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Events`
                    : "Upcoming Events"}
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/events")}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>View all</Text>
                </TouchableOpacity>
              </View>

              {upcomingEvents.length === 0 ? (
                <View style={{
                  backgroundColor: colors.white,
                  borderRadius: 16,
                  padding: 32,
                  alignItems: "center",
                }}>
                  <Ionicons name="calendar-outline" size={48} color={colors.gray[300]} />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.gray[700], marginTop: 12 }}>
                    No events found
                  </Text>
                  <Text style={{ color: colors.gray[400], fontSize: 14, marginTop: 6, textAlign: "center" }}>
                    Try a different category
                  </Text>
                </View>
              ) : (
                upcomingEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onPress={() => router.push(`/event-detail/${event._id}`)}
                  />
                ))
              )}
            </View>

            {/* Organizer CTA */}
            {!isOrganizer && (
              <View style={{
                backgroundColor: colors.primary,
                borderRadius: 20,
                padding: 24,
                alignItems: "center",
                marginBottom: 20,
              }}>
                <Ionicons name="megaphone-outline" size={32} color="rgba(255,255,255,0.8)" style={{ marginBottom: 10 }} />
                <Text style={{ color: colors.white, fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
                  Want to host an event?
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", marginBottom: 16 }}>
                  Create and manage your events on EventHub
                </Text>
                <TouchableOpacity
                  onPress={() => router.push(isAuthenticated ? "/dashboard" : "/(auth)/register")}
                  style={{
                    backgroundColor: colors.white,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
                    {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}