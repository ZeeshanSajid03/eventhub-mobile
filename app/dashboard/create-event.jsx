import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { eventsAPI } from "../../lib/api";
import { getToken } from "../../lib/storage";
import { colors } from "../../constants/colors";
import { toast } from "../../lib/toast";

const CATEGORIES = ["concert", "conference", "sports", "festival", "workshop", "other"];

const emptyTicket = { name: "", price: "", totalSeats: "" };

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "concert",
    date: "",
    venue: { name: "", address: "", city: "" },
    ticketTypes: [{ ...emptyTicket }],
    tags: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function handleChange(field, value) {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "" });
  }

  function handleVenueChange(field, value) {
    setFormData({ ...formData, venue: { ...formData.venue, [field]: value } });
  }

  function handleTicketChange(index, field, value) {
    const updated = [...formData.ticketTypes];
    updated[index][field] = value;
    setFormData({ ...formData, ticketTypes: updated });
  }

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error("Permission required to access photos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
      setImagePreview(result.assets[0].uri);
    }
  }

  function validate() {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.venue.name) newErrors.venueName = "Venue name is required";
    if (!formData.venue.city) newErrors.venueCity = "City is required";
    if (!formData.venue.address) newErrors.venueAddress = "Address is required";
    formData.ticketTypes.forEach((t, i) => {
      if (!t.name) newErrors[`ticket_${i}_name`] = "Required";
      if (t.price === "" || isNaN(t.price)) newErrors[`ticket_${i}_price`] = "Required";
      if (!t.totalSeats || isNaN(t.totalSeats)) newErrors[`ticket_${i}_seats`] = "Required";
    });
    return newErrors;
  }

  async function handleSubmit() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = "";
      if (image) {
        const formDataImg = new FormData();
        formDataImg.append("file", {
          uri: image.uri,
          type: "image/jpeg",
          name: "event.jpg",
        });
        const token = await getToken();
        const uploadRes = await fetch("https://eventhubpk.vercel.app/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formDataImg,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }
      }

      const payload = {
        ...formData,
        status: "pending",
        image: imageUrl,
        ticketTypes: formData.ticketTypes.map((t) => ({
          name: t.name,
          price: Number(t.price),
          totalSeats: Number(t.totalSeats),
        })),
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };

      await eventsAPI.create(payload);
      toast.success("Event submitted for review!");
      router.push("/dashboard/events");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function InputField({ label, value, onChangeText, placeholder, error, keyboardType, multiline }) {
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
          keyboardType={keyboardType || "default"}
          multiline={multiline}
          style={{
            borderWidth: 1.5,
            borderColor: error ? colors.error : colors.gray[200],
            borderRadius: 12,
            padding: 12,
            fontSize: 14,
            color: colors.gray[900],
            backgroundColor: colors.gray[50],
            minHeight: multiline ? 80 : undefined,
            textAlignVertical: multiline ? "top" : undefined,
          }}
        />
        {error ? <Text style={{ color: colors.error, fontSize: 11, marginTop: 4 }}>{error}</Text> : null}
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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900] }}>Create Event</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic info */}
        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[900], marginBottom: 14 }}>
            Basic Information
          </Text>
          <InputField
            label="Event Title *"
            value={formData.title}
            onChangeText={(v) => handleChange("title", v)}
            placeholder="e.g. Lahore Music Festival"
            error={errors.title}
          />
          <InputField
            label="Description *"
            value={formData.description}
            onChangeText={(v) => handleChange("description", v)}
            placeholder="Describe your event..."
            error={errors.description}
            multiline
          />

          {/* Category */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray[700], marginBottom: 8 }}>
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => handleChange("category", cat)}
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

          <InputField
            label="Tags (comma separated)"
            value={formData.tags}
            onChangeText={(v) => handleChange("tags", v)}
            placeholder="music, outdoor, family"
          />
        </View>

        {/* Date & Venue */}
        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[900], marginBottom: 14 }}>
            Date & Venue
          </Text>
          <InputField
            label="Date & Time * (YYYY-MM-DD HH:MM)"
            value={formData.date}
            onChangeText={(v) => handleChange("date", v)}
            placeholder="2025-12-31 18:00"
            error={errors.date}
          />
          <InputField
            label="Venue Name *"
            value={formData.venue.name}
            onChangeText={(v) => handleVenueChange("name", v)}
            placeholder="e.g. Alhamra Arts Council"
            error={errors.venueName}
          />
          <InputField
            label="Address *"
            value={formData.venue.address}
            onChangeText={(v) => handleVenueChange("address", v)}
            placeholder="e.g. The Mall Road"
            error={errors.venueAddress}
          />
          <InputField
            label="City *"
            value={formData.venue.city}
            onChangeText={(v) => handleVenueChange("city", v)}
            placeholder="e.g. Lahore"
            error={errors.venueCity}
          />
        </View>

        {/* Ticket types */}
        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[900] }}>
              Ticket Types
            </Text>
            <TouchableOpacity
              onPress={() => setFormData({ ...formData, ticketTypes: [...formData.ticketTypes, { ...emptyTicket }] })}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>Add Type</Text>
            </TouchableOpacity>
          </View>

          {formData.ticketTypes.map((ticket, index) => (
            <View key={index} style={{
              backgroundColor: colors.gray[50],
              borderRadius: 12,
              padding: 14,
              marginBottom: 12,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontWeight: "600", color: colors.gray[700] }}>
                  Ticket Type {index + 1}
                </Text>
                {formData.ticketTypes.length > 1 && (
                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, ticketTypes: formData.ticketTypes.filter((_, i) => i !== index) })}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 2 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray[600], marginBottom: 4 }}>Name</Text>
                  <TextInput
                    value={ticket.name}
                    onChangeText={(v) => handleTicketChange(index, "name", v)}
                    placeholder="e.g. General"
                    placeholderTextColor={colors.gray[400]}
                    style={{
                      borderWidth: 1.5,
                      borderColor: errors[`ticket_${index}_name`] ? colors.error : colors.gray[200],
                      borderRadius: 10,
                      padding: 10,
                      fontSize: 13,
                      color: colors.gray[900],
                      backgroundColor: colors.white,
                    }}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray[600], marginBottom: 4 }}>Price</Text>
                  <TextInput
                    value={ticket.price}
                    onChangeText={(v) => handleTicketChange(index, "price", v)}
                    placeholder="0"
                    placeholderTextColor={colors.gray[400]}
                    keyboardType="numeric"
                    style={{
                      borderWidth: 1.5,
                      borderColor: errors[`ticket_${index}_price`] ? colors.error : colors.gray[200],
                      borderRadius: 10,
                      padding: 10,
                      fontSize: 13,
                      color: colors.gray[900],
                      backgroundColor: colors.white,
                    }}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.gray[600], marginBottom: 4 }}>Seats</Text>
                  <TextInput
                    value={ticket.totalSeats}
                    onChangeText={(v) => handleTicketChange(index, "totalSeats", v)}
                    placeholder="100"
                    placeholderTextColor={colors.gray[400]}
                    keyboardType="numeric"
                    style={{
                      borderWidth: 1.5,
                      borderColor: errors[`ticket_${index}_seats`] ? colors.error : colors.gray[200],
                      borderRadius: 10,
                      padding: 10,
                      fontSize: 13,
                      color: colors.gray[900],
                      backgroundColor: colors.white,
                    }}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Image upload */}
        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[900], marginBottom: 14 }}>
            Event Image
          </Text>
          {imagePreview ? (
            <View style={{ marginBottom: 12 }}>
              <Image
                source={{ uri: imagePreview }}
                style={{ width: "100%", height: 160, borderRadius: 12 }}
                resizeMode="cover"
              />
            </View>
          ) : null}
          <TouchableOpacity
            onPress={handlePickImage}
            style={{
              borderWidth: 2,
              borderColor: colors.gray[200],
              borderStyle: "dashed",
              borderRadius: 12,
              padding: 24,
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons name="camera-outline" size={28} color={colors.gray[400]} />
            <Text style={{ color: colors.gray[500], fontSize: 14, fontWeight: "500" }}>
              {imagePreview ? "Change Image" : "Upload Image"}
            </Text>
            <Text style={{ color: colors.gray[400], fontSize: 12 }}>PNG, JPG up to 5MB</Text>
          </TouchableOpacity>
        </View>

        {/* Submit notice */}
        <View style={{
          backgroundColor: colors.primaryLight,
          borderRadius: 14,
          padding: 14,
          flexDirection: "row",
          gap: 10,
          alignItems: "flex-start",
          marginBottom: 16,
        }}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 13, flex: 1, lineHeight: 20 }}>
            Your event will be reviewed by our admin team before going live.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom submit button */}
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 8,
      }}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? colors.gray[300] : colors.primary,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color={colors.white} />
              <Text style={{ color: colors.white, fontWeight: "700", fontSize: 15 }}>
                Submit for Review
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}