import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../constants/colors";
import { images } from "../../constants/images";
import { Image } from "react-native";


export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function validate() {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  }

  async function handleRegister() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError("");
    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      router.replace("/(tabs)");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function Field({ label, field, placeholder, keyboardType, secureTextEntry, autoCapitalize }) {
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.gray[700], marginBottom: 6 }}>
          {label}
        </Text>
        <TextInput
          value={formData[field]}
          onChangeText={(text) => {
            setFormData({ ...formData, [field]: text });
            setErrors({ ...errors, [field]: "" });
            setServerError("");
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          keyboardType={keyboardType || "default"}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize={autoCapitalize || "sentences"}
          style={{
            borderWidth: 1.5,
            borderColor: errors[field] ? colors.error : colors.gray[200],
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: colors.gray[900],
            backgroundColor: colors.gray[50],
          }}
        />
        {errors[field] ? (
          <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
            {errors[field]}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.primary }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ paddingTop: 60, paddingBottom: 32, alignItems: "center" }}>
          <Image
            source={images.logo}
            style={{ width: 80, height: 80, marginBottom: 16 }}
            resizeMode="contain"
          />
          <Text style={{ color: colors.white, fontSize: 26, fontWeight: "bold" }}>
            Create account
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, marginTop: 6 }}>
            Join EventHub and start booking
          </Text>
        </View>

        {/* Form card */}
        <View style={{
          flex: 1,
          backgroundColor: colors.white,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: 28,
        }}>
          {serverError ? (
            <View style={{
              backgroundColor: "#fef2f2",
              borderWidth: 1,
              borderColor: "#fecaca",
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}>
              <Text style={{ color: colors.error, fontSize: 14 }}>{serverError}</Text>
            </View>
          ) : null}

          <Field label="Full Name" field="name" placeholder="Zeeshan Sajid" />
          <Field
            label="Email"
            field="email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            field="password"
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />
          <Field
            label="Confirm Password"
            field="confirmPassword"
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          {/* Show password toggle */}
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
          >
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: showPassword ? colors.primary : colors.gray[300],
              backgroundColor: showPassword ? colors.primary : colors.white,
              marginRight: 8,
              alignItems: "center",
              justifyContent: "center",
            }}>
              {showPassword && (
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: "bold" }}>✓</Text>
              )}
            </View>
            <Text style={{ color: colors.gray[600], fontSize: 14 }}>Show passwords</Text>
          </TouchableOpacity>

          {/* Role selector */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.gray[700], marginBottom: 10 }}>
              I want to
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setFormData({ ...formData, role: "user" })}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: formData.role === "user" ? colors.primary : colors.gray[200],
                  backgroundColor: formData.role === "user" ? colors.primaryLight : colors.white,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>🎟️</Text>
                <Text style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: formData.role === "user" ? colors.primary : colors.gray[600],
                }}>
                  Book Events
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFormData({ ...formData, role: "organizer" })}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: formData.role === "organizer" ? colors.primary : colors.gray[200],
                  backgroundColor: formData.role === "organizer" ? colors.primaryLight : colors.white,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>🎪</Text>
                <Text style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: formData.role === "organizer" ? colors.primary : colors.gray[600],
                }}>
                  Organize Events
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Register button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={{
              backgroundColor: loading ? colors.gray[300] : colors.primary,
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: "700" }}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Text style={{ color: colors.gray[500], fontSize: 14 }}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}