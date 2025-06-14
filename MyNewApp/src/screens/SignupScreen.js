import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "@env";

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) {
      return Alert.alert("Error", "Please fill all fields.");
    }

    try {
      setLoading(true);
      const res = await axios.post(`http://192.333.33.237:5000/api/auth/signup`, form);
      setLoading(false);
      Alert.alert("Success", "Check your email for OTP.");
      navigation.navigate("OtpScreen", { email: form.email, role: form.role });
    } catch (err) {
      setLoading(false);
      Alert.alert("Signup Failed", err?.response?.data?.message || "Server Error");
    }
  };

  return (
    <LinearGradient colors={["#0f2027", "#203a43", "#2c5364"]} style={styles.gradient}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.heading}>FixFusion Signup</Text>

            <TextInput
              placeholder="Full Name"
              value={form.name}
              onChangeText={(text) => handleChange("name", text)}
              style={styles.input}
              placeholderTextColor="#aaa"
            />

            <TextInput
              placeholder="Email"
              value={form.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
              style={styles.input}
              placeholderTextColor="#aaa"
            />

            <TextInput
              placeholder="Password"
              value={form.password}
              onChangeText={(text) => handleChange("password", text)}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#aaa"
            />

            <Text style={styles.label}>Select Role:</Text>

            <View style={styles.roleWrapper}>
              <TouchableOpacity onPress={() => handleChange("role", "user")}>
                <Text
                  style={
                    form.role === "user" ? styles.activeRole : styles.inactiveRole
                  }
                >
                  User
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleChange("role", "technician")}>
                <Text
                  style={
                    form.role === "technician"
                      ? styles.activeRole
                      : styles.inactiveRole
                  }
                >
                  Technician
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Signup</Text>
              )}
            </TouchableOpacity>

            <Text
              style={styles.link}
              onPress={() => navigation.navigate("Login")}
            >
              Already have an account? Login
            </Text>
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
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    marginBottom: 15,
    padding: 14,
    color: "#fff",
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "500",
    color: "#fff",
  },
  roleWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 25,
  },
  activeRole: {
    marginHorizontal: 12,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  inactiveRole: {
    marginHorizontal: 12,
    color: "#bbb",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: "#444",
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    textAlign: "center",
    marginTop: 20,
    color: "#90caf9",
    fontSize: 14,
  },
});
