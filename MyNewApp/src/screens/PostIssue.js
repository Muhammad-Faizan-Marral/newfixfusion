import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "@env";

const { width } = Dimensions.get('window');

export default function PostIssue({ navigation }) {
  const { user } = useContext(AuthContext);
  const [problem, setProblem] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Keyboard ko dismiss karo pehle
    Keyboard.dismiss();
    
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Please allow access to your gallery to upload image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    // Keyboard ko dismiss karo
    Keyboard.dismiss();
    
    if (!problem) return Alert.alert("Error", "Please describe the issue.");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("issue", problem);

      if (image) {
        const localUri = image.uri;
        const filename = localUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("image", {
          uri: localUri,
          name: filename,
          type,
        });
      }

      const res = await axios.post(
        `http://192.333.33.237:5000/api/customer/issue`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Alert.alert("Success", "Issue posted successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Post Issue Error:", err.message);
      Alert.alert("Error", "Failed to post issue.");
    } finally {
      setLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>
                <Text style={styles.headerIcon}>🔧</Text>
              </View>
              <Text style={styles.heading}>Report an Issue</Text>
              <Text style={styles.subheading}>
                Tell us what's wrong with your device and we'll help you fix it
              </Text>
            </View>

            {/* Issue Description Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Describe the Problem</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="e.g., Battery draining quickly, screen is cracked, phone won't turn on..."
                  placeholderTextColor="#9CA3AF"
                  value={problem}
                  onChangeText={setProblem}
                  style={styles.input}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </View>
            </View>

            {/* Image Upload Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Photo (Optional)</Text>
              <TouchableOpacity 
                style={[
                  styles.imageButton, 
                  image && styles.imageButtonWithImage
                ]} 
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <View style={styles.imageButtonContent}>
                  <Text style={styles.imageButtonIcon}>📷</Text>
                  <Text style={styles.imageButtonText}>
                    {image ? "Change Photo" : "Upload Photo"}
                  </Text>
                  <Text style={styles.imageButtonSubtext}>
                    {image ? "Tap to select a different photo" : "Help us understand the issue better"}
                  </Text>
                </View>
              </TouchableOpacity>

              {image && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setImage(null)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonLoading,
                !problem && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading || !problem}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.loadingText}>Submitting...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Submit Issue Report</Text>
              )}
            </TouchableOpacity>

            {/* Help Text */}
            <Text style={styles.helpText}>
              Our support team will review your issue and get back to you within 24 hours.
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerIcon: {
    fontSize: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#374151',
    textAlignVertical: 'top',
    minHeight: 120,
    lineHeight: 22,
  },
  imageButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageButtonWithImage: {
    borderColor: '#3B82F6',
    borderStyle: 'solid',
  },
  imageButtonContent: {
    alignItems: 'center',
  },
  imageButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  imageButtonSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  imagePreviewContainer: {
    marginTop: 16,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  submitButtonLoading: {
    backgroundColor: '#6B7280',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});