import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from "react-native";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "@env";

export default function TechnicianProfileSetup({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectToRating = () => {
  navigation.navigate("ViewTechnicianProfile", { technicianId: user.id });
};

  const handleSave = async () => {
    console.log("Save button pressed");
    console.log("User context:", user);
    
    if (!bio || !skills || !location || !availability) {
      return Alert.alert("Error", "Please fill all fields.");
    }

    setLoading(true);
    try {
      const payload = {
        technician_id: user.id,
        bio,
        location,
        availability,
        skills: skills.split(",").map((skill) => skill.trim()),
      };

      console.log("Sending payload:", payload);
      
      // Use API_BASE_URL if available, otherwise fallback to hardcoded URL
      const baseUrl = "http://192.333.33.237:5000" || "http://192.333.33.237:5000";
      const response = await axios.post(
        `${baseUrl}/api/technician/profile`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Profile saved successfully:", response.data);
      Alert.alert("Success", "Profile updated successfully!");
      navigation.navigate("TechnicianDashboard");
    } catch (err) {
      console.log("Profile error:", err.message);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={redirectToRating} style={styles.viewRatingButton}>
            <Text style={styles.viewRatingText}>View Rating</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.heading}> Setup Your Technician Profile</Text>
          <Text style={styles.subheading}>
            Complete your profile to start receiving repair requests
          </Text>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                placeholder="Tell customers about your expertise (e.g., I fix all iPhone models with 5+ years experience)"
                value={bio}
                onChangeText={setBio}
                style={[styles.input, styles.bioInput]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Skills</Text>
              <TextInput
                placeholder="Comma separated (e.g., screen repair, battery replacement, water damage)"
                value={skills}
                onChangeText={setSkills}
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                placeholder="Your service area (e.g., Lahore, Pakistan)"
                value={location}
                onChangeText={setLocation}
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Availability</Text>
              <TextInput
                placeholder="Your working hours (e.g., Mon-Fri, 10am - 6pm)"
                value={availability}
                onChangeText={setAvailability}
                style={styles.input}
              />
            </View>
          </View>

          {/* Save Button */}
          <Pressable 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "Save Profile"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f9fa",
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  viewRatingButton: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2196f3",
  },
  viewRatingText: {
    color: "#1976d2",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#ffebee",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f44336",
  },
  logoutText: {
    color: "#d32f2f",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#333",
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#4caf50",
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: "#4caf50",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#a5d6a7",
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
});