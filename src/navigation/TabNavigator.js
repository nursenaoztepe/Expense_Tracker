import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../screens/HomeScreen";
// AddScreen importunu sildik
import GoalsScreen from "../screens/GoalsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import StatsScreen from "../screens/StatsScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: "#6366F1",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          height: 80,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === "Ana Sayfa")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "Grafikler")
            iconName = focused ? "pie-chart" : "pie-chart-outline";
          else if (route.name === "Hedefler")
            iconName = focused ? "flag" : "flag-outline";
          else if (route.name === "Ayarlar")
            iconName = focused ? "settings" : "settings-outline";

          return (
            <Ionicons name={iconName} size={focused ? 28 : 24} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Ana Sayfa" component={HomeScreen} />
      <Tab.Screen name="Grafikler" component={StatsScreen} />
      <Tab.Screen name="Hedefler" component={GoalsScreen} />
      <Tab.Screen name="Ayarlar" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
