import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "@env";

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Fill all fields.");

    try {
      setLoading(true);
      const res = await axios.post(`http://192.333.33.237:5000/api/auth/login`, {
        email,
        password,
      });

      const user = res.data.user;

      if (!user.is_verified) {
        setLoading(false);
        return Alert.alert("Wait!", "Please verify your email first.");
      }

      if (user.role === "technician" && !user.is_approved) {
        setLoading(false);
        return Alert.alert(
          "Pending Approval",
          "Admin has not approved your profile yet."
        );
      }

      await AsyncStorage.setItem("user", JSON.stringify(user));
      login(user);
      setLoading(false);
      Alert.alert("Login Success", `Welcome ${user.name}`);
      navigation.replace(
        user.role === "technician" ? "TechnicianDashboard" : "UserDashboard"
      );
    } catch (err) {
      setLoading(false);
      console.log("LOGIN ERROR:", err.response?.data || err.message);
      Alert.alert(
        "Login Failed",
        err?.response?.data?.message || err.message || "Server error"
      );
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
            <Text style={styles.heading}>FixFusion Login</Text>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#aaa"
            />

            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#aaa"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.link} onPress={() => navigation.navigate("Signup")}>
              Don't have an account? Sign up
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
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    color: "#fff",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
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
