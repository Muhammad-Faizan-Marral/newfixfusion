import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "@env";
export default function AdminPanel({ navigation }) {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useContext(AuthContext);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://192.138.33.237:5000/api/admin/pending-technicians`
      );
      setTechnicians(res.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load technicians.");
    } finally {
      setLoading(false);
    }
  };

  const approveTechnician = async (id) => {
    try {
      await axios.put(`http://192.168.43.237:5000/api/admin/approve/${id}`);
      console.log(`Approving ID: ${id}`);

      console.log(id);
      Alert.alert("Approved", "Technician approved successfully!");
      fetchTechnicians();
    } catch (err) {
      Alert.alert("Error", "Failed to approve technician.");
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>👨‍🔧 {item.name}</Text>
      <Text>Email: {item.email}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => approveTechnician(item.id)}
      >
        <Text style={styles.buttonText}>Approve</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with logout */}
      <View style={styles.header}>
        <TouchableOpacity onPress={logout} style={styles.logoutWrapper}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>🛡️ Pending Technician Approvals</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <FlatList
          data={technicians}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text>No pending technicians.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40 },
  header: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  logoutWrapper: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  logout: {
    fontSize: 16,
    color: "#E74C3C",
    fontWeight: "600",
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#FDECEA",
    borderRadius: 8,
  },
  heading: { fontSize: 20, fontWeight: "bold", alignSelf: "flex-start" },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
  },
  name: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  button: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
  },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
});
