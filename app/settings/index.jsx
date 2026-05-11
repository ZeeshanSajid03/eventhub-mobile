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

export default function SettingsScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeSection, setActiveSection] = useState(null);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
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
    marketing: false,
  });

  async function handleSaveProfile() {
    if (!profileData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSavingProfile(true);
    try {
      await userAPI.updateProfile({
        name: profileData.name,
        email: profileData.email,
      });
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
    if (!passwordData.currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (!passwordData.newPassword) {
      toast.error("New password is required");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      await userAPI.updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setActiveSection(null);
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
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

  function SectionHeader({ title }) {
    return (
      <Text style={{
        padding: 16,
        paddingBottom: 8,
        fontSize: 12,
        fontWeight: "700",
        color: colors.gray[400],
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}>
        {title}
      </Text>
    );
  }

  function SettingRow({ icon, label, onPress, danger, rightElement, subtitle }) {
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
          <Ionicons
            name={icon}
            size={18}
            color={danger ? colors.error : colors.gray[600]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 15,
            fontWeight: "500",
            color: danger ? colors.error : colors.gray[800],
          }}>
            {label}
          </Text>
          {subtitle && (
            <Text style={{ fontSize: 12, color: colors.gray[400], marginTop: 2 }}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightElement || (
          <Ionicons name="chevron-forward" size={16} color={colors.gray[300]} />
        )}
      </TouchableOpacity>
    );
  }

  function InputField({ label, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize }) {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{
          fontSize: 13,
          fontWeight: "600",
          color: colors.gray[600],
          marginBottom: 6,
        }}>
          {label}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || "default"}
          autoCapitalize={autoCapitalize || "sentences"}
          style={{
            borderWidth: 1.5,
            borderColor: colors.gray[200],
            borderRadius: 10,
            padding: 12,
            fontSize: 14,
            color: colors.gray[900],
            backgroundColor: colors.white,
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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.gray[900] }}>
          Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >

        {/* Profile section */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          marginHorizontal: 16,
          marginTop: 16,
          marginBottom: 14,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <SectionHeader title="Profile" />

          <SettingRow
            icon="person-outline"
            label="Edit Profile"
            subtitle="Update your name and email"
            onPress={() =>
              setActiveSection(activeSection === "profile" ? null : "profile")
            }
          />

          {activeSection === "profile" && (
            <View style={{
              padding: 16,
              backgroundColor: colors.gray[50],
              borderTopWidth: 1,
              borderTopColor: colors.gray[100],
            }}>
              <InputField
                label="Full Name"
                value={profileData.name}
                onChangeText={(t) => setProfileData({ ...profileData, name: t })}
              />
              <InputField
                label="Email"
                value={profileData.email}
                onChangeText={(t) => setProfileData({ ...profileData, email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={savingProfile}
                style={{
                  backgroundColor: savingProfile ? colors.gray[300] : colors.primary,
                  borderRadius: 12,
                  padding: 13,
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                {savingProfile ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={{ color: colors.white, fontWeight: "700" }}>
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <SettingRow
            icon="lock-closed-outline"
            label="Change Password"
            subtitle="Update your account password"
            onPress={() =>
              setActiveSection(activeSection === "password" ? null : "password")
            }
          />

          {activeSection === "password" && (
            <View style={{
              padding: 16,
              backgroundColor: colors.gray[50],
              borderTopWidth: 1,
              borderTopColor: colors.gray[100],
            }}>
              <InputField
                label="Current Password"
                value={passwordData.currentPassword}
                onChangeText={(t) =>
                  setPasswordData({ ...passwordData, currentPassword: t })
                }
                secureTextEntry
                autoCapitalize="none"
              />
              <InputField
                label="New Password"
                value={passwordData.newPassword}
                onChangeText={(t) =>
                  setPasswordData({ ...passwordData, newPassword: t })
                }
                secureTextEntry
                autoCapitalize="none"
              />
              <InputField
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChangeText={(t) =>
                  setPasswordData({ ...passwordData, confirmPassword: t })
                }
                secureTextEntry
                autoCapitalize="none"
              />
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
                  <Text style={{ color: colors.white, fontWeight: "700" }}>
                    Update Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notifications section */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 14,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <SectionHeader title="Notifications" />

          {[
            { key: "bookingConfirmation", label: "Booking Confirmations", subtitle: "Get notified when you book a ticket" },
            { key: "eventReminders", label: "Event Reminders", subtitle: "Reminders before your events" },
            { key: "cancellations", label: "Cancellation Updates", subtitle: "When an event you booked is cancelled" },
            { key: "newEvents", label: "New Events", subtitle: "Discover new events in your city" },
            { key: "marketing", label: "Promotional Emails", subtitle: "Special offers and announcements" },
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
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, color: colors.gray[800], fontWeight: "500" }}>
                  {item.label}
                </Text>
                <Text style={{ fontSize: 12, color: colors.gray[400], marginTop: 2 }}>
                  {item.subtitle}
                </Text>
              </View>
              <Switch
                value={notifications[item.key]}
                onValueChange={(val) =>
                  setNotifications({ ...notifications, [item.key]: val })
                }
                trackColor={{ false: colors.gray[200], true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </View>

        {/* Appearance section */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 14,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <SectionHeader title="Appearance" />
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            subtitle="Coming soon"
            onPress={() => toast.info("Dark mode coming soon!")}
            rightElement={
              <View style={{
                backgroundColor: colors.gray[100],
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}>
                <Text style={{ fontSize: 11, color: colors.gray[400], fontWeight: "600" }}>
                  Soon
                </Text>
              </View>
            }
          />
          <SettingRow
            icon="language-outline"
            label="Language"
            subtitle="English"
            onPress={() => toast.info("Language support coming soon!")}
          />
        </View>

        {/* About section */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 14,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <SectionHeader title="About" />
          <SettingRow
            icon="globe-outline"
            label="Website"
            subtitle="eventhubpk.vercel.app"
            onPress={() => toast.info("eventhubpk.vercel.app")}
          />
          <SettingRow
            icon="information-circle-outline"
            label="App Version"
            subtitle="EventHub Mobile v1.0.0"
            onPress={() => {}}
            rightElement={
              <Text style={{ color: colors.gray[400], fontSize: 13 }}>1.0.0</Text>
            }
          />
        </View>

        {/* Danger zone */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 14,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <SectionHeader title="Account" />
          <SettingRow
            icon="log-out-outline"
            label="Logout"
            onPress={() =>
              toast.confirm(
                "Logout",
                "Are you sure you want to logout?",
                logout
              )
            }
          />
          <SettingRow
            icon="trash-outline"
            label="Delete Account"
            subtitle="Permanently delete your account"
            onPress={() => setDeleteModal(true)}
            danger
          />
        </View>
      </ScrollView>

      {/* Delete account modal */}
      <Modal
        visible={deleteModal}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 24,
        }}>
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
              <Ionicons name="trash-outline" size={28} color={colors.error} />
            </View>
            <Text style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.gray[900],
              marginBottom: 8,
            }}>
              Delete Account
            </Text>
            <Text style={{
              color: colors.gray[500],
              fontSize: 14,
              marginBottom: 16,
              lineHeight: 22,
            }}>
              This will permanently delete your account and all data. Type your
              email to confirm:
            </Text>
            <Text style={{
              color: colors.gray[700],
              fontWeight: "600",
              marginBottom: 8,
            }}>
              {user?.email}
            </Text>
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
                onPress={() => {
                  setDeleteModal(false);
                  setDeleteConfirm("");
                }}
                style={{
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: colors.gray[200],
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.gray[700], fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleting}
                style={{
                  flex: 1,
                  backgroundColor: deleting ? colors.gray[300] : colors.error,
                  borderRadius: 14,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                {deleting ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={{ color: colors.white, fontWeight: "700" }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}