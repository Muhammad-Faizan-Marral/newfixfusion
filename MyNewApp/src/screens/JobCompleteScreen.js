import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView 
} from "react-native";
import axios from "axios";

export default function JobCompleteScreen({ route, navigation }) {
  const { job } = route.params;

  const markComplete = async () => {
    // Show confirmation dialog first
    Alert.alert(
      "Confirm Job Completion",
      "Are you sure you want to mark this job as complete? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Yes, Complete",
          onPress: async () => {
            try {
              await axios.put(`http://192.333.33.337:5000/api/job/${job.id}/complete`, {
                status: "completed",
              });
              Alert.alert("Success", "Job marked as complete!");
            } catch (err) {
              console.log(err.message);
              // Alert.alert("Error", "Failed to mark job as complete, but you can still proceed to rating.");
            } finally {
              // Navigate to RatingScreen regardless of API success/failure
              navigation.replace("RatingScreen", {
                job_id: job.id,
                technician_id: job.technician_id,
                customer_id: job.customer_id,
              });
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.heading}>Job Completion</Text>
          <Text style={styles.subheading}>Review and complete this job</Text>
        </View>

        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobTitle}>Job Details</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>IN PROGRESS</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.labelIcon}>👨‍🔧</Text>
              <View style={styles.detailContent}>
                <Text style={styles.label}>Technician</Text>
                <Text style={styles.value}>{job.technician_name}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.labelIcon}>🔧</Text>
              <View style={styles.detailContent}>
                <Text style={styles.label}>Issue ID</Text>
                <Text style={styles.value}>#{job.issue}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.labelIcon}>📊</Text>
              <View style={styles.detailContent}>
                <Text style={styles.label}>Current Status</Text>
                <Text style={styles.value}>{job.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>📋 Before Completing</Text>
          <Text style={styles.instructionText}>
            Please ensure that:
          </Text>
          <Text style={styles.instructionItem}>• The work has been completed satisfactorily</Text>
          <Text style={styles.instructionItem}>• You have inspected the completed work</Text>
          <Text style={styles.instructionItem}>• Any questions have been addressed</Text>
        </View>

        <TouchableOpacity style={styles.completeButton} onPress={markComplete}>
          <Text style={styles.completeButtonText}>✅ Mark as Complete & Rate</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
  },
  heading: { 
    fontSize: 28, 
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  jobCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#f39c12",
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  statusBadge: {
    backgroundColor: "#fff3cd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#856404",
    fontSize: 12,
    fontWeight: "bold",
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
  },
  detailContent: {
    flex: 1,
  },
  label: { 
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  instructionCard: {
    backgroundColor: "#e8f4fd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#34495e",
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: "#34495e",
    marginLeft: 8,
    marginBottom: 4,
  },
  completeButton: {
    backgroundColor: "#27ae60",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#27ae60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completeButtonText: { 
    color: "white", 
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#ecf0f1",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  backButtonText: {
    color: "#7f8c8d",
    fontWeight: "600",
    fontSize: 14,
  },
});