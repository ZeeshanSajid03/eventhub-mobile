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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../constants/colors";
import { images } from "../../constants/images";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function validate() {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    return newErrors;
  }

  async function handleLogin() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError("");
    try {
      await login(formData.email, formData.password);
      router.replace("/(tabs)");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
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
        <View style={{ paddingTop: 80, paddingBottom: 40, alignItems: "center" }}>
          <Image
            source={images.logo}
            style={{ width: 80, height: 80, marginBottom: 16 }}
            resizeMode="contain"
          />
          <Text style={{ color: colors.white, fontSize: 28, fontWeight: "bold" }}>
            Welcome back
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, marginTop: 6 }}>
            Sign in to your EventHub account
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
          {/* Server error */}
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

          {/* Email */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.gray[700], marginBottom: 6 }}>
              Email
            </Text>
            <TextInput
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                setErrors({ ...errors, email: "" });
                setServerError("");
              }}
              placeholder="you@example.com"
              placeholderTextColor={colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1.5,
                borderColor: errors.email ? colors.error : colors.gray[200],
                borderRadius: 12,
                padding: 14,
                fontSize: 15,
                color: colors.gray[900],
                backgroundColor: colors.gray[50],
              }}
            />
            {errors.email ? (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
                {errors.email}
              </Text>
            ) : null}
          </View>

          {/* Password */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.gray[700], marginBottom: 6 }}>
              Password
            </Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({ ...formData, password: text });
                  setErrors({ ...errors, password: "" });
                  setServerError("");
                }}
                placeholder="••••••••"
                placeholderTextColor={colors.gray[400]}
                secureTextEntry={!showPassword}
                style={{
                  borderWidth: 1.5,
                  borderColor: errors.password ? colors.error : colors.gray[200],
                  borderRadius: 12,
                  padding: 14,
                  paddingRight: 50,
                  fontSize: 15,
                  color: colors.gray[900],
                  backgroundColor: colors.gray[50],
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: 14,
                }}
              >
                <Text style={{ color: colors.gray[400], fontSize: 13 }}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
                {errors.password}
              </Text>
            ) : null}
          </View>

          {/* Login button */}
          <TouchableOpacity
            onPress={handleLogin}
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
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Text style={{ color: colors.gray[500], fontSize: 14 }}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}