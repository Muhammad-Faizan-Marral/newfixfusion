import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import axios from "axios";
import { API_BASE_URL } from "@env";

export default function ViewBids({ route, navigation }) {
  const { issue_id, customer_id, issue_description } = route.params;
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acceptedBidId, setAcceptedBidId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [mlRanking, setMlRanking] = useState(false);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://192.333.33.237:5000/api/bid/${issue_id}`
      );
      
      let fetchedBids = res.data;

      // Apply ML ranking if we have issue description and bids
      if (issue_description && fetchedBids.length > 0) {
        fetchedBids = await applyMLRanking(fetchedBids, issue_description);
      }

      setBids(fetchedBids);

      // Check if any bid is accepted and get job status
      const accepted = fetchedBids.find((bid) => bid.status === "accepted");
      if (accepted) {
        setAcceptedBidId(accepted.id);
        try {
          const jobRes = await axios.get(`http://192.168.43.237:5000/api/job/status/${issue_id}`);
          setJobStatus(jobRes.data.status);
        } catch (jobErr) {
          console.log("Job status fetch error:", jobErr.message);
        }
      }
    } catch (err) {
      console.error("Fetch Bids Error:", err.message);
      Alert.alert("Error", "Failed to load bids.");
    } finally {
      setLoading(false);
    }
  };

  const applyMLRanking = async (bids, issueDescription) => {
    try {
      setMlRanking(true);
      
      // Prepare technician profiles for ML using your existing API structure
      const technicianProfiles = await Promise.all(
        bids.map(async (bid) => {
          try {
            // Use your existing technician profile API
            const techRes = await axios.get(
              `http://192.168.43.237:5000/api/technician/${bid.technician_id}/profile`
            );
            
            const profile = techRes.data.profile;
            
            // Convert skills array to string for ML processing
            const skillsString = Array.isArray(profile.skills) 
              ? profile.skills.join(', ') 
              : (profile.skills || '');
            
            return {
              id: bid.technician_id,
              skills: skillsString,
              about: profile.bio || "",
              experience: profile.experience || "",
              specialization: profile.specialization || "",
              location: profile.location || "",
              bidId: bid.id
            };
          } catch (err) {
            console.log(`Error fetching profile for technician ${bid.technician_id}:`, err.message);
            return {
              id: bid.technician_id,
              skills: "",
              about: "",
              experience: "",
              specialization: "",
              location: "",
              bidId: bid.id
            };
          }
        })
      );

      // Call ML ranking service
      const mlResponse = await axios.post(
        "http://192.168.43.237:5000/api/ml/suggest",
        {
          issue: issueDescription,
          technicianProfiles: technicianProfiles
        }
      );

      const rankedTechnicians = mlResponse.data;

      // Reorder bids based on ML ranking
      const rankedBids = rankedTechnicians.map(rankedTech => {
        const originalBid = bids.find(bid => bid.technician_id === rankedTech.id);
        return {
          ...originalBid,
          match_score: rankedTech.match_score,
          ml_rank: rankedTechnicians.indexOf(rankedTech) + 1
        };
      });

      // Add any bids that weren't ranked (fallback)
      const unrankedBids = bids.filter(bid => 
        !rankedBids.find(ranked => ranked.id === bid.id)
      );

      console.log("ML Ranking successful, ranked bids:", rankedBids.length);
      return [...rankedBids, ...unrankedBids];

    } catch (err) {
      console.error("ML Ranking Error:", err.message);
      setMlRanking(false);
      // Return original bids if ML fails
      return bids;
    }
  };

  const approveBid = async (bid) => {
    try {
      await axios.post(`http://192.168.43.237:5000/api/job/start`, {
        request_id: issue_id,
        bid_id: bid.id,
        customer_id: customer_id,
        technician_id: bid.technician_id,
      });

      setAcceptedBidId(bid.id);
      setJobStatus("in_progress");
      Alert.alert("Success", "Job started with selected technician.");
    } catch (err) {
      console.error("Approve Bid Error:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Could not start job."
      );
    }
  };

  const navigateToComplete = (bid) => {
    navigation.navigate("JobCompleteScreen", {
      job: {
        id: bid.job_id || bid.id,
        technician_id: bid.technician_id,
        technician_name: bid.technician_name,
        issue: issue_id,
        status: "in_progress",
        customer_id: customer_id,
      },
    });
  };

  const viewTechnicianProfile = (technicianId) => {
    navigation.navigate("ViewTechnicianProfile", { technicianId });
  };

  const openChat = (bid) => {
    navigation.navigate("ChatScreen", {
      userId: customer_id,
      technicianId: bid.technician_id,
    });
  };

  const getButtonForBid = (item) => {
    if (jobStatus === "completed") {
      return (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>✅ Job Completed</Text>
        </View>
      );
    }

    if (acceptedBidId === item.id) {
      return (
        <TouchableOpacity
          style={[styles.button, styles.completeBtn]}
          onPress={() => navigateToComplete(item)}
        >
          <Text style={styles.buttonText}>🎯 Mark Job Complete</Text>
        </TouchableOpacity>
      );
    }

    if (acceptedBidId && acceptedBidId !== item.id) {
      return (
        <View style={styles.disabledContainer}>
          <Text style={styles.disabledText}>Another bid was accepted</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.button, styles.acceptBtn]}
        onPress={() => approveBid(item)}
      >
        <Text style={styles.buttonText}>✨ Accept Bid</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index }) => (
    <View style={[
      styles.card,
      item.ml_rank === 1 && styles.topMatchCard
    ]}>
      <View style={styles.cardHeader}>
        <Text style={styles.techName}>👨‍🔧 {item.technician_name}</Text>
        <View style={styles.badgeContainer}>
          {acceptedBidId === item.id && (
            <View style={styles.acceptedBadge}>
              <Text style={styles.acceptedBadgeText}>SELECTED</Text>
            </View>
          )}
          {item.match_score && (
            <View style={[
              styles.matchBadge,
              item.ml_rank === 1 && styles.bestMatchBadge
            ]}>
              <Text style={[
                styles.matchBadgeText,
                item.ml_rank === 1 && styles.bestMatchText
              ]}>
                {item.ml_rank === 1 ? "🏆 BEST MATCH" : `Match: ${(item.match_score * 100).toFixed(0)}%`}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bidDetails}>
        <Text style={styles.messageText}>💬 {item.message}</Text>
        <View style={styles.priceTimeContainer}>
          <Text style={styles.priceText}>💰 Rs. {item.price}</Text>
          <Text style={styles.timeText}>🕔 {item.estimated_time}</Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        {getButtonForBid(item)}

        <View style={styles.secondaryButtons}>
          <TouchableOpacity
            style={[styles.button, styles.profileBtn]}
            onPress={() => viewTechnicianProfile(item.technician_id)}
          >
            <Text style={styles.buttonText}>👤 Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.chatBtn]}
            onPress={() => openChat(item)}
          >
            <Text style={styles.buttonText}>💬 Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    fetchBids();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBids();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>📨 Service Bids</Text>
        <View style={styles.headerBadges}>
          {mlRanking && (
            <View style={styles.mlBadge}>
              <Text style={styles.mlBadgeText}>🤖 AI Ranked</Text>
            </View>
          )}
          {jobStatus && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {jobStatus === "completed" ? "✅ COMPLETED" : "🔄 IN PROGRESS"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {mlRanking ? "AI is ranking technicians..." : "Loading bids..."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={bids}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>📭 No bids received yet</Text>
              <Text style={styles.emptySubText}>Waiting for technicians to respond...</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingTop: 40 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerBadges: {
    flexDirection: "row",
    gap: 8,
  },
  heading: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#2c3e50",
  },
  statusBadge: {
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#27ae60",
    fontSize: 12,
    fontWeight: "bold",
  },
  mlBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mlBadgeText: {
    color: "#1976d2",
    fontSize: 12,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#ffffff",
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  topMatchCard: {
    borderLeftColor: "#FF6B35",
    borderLeftWidth: 6,
    backgroundColor: "#fffbf5",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  techName: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#2c3e50",
    flex: 1,
  },
  badgeContainer: {
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
  },
  acceptedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acceptedBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  matchBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestMatchBadge: {
    backgroundColor: "#FF6B35",
  },
  matchBadgeText: {
    color: "#1976d2",
    fontSize: 10,
    fontWeight: "bold",
  },
  bestMatchText: {
    color: "white",
  },
  bidDetails: {
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    color: "#34495e",
    marginBottom: 8,
    lineHeight: 20,
  },
  priceTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
  },
  timeText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  actionSection: {
    gap: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptBtn: { 
    backgroundColor: "#4CAF50",
  },
  profileBtn: { 
    backgroundColor: "#3498db",
    flex: 1,
  },
  chatBtn: { 
    backgroundColor: "#9b59b6",
    flex: 1,
  },
  completeBtn: { 
    backgroundColor: "#f39c12",
  },
  buttonText: { 
    color: "white", 
    fontWeight: "bold",
    fontSize: 14,
  },
  secondaryButtons: {
    flexDirection: "row",
    gap: 8,
  },
  completedContainer: {
    backgroundColor: "#d5f4e6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  completedText: {
    color: "#27ae60",
    fontWeight: "bold",
    fontSize: 14,
  },
  disabledContainer: {
    backgroundColor: "#ecf0f1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledText: {
    color: "#7f8c8d",
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#7f8c8d",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#bdc3c7",
  },
});