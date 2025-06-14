import React, { useContext, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";

// Screens
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import OtpScreen from "../screens/OtpScreen";
import UserDashboard from "../screens/UserDashboard";
import TechnicianDashboard from "../screens/TechnicianDashboard";
import PostIssue from "../screens/PostIssue";
import ViewBids from "../screens/ViewBids";
import AdminPanel from "../screens/AdminPanel";
import TechnicianProfileSetup from "../screens/TechnicianProfileSetup";
import ViewTechnicianProfile from "../screens/ViewTechnicianProfile";
import ChatScreen from "../screens/ChatScreen";
import RatingScreen from "../screens/RatingScreen";
import JobCompleteScreen from "../screens/JobCompleteScreen";
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, login } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        login(JSON.parse(userData)); 
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (            
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="OtpScreen" component={OtpScreen} />
          </>
        ) : user.role === "technician" ? (
          <>
            <Stack.Screen name="TechnicianDashboard" component={TechnicianDashboard} />
            <Stack.Screen name="TechnicianProfileSetup" component={TechnicianProfileSetup} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
            <Stack.Screen name="ViewTechnicianProfile" component={ViewTechnicianProfile} />

          </>
        ) : user.role === "admin" ? (
          <>
            <Stack.Screen name="AdminPanel" component={AdminPanel} />
          </>
        ) : (
          <>
            <Stack.Screen name="UserDashboard" component={UserDashboard} />
            <Stack.Screen name="PostIssue" component={PostIssue} />
            <Stack.Screen name="ViewTechnicianProfile" component={ViewTechnicianProfile} />
            <Stack.Screen name="ViewBids" component={ViewBids} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
            <Stack.Screen name="JobCompleteScreen" component={JobCompleteScreen}/>
            <Stack.Screen name="RatingScreen" component={RatingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
