import { NavigationContainer } from "@react-navigation/native";
import { useEffect } from "react";
import { initDB } from "./src/database/db"; // Veritabanı başlatıcı fonksiyonu import ettik
import TabNavigator from "./src/navigation/TabNavigator";

export default function App() {
  // Uygulama yüklendiğinde veritabanını ve tabloları hazırla
  useEffect(() => {
    initDB();
  }, []);

  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
