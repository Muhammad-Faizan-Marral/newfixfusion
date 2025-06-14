import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const BASE_URL = "http://192.333.33.237:5000/api";

export default function TechnicianDashboard({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  // State for issues and loading
  const [allIssues, setAllIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // State for bid modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [message, setMessage] = useState("");
  const [cost, setCost] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");

  // State for my bids and accepted jobs
  const [myBids, setMyBids] = useState([]);
  const [acceptedJobs, setAcceptedJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("available");

  // Fetch all available issues
  const fetchAllIssues = async () => {
    try {
      setLoading(true);
      console.log("Fetching all issues...");

      const response = await axios.get(`${BASE_URL}/customer/issues/all`);
      console.log("Raw Issues Response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        console.log("Issues fetched:", response.data.length);
        const validIssues = response.data.filter(
          (issue) => issue.id && (issue.issue || issue.problem) && issue.user_id
        );
        console.log("Valid issues:", validIssues.length);
        setAllIssues(validIssues);
      } else {
        console.log("No issues found or invalid response");
        setAllIssues([]);
      }
    } catch (err) {
      console.error("Fetch Issues Error:", err.response?.data || err.message);
      if (err.response?.status !== 404) {
        Alert.alert("Error", "Failed to fetch available issues");
      }
      setAllIssues([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch technician's bids
  const fetchMyBids = async () => {
    if (!user?.id) {
      console.log("User ID not available for fetching bids");
      return;
    }

    try {
      console.log("Fetching my bids for technician:", user.id);
      const technicianBids = [];

      // Only fetch bids if we have issues to check
      if (allIssues.length === 0) {
        console.log("No issues available to fetch bids for");
        setMyBids([]);
        return;
      }

      const bidPromises = allIssues.map(async (issue) => {
        try {
          const response = await axios.get(`${BASE_URL}/bid/${issue.id}`);
          if (response.data && Array.isArray(response.data)) {
            const myBidsForIssue = response.data.filter(
              (bid) => bid.technician_id === user.id
            );
            return myBidsForIssue.map((bid) => ({
              ...bid,
              issue: issue,
            }));
          }
          return [];
        } catch (err) {
          console.log(`No bids found for issue ${issue.id}`);
          return [];
        }
      });

      const bidResults = await Promise.all(bidPromises);
      const flattenedBids = bidResults.flat();

      console.log("My bids fetched:", flattenedBids.length);
      setMyBids(flattenedBids);
    } catch (err) {
      console.error("Fetch My Bids Error:", err);
      setMyBids([]);
    }
  };

  // Fetch accepted jobs where technician can chat with customers
  const fetchAcceptedJobs = async () => {
    if (!user?.id) {
      console.log("User ID not available for fetching accepted jobs");
      return;
    }

    try {
      console.log("Fetching accepted jobs for technician:", user.id);

      const response = await axios.get(`${BASE_URL}/job/technician/${user.id}`);

      if (response.data && Array.isArray(response.data)) {
        console.log("Accepted jobs fetched:", response.data.length);
        setAcceptedJobs(response.data);
      } else {
        console.log("No accepted jobs found");
        setAcceptedJobs([]);
      }
    } catch (err) {
      console.error(
        "Fetch Accepted Jobs Error:",
        err.response?.data || err.message
      );
      setAcceptedJobs([]);
    }
  };

  // Comprehensive refresh function
  const refreshAllData = async () => {
    console.log("Refreshing all data...");
    await fetchAllIssues();
    await fetchAcceptedJobs();
    // Fetch bids after issues are loaded
    if (allIssues.length > 0) {
      await fetchMyBids();
    }
  };

  // Use useFocusEffect to refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshAllData();
    }, [user?.id])
  );

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      refreshAllData();
    }
  }, [user]);

  // Fetch bids when issues are updated
  useEffect(() => {
    if (allIssues.length > 0 && user?.id) {
      fetchMyBids();
    }
  }, [allIssues, user]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAllData();
    setRefreshing(false);
  };

  // Open bid modal with issue details
  const openBidModal = (issue) => {
    if (!issue || !issue.id) {
      Alert.alert("Error", "Invalid issue selected");
      return;
    }
    setSelectedIssue(issue);
    setModalVisible(true);
    setMessage("");
    setCost("");
    setEstimatedTime("");
  };

  // Close modal and reset form
  const closeModal = () => {
    setModalVisible(false);
    setSelectedIssue(null);
    setMessage("");
    setCost("");
    setEstimatedTime("");
  };

  // Send bid to customer
  const sendBid = async () => {
    if (!message.trim() || !cost.trim() || !estimatedTime.trim()) {
      return Alert.alert("Error", "Please fill all fields.");
    }

    if (isNaN(cost) || parseFloat(cost) <= 0) {
      return Alert.alert("Error", "Please enter a valid cost.");
    }

    if (!selectedIssue?.id || !user?.id) {
      return Alert.alert("Error", "Missing required information.");
    }

    try {
      console.log("Sending bid...");
      const bidData = {
        request_id: selectedIssue.id,
        technician_id: user.id,
        price: parseFloat(cost),
        estimated_time: estimatedTime.trim(),
        message: message.trim(),
      };

      console.log("Bid data:", bidData);

      const response = await axios.post(`${BASE_URL}/bid`, bidData);

      if (response.data) {
        console.log("Bid sent successfully:", response.data);
        Alert.alert("Success", "Bid sent successfully!");
        closeModal();
        // Refresh data after sending bid
        await fetchMyBids();
      }
    } catch (err) {
      console.error("Bid Error:", err.response?.data || err.message);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to send bid. Please try again."
      );
    }
  };

  // Open chat with customer
  const openChat = (customerId) => {
    if (!customerId || !user?.id) {
      Alert.alert("Error", "Cannot open chat. Missing user information.");
      return;
    }

    console.log("Opening chat with customer:", customerId);
    navigation.navigate("ChatScreen", {
      userId: user.id,
      technicianId: customerId,
    });
  };

  // Check if technician already bid on this issue
  const hasAlreadyBid = (issueId) => {
    return myBids.some((bid) => bid.request_id === issueId);
  };

  // Get correct image URL
  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    const baseUrlWithoutApi = BASE_URL.replace("/api", "");
    return `${baseUrlWithoutApi}/uploads/${imageName}`;
  };

  // Format date helper
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Format datetime helper
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Render available issue item
  const renderIssueItem = ({ item }) => {
    if (!item || !item.id) {
      return null;
    }

    const issueText = item.issue || item.problem || "No description available";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.issueTitle}>📱 Issue #{item.id}</Text>
          <Text style={styles.issueDate}>{formatDate(item.created_at)}</Text>
        </View>

        <Text style={styles.problem}>{issueText}</Text>

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
          <Text style={styles.customerInfo}>
            👤 Customer ID: {item.user_id}
          </Text>
          <Text style={styles.customerInfo}>
            📅 Posted: {formatDate(item.created_at)}
          </Text>
        </View>

        {hasAlreadyBid(item.id) ? (
          <View style={styles.bidSentContainer}>
            <Text style={styles.bidSentText}>✅ Bid Already Sent</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.bidButton}
            onPress={() => openBidModal(item)}
          >
            <Text style={styles.buttonText}>🎯 Send Bid</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render bid item
  const renderBidItem = ({ item }) => {
    if (!item || !item.request_id) {
      return null;
    }

    return (
      <View style={styles.bidCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.issueTitle}>📱 Issue #{item.request_id}</Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>Rs. {item.price}</Text>
          </View>
        </View>

        <Text style={styles.problem}>
          {item.issue?.issue ||
            item.issue?.problem ||
            "Issue details not available"}
        </Text>
        <Text style={styles.bidMessage}>💬 "{item.message}"</Text>
        <Text style={styles.estimatedTime}>⏱ Time: {item.estimated_time}</Text>

        <Text style={styles.bidDate}>
          Sent: {formatDateTime(item.created_at)}
        </Text>
      </View>
    );
  };

  // Render accepted job item with chat functionality
  const renderAcceptedJobItem = ({ item }) => {
    if (!item || !item.id) {
      return null;
    }

    return (
      <View style={styles.jobCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.issueTitle}>🔧 Job #{item.id}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status || "Active"}</Text>
          </View>
        </View>

        <Text style={styles.problem}>
          {item.issue || item.request?.issue || "Job details not available"}
        </Text>

        <View style={styles.jobDetails}>
          <Text style={styles.customerInfo}>
            👤 Customer ID: {item.customer_id}
          </Text>
          <Text style={styles.customerInfo}>
            💰 Price: Rs. {item.price || "N/A"}
          </Text>
          <Text style={styles.customerInfo}>
            📅 Started: {formatDate(item.created_at)}
          </Text>
        </View>

        <View style={styles.jobActions}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => openChat(item.customer_id)}
          >
            <Text style={styles.buttonText}>💬 Chat with Customer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Get current tab data
  const getCurrentTabData = () => {
    switch (activeTab) {
      case "available":
        return allIssues;
      case "myBids":
        return myBids;
      case "acceptedJobs":
        return acceptedJobs;
      default:
        return [];
    }
  };

  // Get current render function
  const getCurrentRenderFunction = () => {
    switch (activeTab) {
      case "available":
        return renderIssueItem;
      case "myBids":
        return renderBidItem;
      case "acceptedJobs":
        return renderAcceptedJobItem;
      default:
        return renderIssueItem;
    }
  };

  const redrictToprofile = () => {
    navigation.navigate("TechnicianProfileSetup");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={redrictToprofile}
        style={styles.redirectToProfile}
      >
        <Text style={styles.profileText}>Technician Profile</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>
          Welcome, {user?.name || "Technician"}
        </Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "available" && styles.activeTab]}
          onPress={() => setActiveTab("available")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "available" && styles.activeTabText,
            ]}
          >
            Available ({allIssues.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "myBids" && styles.activeTab]}
          onPress={() => setActiveTab("myBids")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "myBids" && styles.activeTabText,
            ]}
          >
            My Bids ({myBids.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "acceptedJobs" && styles.activeTab]}
          onPress={() => setActiveTab("acceptedJobs")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "acceptedJobs" && styles.activeTabText,
            ]}
          >
            My Jobs ({acceptedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={getCurrentTabData()}
          keyExtractor={(item, index) => {
            const baseId = item.id || item.request_id || index;
            return `${activeTab}-${baseId}-${index}`;
          }}
          renderItem={getCurrentRenderFunction()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === "available" && "No available issues right now."}
                {activeTab === "myBids" && "No bids sent yet."}
                {activeTab === "acceptedJobs" && "No accepted jobs yet."}
              </Text>
              <Text style={styles.emptySubText}>
                {activeTab === "available" &&
                  "Pull down to refresh and check for new issues!"}
                {activeTab === "myBids" &&
                  "Go to Available tab to send your first bid!"}
                {activeTab === "acceptedJobs" &&
                  "Your accepted jobs will appear here."}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4CAF50"]}
              tintColor="#4CAF50"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            getCurrentTabData().length === 0
              ? { flex: 1 }
              : { paddingBottom: 20 }
          }
        />
      )}

      {/* Bid Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎯 Send Bid</Text>

            {selectedIssue && (
              <View style={styles.selectedIssueInfo}>
                <Text style={styles.selectedIssueText}>
                  Issue: {selectedIssue.issue || selectedIssue.problem}
                </Text>
              </View>
            )}

            <TextInput
              placeholder="Your message to the customer..."
              value={message}
              onChangeText={setMessage}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
            />
            <TextInput
              placeholder="Cost (Rs.)"
              value={cost}
              onChangeText={setCost}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Estimated Time (e.g., 2 hours, 1 day)"
              value={estimatedTime}
              onChangeText={setEstimatedTime}
              style={styles.input}
            />

            <TouchableOpacity style={styles.submitButton} onPress={sendBid}>
              <Text style={styles.buttonText}>Submit Bid</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C3E50",
    flex: 1,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FDECEA",
    borderRadius: 8,
  },
  logout: {
    fontSize: 14,
    color: "#E74C3C",
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#4CAF50",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bidCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#3498DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#27AE60",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C3E50",
  },
  issueDate: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  problem: {
    fontSize: 15,
    color: "#34495E",
    lineHeight: 20,
    marginBottom: 12,
  },
  issueImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
  issueDetails: {
    marginBottom: 15,
  },
  customerInfo: {
    fontSize: 13,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  bidSentContainer: {
    backgroundColor: "#D5FFDF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  bidSentText: {
    color: "#27AE60",
    fontWeight: "600",
    fontSize: 14,
  },
  bidButton: {
    backgroundColor: "#3498DB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  chatButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  bidMessage: {
    fontSize: 14,
    color: "#2C3E50",
    fontStyle: "italic",
    marginBottom: 8,
    backgroundColor: "#F8F9FA",
    padding: 10,
    borderRadius: 6,
  },
  estimatedTime: {
    fontSize: 14,
    color: "#E67E22",
    fontWeight: "500",
    marginBottom: 8,
  },
  bidDate: {
    fontSize: 12,
    color: "#95A5A6",
    textAlign: "right",
  },
  priceBadge: {
    backgroundColor: "#3498DB",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  statusBadge: {
    backgroundColor: "#27AE60",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  jobDetails: {
    marginBottom: 15,
  },
  jobActions: {
    flexDirection: "row",
    justifyContent: "center",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    margin: 20,
    width: width - 40,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C3E50",
    textAlign: "center",
    marginBottom: 20,
  },
  selectedIssueInfo: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#3498DB",
  },
  selectedIssueText: {
    fontSize: 14,
    color: "#2C3E50",
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#F8F9FA",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#3498DB",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: "#E5E5E5",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
redirectToProfile: {
  backgroundColor: '#ffea00', // Soft yellow
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  paddingHorizontal: 25,
  borderRadius: 12,
  marginTop: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 4,
},

profileText: {
  fontSize: 18,
  color: '#0d6efd',
  fontFamily: 'System',
  fontWeight: '600',
  letterSpacing: 0.5,
},

});
