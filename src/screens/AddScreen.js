import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import db from "../database/db";

export default function AddScreen({ navigation }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState("expense"); // 'income' veya 'expense'

  // Bütçe aşımını kontrol eden fonksiyon
  const checkBudgetLimit = (cat, newAmount) => {
    if (type !== "expense") return; // Sadece giderler için bütçe kontrolü yapılır
    try {
      const budgetRow = db.getFirstSync(
        "SELECT * FROM budgets WHERE category = ?",
        [cat],
      );
      if (!budgetRow) return;

      const result = db.getFirstSync(
        "SELECT SUM(amount) as total FROM expenses WHERE type = ? AND category = ?",
        ["expense", cat],
      );
      const currentTotal = result?.total || 0;

      if (currentTotal + newAmount > budgetRow.limitAmount) {
        Alert.alert(
          "⚠️ Bütçe Sınırı Uyarısı!",
          `Dikkat! "${cat}" kategorisi için belirlediğiniz ${budgetRow.limitAmount} TL bütçe sınırını aştınız!`,
        );
      }
    } catch (error) {
      console.error("Bütçe kontrol hatası:", error);
    }
  };

  const handleSave = () => {
    if (!amount || !category) {
      Alert.alert("Hata", "Lütfen tutar ve kategori alanlarını doldurun.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      Alert.alert("Hata", "Lütfen geçerli bir tutar girin.");
      return;
    }

    try {
      // Önce bütçe sınırını kontrol et
      checkBudgetLimit(category, numericAmount);

      // Veritabanına kaydet
      db.runSync(
        "INSERT INTO expenses (amount, category, type, note, date) VALUES (?, ?, ?, ?, ?)",
        [numericAmount, category, type, note, new Date().toISOString()],
      );

      Alert.alert("Başarılı", "İşlem kaydedildi!", [
        {
          text: "Tamam",
          onPress: () => {
            setAmount("");
            setCategory("");
            setNote("");
            navigation.navigate("Ana Sayfa");
          },
        },
      ]);
    } catch (error) {
      console.error("Kayıt hatası:", error);
      Alert.alert("Hata", "İşlem kaydedilemedi.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Yeni İşlem Ekle</Text>

      {/* Tür Seçimi (Gelir / Gider) */}
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === "expense" && styles.activeExpense,
          ]}
          onPress={() => setType("expense")}
        >
          <Text
            style={[styles.typeText, type === "expense" && styles.activeText]}
          >
            Gider
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, type === "income" && styles.activeIncome]}
          onPress={() => setType("income")}
        >
          <Text
            style={[styles.typeText, type === "income" && styles.activeText]}
          >
            Gelir
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Tutar (TL)</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: 500"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Kategori</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: Market, Fatura, Maaş"
        value={category}
        onChangeText={setCategory}
      />

      <Text style={styles.label}>Not (İsteğe bağlı)</Text>
      <TextInput
        style={styles.input}
        placeholder="Açıklama ekleyin..."
        value={note}
        onChangeText={setNote}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Kaydet</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#F3F4F6", flexGrow: 1 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  typeContainer: { flexDirection: "row", marginBottom: 20 },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    marginHorizontal: 5,
  },
  activeExpense: { backgroundColor: "#EF4444" },
  activeIncome: { backgroundColor: "#10B981" },
  typeText: { fontWeight: "bold", color: "#4B5563" },
  activeText: { color: "#FFFFFF" },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: 15,
    color: "#111827",
  },
  saveButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});
