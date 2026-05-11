import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { adminAPI } from "../../lib/api";
import { colors } from "../../constants/colors";
import { toast } from "../../lib/toast";

const TARGETS = [
  { label: "All Users", value: "all", icon: "people-outline" },
  { label: "Attendees Only", value: "user", icon: "person-outline" },
  { label: "Organizers Only", value: "organizer", icon: "megaphone-outline" },
];

export default function BroadcastScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    targetRole: "all",
  });
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!formData.subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Message is required");
      return;
    }

    toast.confirm(
      "Send Broadcast",
      `Send this email to all ${formData.targetRole === "all" ? "users" : formData.targetRole === "user" ? "attendees" : "organizers"}?`,
      async () => {
        setSending(true);
        try {
          const res = await adminAPI.broadcast(formData);
          toast.success(res.data.message);
          setFormData({ subject: "", message: "", targetRole: "all" });
        } catch (err) {
          toast.error(err.message);
        } finally {
          setSending(false);
        }
      }
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
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900] }}>
            Broadcast Email
          </Text>
          <Text style={{ color: colors.gray[400], fontSize: 12 }}>
            Send announcement to users
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Target audience */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[900], marginBottom: 14 }}>
            Send To
          </Text>
          <View style={{ gap: 10 }}>
            {TARGETS.map((target) => (
              <TouchableOpacity
                key={target.value}
                onPress={() => setFormData({ ...formData, targetRole: target.value })}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: formData.targetRole === target.value ? "#dc2626" : colors.gray[200],
                  backgroundColor: formData.targetRole === target.value ? "#fef2f2" : colors.white,
                }}
              >
                <Ionicons
                  name={target.icon}
                  size={20}
                  color={formData.targetRole === target.value ? "#dc2626" : colors.gray[400]}
                />
                <Text style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: formData.targetRole === target.value ? "#dc2626" : colors.gray[700],
                }}>
                  {target.label}
                </Text>
                {formData.targetRole === target.value && (
                  <Ionicons name="checkmark-circle" size={18} color="#dc2626" style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Email content */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.gray[900], marginBottom: 14 }}>
            Email Content
          </Text>

          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray[700], marginBottom: 6 }}>
            Subject *
          </Text>
          <TextInput
            value={formData.subject}
            onChangeText={(v) => setFormData({ ...formData, subject: v })}
            placeholder="e.g. Exciting new events this weekend!"
            placeholderTextColor={colors.gray[400]}
            style={{
              borderWidth: 1.5,
              borderColor: colors.gray[200],
              borderRadius: 12,
              padding: 12,
              fontSize: 14,
              color: colors.gray[900],
              backgroundColor: colors.gray[50],
              marginBottom: 14,
            }}
          />

          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray[700], marginBottom: 6 }}>
            Message *
          </Text>
          <TextInput
            value={formData.message}
            onChangeText={(v) => setFormData({ ...formData, message: v })}
            placeholder="Write your announcement here..."
            placeholderTextColor={colors.gray[400]}
            multiline
            numberOfLines={8}
            style={{
              borderWidth: 1.5,
              borderColor: colors.gray[200],
              borderRadius: 12,
              padding: 12,
              fontSize: 14,
              color: colors.gray[900],
              backgroundColor: colors.gray[50],
              minHeight: 160,
              textAlignVertical: "top",
              marginBottom: 8,
            }}
          />
          <Text style={{ color: colors.gray[400], fontSize: 12, textAlign: "right" }}>
            {formData.message.length} characters
          </Text>
        </View>

        {/* Warning */}
        <View style={{
          backgroundColor: "#fffbeb",
          borderWidth: 1,
          borderColor: "#fde68a",
          borderRadius: 14,
          padding: 14,
          flexDirection: "row",
          gap: 10,
          alignItems: "flex-start",
        }}>
          <Ionicons name="warning-outline" size={18} color="#d97706" />
          <Text style={{ color: "#92400e", fontSize: 13, flex: 1, lineHeight: 20 }}>
            This email will be sent to all{" "}
            {formData.targetRole === "all"
              ? "registered users"
              : formData.targetRole === "user"
              ? "attendees"
              : "organizers"}{" "}
            on the platform. Make sure your message is correct.
          </Text>
        </View>
      </ScrollView>

      {/* Send button */}
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
          onPress={handleSend}
          disabled={sending}
          style={{
            backgroundColor: sending ? colors.gray[300] : "#dc2626",
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {sending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color={colors.white} />
              <Text style={{ color: colors.white, fontWeight: "700", fontSize: 15 }}>
                Send Broadcast
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}