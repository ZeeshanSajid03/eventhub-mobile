import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { userAPI } from "../../lib/api";
import { colors } from "../../constants/colors";
import { toast } from "../../lib/toast";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import api from "../../lib/api";
import { getToken } from "../../lib/storage";
import { images } from "../../constants/images";

export default function ProfileScreen() {
  const { user, isAuthenticated, isOrganizer, isAdmin, logout, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeSection, setActiveSection] = useState(null);
  const [profileData, setProfileData] = useState({ name: user?.name || "", email: user?.email || "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [notifications, setNotifications] = useState({
    bookingConfirmation: true,
    eventReminders: true,
    cancellations: true,
    newEvents: false,
  });

  async function handleSaveProfile() {
    if (!profileData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSavingProfile(true);
    try {
      await userAPI.updateProfile({ name: profileData.name, email: profileData.email });
      await refreshUser();
      setActiveSection(null);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword() {
    if (!passwordData.currentPassword) { toast.error("Current password is required"); return; }
    if (!passwordData.newPassword) { toast.error("New password is required"); return; }
    if (passwordData.newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) { toast.error("Passwords do not match"); return; }

    setSavingPassword(true);
    try {
      await userAPI.updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setActiveSection(null);
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error("Permission to access photos is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append("file", {
      uri: asset.uri,
      type: "image/jpeg",
      name: "avatar.jpg",
    });

    try {
      const token = await getToken();
      const res = await fetch("https://eventhubpk.vercel.app/api/upload/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await userAPI.updateProfile({ avatar: data.url });
      await refreshUser();
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error("Failed to upload image");
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== user?.email) {
      toast.error("Email does not match");
      return;
    }
    setDeleting(true);
    try {
      await userAPI.deleteAccount();
      logout();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.gray[50], padding: 32 }}>
        <Ionicons name="person-circle-outline" size={72} color={colors.gray[300]} />
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.gray[800], marginTop: 16, marginBottom: 8 }}>
          Sign in to view profile
        </Text>
        <Text style={{ color: colors.gray[500], textAlign: "center", marginBottom: 24 }}>
          Login to manage your account settings
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

  function SettingRow({ icon, label, onPress, danger, rightElement }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray[50],
        }}
      >
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: danger ? "#fef2f2" : colors.gray[50],
          justifyContent: "center",
          alignItems: "center",
          marginRight: 14,
        }}>
          <Ionicons name={icon} size={18} color={danger ? colors.error : colors.gray[600]} />
        </View>
        <Text style={{
          flex: 1,
          fontSize: 15,
          fontWeight: "500",
          color: danger ? colors.error : colors.gray[800],
        }}>
          {label}
        </Text>
        {rightElement || (
          <Ionicons name="chevron-forward" size={16} color={colors.gray[300]} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View style={{
          backgroundColor: colors.primary,
          paddingTop: 56,
          paddingBottom: 32,
          paddingHorizontal: 20,
          alignItems: "center",
        }}>
          <TouchableOpacity onPress={handlePickAvatar} style={{ marginBottom: 12 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "rgba(255,255,255,0.2)",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}>
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontSize: 36, fontWeight: "700", color: colors.white }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            {/* Edit badge */}
            <View style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.white,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 3,
            }}>
              <Ionicons name="camera" size={13} color={colors.primary} />
            </View>
          </TouchableOpacity>
          <Text style={{ color: colors.white, fontSize: 20, fontWeight: "700" }}>{user?.name}</Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 4 }}>{user?.email}</Text>
          <View style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderRadius: 20,
            marginTop: 10,
          }}>
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>
              {user?.role}
            </Text>
          </View>
        </View>

        {/* Quick actions */}
        {/* Quick actions - always show bookings here */}
        <View style={{ flexDirection: "row", padding: 16, gap: 12 }}>
          {/* Bookings - always visible in profile quick actions */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/bookings")}
            style={{
              flex: 1,
              backgroundColor: colors.white,
              borderRadius: 14,
              padding: 14,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="ticket-outline" size={22} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 12, marginTop: 6 }}>
              My Bookings
            </Text>
          </TouchableOpacity>

          {isOrganizer && !isAdmin && (
            <TouchableOpacity
              onPress={() => router.push("/dashboard")}
              style={{
                flex: 1,
                backgroundColor: colors.white,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Ionicons name="grid-outline" size={22} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 12, marginTop: 6 }}>
                Dashboard
              </Text>
            </TouchableOpacity>
          )}

          {isAdmin && (
            <TouchableOpacity
              onPress={() => router.push("/dashboard")}
              style={{
                flex: 1,
                backgroundColor: colors.white,
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Ionicons name="grid-outline" size={22} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 12, marginTop: 6 }}>
                Dashboard
              </Text>
            </TouchableOpacity>
          )}

          {/* Settings shortcut */}
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={{
              flex: 1,
              backgroundColor: colors.white,
              borderRadius: 14,
              padding: 14,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="settings-outline" size={22} color={colors.gray[600]} />
            <Text style={{ color: colors.gray[600], fontWeight: "600", fontSize: 12, marginTop: 6 }}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account settings */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 16,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ padding: 16, paddingBottom: 8, fontSize: 12, fontWeight: "700", color: colors.gray[400], textTransform: "uppercase", letterSpacing: 0.5 }}>
            Account
          </Text>
          <SettingRow
            icon="person-outline"
            label="Edit Profile"
            onPress={() => setActiveSection(activeSection === "profile" ? null : "profile")}
          />

          {/* Edit profile form */}
          {activeSection === "profile" && (
            <View style={{ padding: 16, backgroundColor: colors.gray[50], borderTopWidth: 1, borderTopColor: colors.gray[100] }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray[600], marginBottom: 6 }}>Full Name</Text>
              <TextInput
                value={profileData.name}
                onChangeText={(t) => setProfileData({ ...profileData, name: t })}
                style={{
                  borderWidth: 1.5,
                  borderColor: colors.gray[200],
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 14,
                  color: colors.gray[900],
                  backgroundColor: colors.white,
                  marginBottom: 12,
                }}
              />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray[600], marginBottom: 6 }}>Email</Text>
              <TextInput
                value={profileData.email}
                onChangeText={(t) => setProfileData({ ...profileData, email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  borderWidth: 1.5,
                  borderColor: colors.gray[200],
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 14,
                  color: colors.gray[900],
                  backgroundColor: colors.white,
                  marginBottom: 16,
                }}
              />
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={savingProfile}
                style={{
                  backgroundColor: savingProfile ? colors.gray[300] : colors.primary,
                  borderRadius: 12,
                  padding: 13,
                  alignItems: "center",
                }}
              >
                {savingProfile ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={{ color: colors.white, fontWeight: "700" }}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <SettingRow
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => setActiveSection(activeSection === "password" ? null : "password")}
          />

          {/* Change password form */}
          {activeSection === "password" && (
            <View style={{ padding: 16, backgroundColor: colors.gray[50], borderTopWidth: 1, borderTopColor: colors.gray[100] }}>
              {["currentPassword", "newPassword", "confirmPassword"].map((field, i) => (
                <View key={field} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.gray[600], marginBottom: 6 }}>
                    {["Current Password", "New Password", "Confirm New Password"][i]}
                  </Text>
                  <TextInput
                    value={passwordData[field]}
                    onChangeText={(t) => setPasswordData({ ...passwordData, [field]: t })}
                    secureTextEntry
                    style={{
                      borderWidth: 1.5,
                      borderColor: colors.gray[200],
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 14,
                      color: colors.gray[900],
                      backgroundColor: colors.white,
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              ))}
              <TouchableOpacity
                onPress={handleSavePassword}
                disabled={savingPassword}
                style={{
                  backgroundColor: savingPassword ? colors.gray[300] : colors.primary,
                  borderRadius: 12,
                  padding: 13,
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                {savingPassword ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={{ color: colors.white, fontWeight: "700" }}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notifications */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 16,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ padding: 16, paddingBottom: 8, fontSize: 12, fontWeight: "700", color: colors.gray[400], textTransform: "uppercase", letterSpacing: 0.5 }}>
            Notifications
          </Text>
          {[
            { key: "bookingConfirmation", label: "Booking Confirmations" },
            { key: "eventReminders", label: "Event Reminders" },
            { key: "cancellations", label: "Cancellation Updates" },
            { key: "newEvents", label: "New Events Near You" },
          ].map((item) => (
            <View
              key={item.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.gray[50],
              }}
            >
              <Text style={{ flex: 1, fontSize: 15, color: colors.gray[800] }}>{item.label}</Text>
              <Switch
                value={notifications[item.key]}
                onValueChange={(val) => setNotifications({ ...notifications, [item.key]: val })}
                trackColor={{ false: colors.gray[200], true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </View>

        {/* Danger zone */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 16,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{ padding: 16, paddingBottom: 8, fontSize: 12, fontWeight: "700", color: colors.gray[400], textTransform: "uppercase", letterSpacing: 0.5 }}>
            Account Actions
          </Text>
          <SettingRow
            icon="log-out-outline"
            label="Logout"
            onPress={() => toast.confirm("Logout", "Are you sure you want to logout?", logout)}
          />
          <SettingRow
            icon="trash-outline"
            label="Delete Account"
            onPress={() => setDeleteModal(true)}
            danger
          />
        </View>

        {/* App info */}
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <Text style={{ color: colors.gray[400], fontSize: 12 }}>EventHub Mobile v1.0.0</Text>
          <Text style={{ color: colors.gray[300], fontSize: 11, marginTop: 4 }}>eventhubpk.vercel.app</Text>
        </View>
      </ScrollView>

      {/* Delete account modal */}
      <Modal
        visible={deleteModal}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: colors.white, borderRadius: 24, padding: 24 }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#fef2f2",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}>
              <Ionicons name="trash-outline" size={28} color={colors.error} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900], marginBottom: 8 }}>
              Delete Account
            </Text>
            <Text style={{ color: colors.gray[500], fontSize: 14, marginBottom: 16, lineHeight: 22 }}>
              This will permanently delete your account and all data. Type your email to confirm:
            </Text>
            <Text style={{ color: colors.gray[700], fontWeight: "600", marginBottom: 8 }}>{user?.email}</Text>
            <TextInput
              value={deleteConfirm}
              onChangeText={setDeleteConfirm}
              placeholder="Type your email"
              placeholderTextColor={colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1.5,
                borderColor: colors.gray[200],
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: colors.gray[900],
                marginBottom: 20,
              }}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => { setDeleteModal(false); setDeleteConfirm(""); }}
                style={{ flex: 1, borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: 14, padding: 14, alignItems: "center" }}
              >
                <Text style={{ color: colors.gray[700], fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleting}
                style={{ flex: 1, backgroundColor: deleting ? colors.gray[300] : colors.error, borderRadius: 14, padding: 14, alignItems: "center" }}
              >
                {deleting ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={{ color: colors.white, fontWeight: "700" }}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}