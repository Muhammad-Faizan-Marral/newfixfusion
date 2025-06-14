import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "@env";

export default function OtpScreen({ route, navigation }) {
  const { email, role } = route.params;
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp) return Alert.alert("Error", "Enter OTP");

    try {
      setLoading(true);
      const res = await axios.post(`http://192.333.33.237:5000/api/auth/verify-otp`, {
        email,
        otp,
        role,
      });

      setLoading(false);
      Alert.alert("Verified!", "Now you can login");
      navigation.navigate("Login");
    } catch (err) {
      setLoading(false);
      Alert.alert("OTP Failed", err?.response?.data?.message || "Server error");
    }
  };

  return (
    <LinearGradient colors={["#1e3c72", "#2a5298"]} style={styles.gradient}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.heading}>Enter OTP sent to</Text>
            <Text style={styles.subHeading}>{email}</Text>

            <TextInput
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor="#aaa"
              maxLength={6}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    padding: 24,
    justifyContent: "center",
    flexGrow: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 16,
    color: "#ddd",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 14,
    color: "#fff",
    marginBottom: 25,
    textAlign: "center",
    fontSize: 20,
    letterSpacing: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  button: {
    backgroundColor: "#00C853",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
});
