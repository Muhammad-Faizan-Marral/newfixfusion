import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignupScreen from "../screens/SignupScreen";
import OtpScreen from "../screens/OtpScreen";

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="OtpScreen" component={OtpScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigator;
