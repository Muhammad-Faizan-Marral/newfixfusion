import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useFocusEffect } from '@react-navigation/native';

const BASE_URL = "http://192.168.43.237:5000/api";

export default function UserDashboard({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get correct image URL
  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    const baseUrlWithoutApi = BASE_URL.replace("/api", "");
    return `${baseUrlWithoutApi}/uploads/${imageName}`;
  };

  const fetchIssues = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await axios.get(
        `http://192.168.43.237:5000/api/customer/issues/${user.id}`
      );
      setIssues(res.data);
      console.log("Fetched issues:", res.data);
    } catch (err) {
      console.error("Fetch Issues Error:", err.message);
      Alert.alert("Error", "Failed to fetch issues.");
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh functionality
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIssues();
    setRefreshing(false);
  };

  const deleteIssue = async (issue_id) => {
    Alert.alert(
      "Delete Issue",
      "Are you sure you want to delete this issue?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(
                `http://192.333.33.237:5000/api/customer/issue/${issue_id}`,
                {
                  data: { user_id: user.id },
                }
              );
              console.log("Deleted issue:", issue_id);
              Alert.alert("Success", "Issue has been deleted successfully.");
              fetchIssues(); // Refresh the list after deletion
            } catch (err) {
              Alert.alert(
                "Delete Error",
                err?.response?.data?.message || "Failed to delete issue."
              );
            }
          }
        }
      ]
    );
  };

 // In your UserDashboard component, update the renderItem function:

const renderItem = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.issueText}>{item.problem || item.issue}</Text>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status || 'Active'}</Text>
      </View>
    </View>
    
    {/* Image Display */}
    {item.image && (
      <Image
        source={{ uri: getImageUrl(item.image) }}
        style={styles.issueImage}
        resizeMode="cover"
        onError={(error) => {
          console.log(
            "Image load error for:",
            item.image,
            error.nativeEvent.error
          );
        }}
        onLoad={() => {
          console.log("Image loaded successfully:", item.image);
        }}
      />
    )}
    
    <View style={styles.issueDetails}>
      <Text style={styles.issueDate}>
        📅 Posted: {new Date(item.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </Text>
    </View>
    
    <View style={styles.actions}>
      <TouchableOpacity
        style={styles.viewBidsButton}
        onPress={() =>
          navigation.navigate("ViewBids", {
            issue_id: item.id,
            customer_id: user.id,
            issue_description: item.problem || item.issue, // Add this line
          })
        }
      >
        <Text style={styles.viewBidsText}>View Bids</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteIssue(item.id)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#E8F5E8';
      case 'in progress':
        return '#FFF3E0';
      case 'Issue':
        return '#E3F2FD';
      default:
        return '#F0F4F8';
    }
  };

  // Use useFocusEffect to refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchIssues();
    }, [user?.id])
  );

  useEffect(() => {
    fetchIssues();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={logout} style={styles.logoutWrapper}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>👋 Welcome back, {user?.name}!</Text>
        <Text style={styles.subHeading}>Manage your service requests</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading your issues...</Text>
        </View>
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No issues posted yet</Text>
              <Text style={styles.emptySubText}>
                Create your first service request to get started!
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            issues.length === 0 ? { flex: 1 } : { paddingBottom: 100 }
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("PostIssue")}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingTop: 60,
    position: "relative",
  },
  header: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  logoutWrapper: {
    alignSelf: "flex-end",
    marginBottom: 15,
  },
  logout: {
    fontSize: 15,
    color: "#E53E3E",
    fontWeight: "600",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FED7D7",
    borderRadius: 12,
    overflow: 'hidden',
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A202C",
    marginBottom: 5,
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 16,
    color: "#718096",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F7FAFC",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  issueText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    display:"none",
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
    textTransform: 'capitalize',
  },
  // Added image styles
  issueImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginVertical: 12,
    backgroundColor: '#F7FAFC',
  },
  issueDetails: {
    marginBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F7FAFC",
  },
  issueDate: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    gap: 12,
  },
  viewBidsButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#EBF8FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#90CDF4",
  },
  viewBidsText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2B6CB0",
    textAlign: 'center',
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FED7D7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  deleteText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#C53030",
    textAlign: 'center',
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 25,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#38A169",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "300",
    marginBottom: 2,
  },
});