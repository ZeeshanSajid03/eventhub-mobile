import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { eventsAPI } from "../../../lib/api";
import { colors } from "../../../constants/colors";
import { toast } from "../../../lib/toast";

const CATEGORIES = ["concert", "conference", "sports", "festival", "workshop", "other"];

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  async function fetchEvent() {
    try {
      const res = await eventsAPI.getOne(id);
      const e = res.data.event;
      setFormData({
        title: e.title,
        description: e.description,
        category: e.category,
        date: new Date(e.date).toISOString().slice(0, 16).replace("T", " "),
        venue: e.venue,
        ticketTypes: e.ticketTypes.map((t) => ({
          name: t.name,
          price: t.price.toString(),
          totalSeats: t.totalSeats.toString(),
        })),
        tags: e.tags?.join(", ") || "",
        status: e.status,
      });
    } catch (err) {
      toast.error("Failed to load event");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        ticketTypes: formData.ticketTypes.map((t) => ({
          name: t.name,
          price: Number(t.price),
          totalSeats: Number(t.totalSeats),
        })),
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };
      await eventsAPI.update(id, payload);
      toast.success("Event updated successfully");
      router.back();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!formData) return null;

  function InputField({ label, value, onChangeText, placeholder, multiline, keyboardType }) {
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray[700], marginBottom: 6 }}>
          {label}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          multiline={multiline}
          keyboardType={keyboardType || "default"}
          style={{
            borderWidth: 1.5,
            borderColor: colors.gray[200],
            borderRadius: 12,
            padding: 12,
            fontSize: 14,
            color: colors.gray[900],
            backgroundColor: colors.gray[50],
            minHeight: multiline ? 80 : undefined,
            textAlignVertical: multiline ? "top" : undefined,
          }}
        />
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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900] }}>Edit Event</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic info */}
        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[900], marginBottom: 14 }}>Basic Information</Text>
          <InputField label="Title" value={formData.title} onChangeText={(v) => setFormData({ ...formData, title: v })} />
          <InputField label="Description" value={formData.description} onChangeText={(v) => setFormData({ ...formData, description: v })} multiline />

          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray[700], marginBottom: 8 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setFormData({ ...formData, category: cat })}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: formData.category === cat ? colors.primary : colors.gray[100],
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: "600",
                    textTransform: "capitalize",
                    color: formData.category === cat ? colors.white : colors.gray[600],
                  }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray[700], marginBottom: 8 }}>Status</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {["draft", "published", "cancelled", "completed"].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setFormData({ ...formData, status: s })}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: formData.status === s ? colors.primary : colors.gray[100],
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: "600",
                  textTransform: "capitalize",
                  color: formData.status === s ? colors.white : colors.gray[600],
                }}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField label="Tags (comma separated)" value={formData.tags} onChangeText={(v) => setFormData({ ...formData, tags: v })} placeholder="music, outdoor, family" />
        </View>

        {/* Date & venue */}
        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[900], marginBottom: 14 }}>Date & Venue</Text>
          <InputField label="Date & Time (YYYY-MM-DD HH:MM)" value={formData.date} onChangeText={(v) => setFormData({ ...formData, date: v })} />
          <InputField label="Venue Name" value={formData.venue.name} onChangeText={(v) => setFormData({ ...formData, venue: { ...formData.venue, name: v } })} />
          <InputField label="Address" value={formData.venue.address} onChangeText={(v) => setFormData({ ...formData, venue: { ...formData.venue, address: v } })} />
          <InputField label="City" value={formData.venue.city} onChangeText={(v) => setFormData({ ...formData, venue: { ...formData.venue, city: v } })} />
        </View>

        {/* Ticket types */}
        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[900], marginBottom: 14 }}>Ticket Types</Text>
          {formData.ticketTypes.map((ticket, index) => (
            <View key={index} style={{ backgroundColor: colors.gray[50], borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <Text style={{ fontWeight: "600", color: colors.gray[700], marginBottom: 10 }}>
                Ticket Type {index + 1}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 2 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray[600], marginBottom: 4 }}>Name</Text>
                  <TextInput
                    value={ticket.name}
                    onChangeText={(v) => {
                      const updated = [...formData.ticketTypes];
                      updated[index].name = v;
                      setFormData({ ...formData, ticketTypes: updated });
                    }}
                    style={{ borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: 10, padding: 10, fontSize: 13, color: colors.gray[900], backgroundColor: colors.white }}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray[600], marginBottom: 4 }}>Price</Text>
                  <TextInput
                    value={ticket.price.toString()}
                    onChangeText={(v) => {
                      const updated = [...formData.ticketTypes];
                      updated[index].price = v;
                      setFormData({ ...formData, ticketTypes: updated });
                    }}
                    keyboardType="numeric"
                    style={{ borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: 10, padding: 10, fontSize: 13, color: colors.gray[900], backgroundColor: colors.white }}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray[600], marginBottom: 4 }}>Seats</Text>
                  <TextInput
                    value={ticket.totalSeats.toString()}
                    onChangeText={(v) => {
                      const updated = [...formData.ticketTypes];
                      updated[index].totalSeats = v;
                      setFormData({ ...formData, ticketTypes: updated });
                    }}
                    keyboardType="numeric"
                    style={{ borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: 10, padding: 10, fontSize: 13, color: colors.gray[900], backgroundColor: colors.white }}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Save button */}
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
        elevation: 8,
      }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: saving ? colors.gray[300] : colors.primary,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color={colors.white} />
              <Text style={{ color: colors.white, fontWeight: "700", fontSize: 15 }}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}