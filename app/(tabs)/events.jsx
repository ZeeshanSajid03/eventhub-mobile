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
import { eventsAPI } from "../../lib/api";
import { colors } from "../../constants/colors";

const CATEGORIES = [
  { label: "All", value: "", icon: "grid-outline" },
  { label: "Concert", value: "concert", icon: "musical-notes-outline" },
  { label: "Conference", value: "conference", icon: "briefcase-outline" },
  { label: "Sports", value: "sports", icon: "trophy-outline" },
  { label: "Festival", value: "festival", icon: "sparkles-outline" },
  { label: "Workshop", value: "workshop", icon: "construct-outline" },
  { label: "Other", value: "other", icon: "ellipsis-horizontal-outline" },
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
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      {/* Image */}
      <View style={{
        width: 100,
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
          <Ionicons name="calendar-outline" size={32} color="rgba(255,255,255,0.4)" />
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1, padding: 12 }}>
        <View style={{
          backgroundColor: colors.primaryLight,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 10,
          alignSelf: "flex-start",
          marginBottom: 6,
        }}>
          <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "600", textTransform: "capitalize" }}>
            {event.category}
          </Text>
        </View>

        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.gray[900], marginBottom: 6 }} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <Ionicons name="calendar-outline" size={12} color={colors.gray[400]} />
          <Text style={{ color: colors.gray[500], fontSize: 12 }}>{formattedDate}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 }}>
          <Ionicons name="location-outline" size={12} color={colors.gray[400]} />
          <Text style={{ color: colors.gray[500], fontSize: 12 }} numberOfLines={1}>
            {event.venue?.city}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
            {lowestPrice === 0 ? "Free" : `Rs. ${lowestPrice?.toLocaleString()}`}
          </Text>
          {isSoldOut ? (
            <View style={{ backgroundColor: "#fef2f2", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ color: colors.error, fontSize: 11, fontWeight: "600" }}>Sold Out</Text>
            </View>
          ) : (
            <Text style={{ color: colors.gray[400], fontSize: 11 }}>{availableSeats} left</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [city, setCity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchEvents();
  }, [activeCategory]);

  async function fetchEvents() {
    try {
      setLoading(true);
      const params = {};
      if (activeCategory) params.category = activeCategory;
      if (search.trim()) params.search = search.trim();
      if (city.trim()) params.city = city.trim();

      const res = await eventsAPI.getAll(params);
      setEvents(res.data.events || []);
      setPage(1);
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
  }, [activeCategory, search, city]);

  const paginatedEvents = events.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = paginatedEvents.length < events.length;

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
          Browse Events
        </Text>

        {/* Search */}
        <View style={{
          flexDirection: "row",
          backgroundColor: colors.gray[50],
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: colors.gray[200],
          overflow: "hidden",
          marginBottom: 10,
        }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: 12 }}>
            <Ionicons name="search-outline" size={16} color={colors.gray[400]} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={fetchEvents}
              placeholder="Search events..."
              placeholderTextColor={colors.gray[400]}
              style={{ flex: 1, padding: 12, fontSize: 14, color: colors.gray[900] }}
            />
          </View>
          <TouchableOpacity
            onPress={fetchEvents}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 14, justifyContent: "center" }}
          >
            <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>Go</Text>
          </TouchableOpacity>
        </View>

        {/* Filter toggle */}
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" }}
        >
          <Ionicons
            name={showFilters ? "chevron-up-outline" : "options-outline"}
            size={14}
            color={colors.primary}
          />
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
            {showFilters ? "Hide Filters" : "More Filters"}
          </Text>
        </TouchableOpacity>

        {/* Filters */}
        {showFilters && (
          <View style={{ marginTop: 10 }}>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Filter by city..."
              placeholderTextColor={colors.gray[400]}
              style={{
                backgroundColor: colors.gray[50],
                borderWidth: 1.5,
                borderColor: colors.gray[200],
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: colors.gray[900],
                marginBottom: 10,
              }}
            />
            <TouchableOpacity
              onPress={fetchEvents}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.white, fontWeight: "700" }}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: colors.white, maxHeight: 52 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            onPress={() => setActiveCategory(cat.value)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: activeCategory === cat.value ? colors.primary : colors.gray[100],
            }}
          >
            <Ionicons
              name={cat.icon}
              size={13}
              color={activeCategory === cat.value ? colors.white : colors.gray[500]}
            />
            <Text style={{
              fontSize: 12,
              fontWeight: "600",
              color: activeCategory === cat.value ? colors.white : colors.gray[600],
            }}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events list */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={paginatedEvents}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/event-detail/${item._id}`)}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Ionicons name="calendar-outline" size={56} color={colors.gray[300]} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.gray[700], marginTop: 12 }}>
                No events found
              </Text>
              <Text style={{ color: colors.gray[400], fontSize: 14, marginTop: 6 }}>
                Try adjusting your filters
              </Text>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                onPress={() => setPage((p) => p + 1)}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  marginTop: 8,
                  marginBottom: 20,
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700" }}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}