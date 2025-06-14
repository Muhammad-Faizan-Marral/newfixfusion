import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";

export default function RatingScreen({ route, navigation }) {
  const { job_id, technician_id, customer_id } = route.params;
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }
    else{
    navigation.navigate("UserDashboard");
    }

    try {
      setLoading(true);
      
      console.log('Submitting rating with data:', {
        technician_id,
        customer_id,
        rating,
        comment: comment.trim(),
      });
      
      // Submit rating
      const ratingResponse = await axios.post("http://192.333.33.237:5000/api/rating/", {
        technician_id: parseInt(technician_id),
        customer_id: parseInt(customer_id),
        rating: parseInt(rating),
        comment: comment.trim() || null,
      });

      console.log('Rating submitted successfully:', ratingResponse.data);

      // Delete/complete the job to remove it from dashboards
      const jobResponse = await axios.put(`http://192.333.33.237:5000/api/job/complete/${job_id}`, {
        status: "completed_rated",
      });

      console.log('Job completed successfully:', jobResponse.data);

      Alert.alert(
        "Success",
        "Thank you for your rating!",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to customer dashboard
              navigation.reset({
                index: 0,
                routes: [{ name: "CustomerDashboard" }],
              });
            },
          },
        ]
      );
    } catch (err) {
      console.error("Rating Error Details:", err);
      console.error("Error Response:", err.response?.data);
      console.error("Error Status:", err.response?.status);
      
      let errorMessage = "Thanks for rating or you can also delete this issue ";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      Alert.alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.star}
        >
          <Text style={[styles.starText, rating >= i && styles.selectedStar]}>
            ⭐
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>⭐ Rate the Technician</Text>
      
      <Text style={styles.label}>How was your experience?</Text>
      
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      
      <Text style={styles.ratingText}>
        {rating > 0 ? `${rating} out of 5 stars` : "Select rating"}
      </Text>

      <Text style={styles.label}>Comments (Optional)</Text>
      <TextInput
        style={styles.commentInput}
        placeholder="Share your experience..."
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={submitRating}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Submit Rating</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  star: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  starText: {
    fontSize: 40,
    opacity: 0.3,
  },
  selectedStar: {
    opacity: 1,
  },
  ratingText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: "white",
    marginBottom: 30,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#f44336",
    padding: 15,
    borderRadius: 8,
  },
  cancelText: {
    color: "#f44336",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});
