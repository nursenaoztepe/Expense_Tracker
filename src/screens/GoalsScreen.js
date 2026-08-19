import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import db from "../database/db";

const MOTIVATION_QUOTES = [
  "Gelecekteki sen, bugünkü sana teşekkür edecek. 🤝",
  "Küçük birikimler, büyük hayallerin fragmanıdır. 🎬",
  "Bütçeni yönetmek, hayatını yönetmektir. Kontrol sende! 🎮",
  "Sadece hayal etme; planla, biriktir ve gerçekleştir. 🚀",
  "Bugünün mantıklı adımları, yarının finansal özgürlüğüdür. 💡",
];

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [fundInputs, setFundInputs] = useState({});
  const [dailyQuote, setDailyQuote] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  useEffect(() => {
    const randomQuote =
      MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
    setDailyQuote(randomQuote);
  }, []);

  const fetchData = () => {
    const rows = db.getAllSync("SELECT * FROM goals ORDER BY id DESC");
    setGoals(rows);
  };

  const addGoal = () => {
    if (!title || !targetAmount) {
      Alert.alert("Hata", "Lütfen hedef adı ve tutarını girin.");
      return;
    }
    db.runSync("INSERT INTO goals (title, targetAmount) VALUES (?, ?)", [
      title,
      parseFloat(targetAmount),
    ]);
    setTitle("");
    setTargetAmount("");
    fetchData();
  };

  const handleAddFunds = (id, current, target) => {
    const amountToAdd = parseFloat(fundInputs[id]);
    if (isNaN(amountToAdd) || amountToAdd <= 0) return;

    let newTotal = current + amountToAdd;
    if (newTotal > target) newTotal = target;

    db.runSync("UPDATE goals SET savedAmount = ? WHERE id = ?", [newTotal, id]);
    setFundInputs({ ...fundInputs, [id]: "" });
    fetchData();

    if (newTotal === target) {
      Alert.alert("🎉 Tebrikler!", "Harika bir iş çıkardın, hedefine ulaştın!");
    }
  };

  const getProgressMessage = (progress) => {
    if (progress === 0) return "Başlamak bitirmenin yarısıdır. İlk adımı at!";
    if (progress < 50) return "Harika bir başlangıç, yola devam! 🚀";
    if (progress >= 50 && progress < 100)
      return "Yarıyı geçtin, hedefe çok az kaldı! 🔥";
    return "Tebrikler, bu hedefi başardın! 🏆";
  };

  const totalSaved = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);

  // Kaydırılabilir alanın en üstünde (ListHeaderComponent) görünecek motivasyon kısmı
  const ListHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.quoteText}>"{dailyQuote}"</Text>

      {goals.length > 0 && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>
            Hayallerin İçin Toplam Birikimin
          </Text>
          <Text style={styles.summaryAmount}>{totalSaved} TL</Text>
        </View>
      )}
    </View>
  );

  const renderItem = ({ item }) => {
    const progress = Math.min(
      (item.savedAmount / item.targetAmount) * 100,
      100,
    );
    const isComplete = progress === 100;

    return (
      <View style={styles.goalCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.goalTitle}>{item.title}</Text>
          {isComplete && <Ionicons name="trophy" size={24} color="#F59E0B" />}
        </View>

        <Text style={styles.amountText}>
          <Text style={styles.savedHighlight}>{item.savedAmount} TL</Text> /{" "}
          {item.targetAmount} TL
        </Text>

        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: isComplete ? "#10B981" : "#6366F1",
              },
            ]}
          />
        </View>

        <Text style={styles.statusMessage}>{getProgressMessage(progress)}</Text>

        {!isComplete && (
          <View style={styles.actionRow}>
            <TextInput
              style={styles.fundInput}
              placeholder="Tutar girin"
              keyboardType="numeric"
              value={fundInputs[item.id] || ""}
              onChangeText={(val) =>
                setFundInputs({ ...fundInputs, [item.id]: val })
              }
            />
            <TouchableOpacity
              style={styles.fundButton}
              onPress={() =>
                handleAddFunds(item.id, item.savedAmount, item.targetAmount)
              }
            >
              <Text style={styles.fundButtonText}>Birikim Ekle</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. KISIM: EKRANIN EN ÜSTÜNDE SABİT KALAN "HEDEF EKLEME" ALANI */}
      <View style={styles.fixedAddSection}>
        <Text style={styles.sectionTitle}>Yeni Hedef Belirle</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Örn: Tatil..."
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Tutar (TL)"
            keyboardType="numeric"
            value={targetAmount}
            onChangeText={setTargetAmount}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addGoal}>
          <Text style={styles.addButtonText}>Hedefi Başlat</Text>
        </TouchableOpacity>
      </View>

      {/* 2. KISIM: KAYDIRILABİLİR LİSTE (Motivasyon, Özet ve Kartlar) */}
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="rocket-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Henüz Hedef Yok</Text>
            <Text style={styles.emptyText}>
              Yukarıdan kendine yeni bir hedef belirle ve birikim yapmanın
              keyfini çıkar!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },

  // Sabit Hedef Ekleme Alanı Stilleri
  fixedAddSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10, // Listenin üstünde kalmasını sağlar
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },

  // Kaydırılabilir İçerik Stilleri
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  headerSection: {
    backgroundColor: "#6366F1",
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 15,
    alignItems: "center",
  },
  quoteText: {
    color: "rgba(255,255,255,0.9)",
    fontStyle: "italic",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 20,
  },
  summaryBox: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryAmount: { color: "#FFFFFF", fontSize: 24, fontWeight: "bold" },

  // Hedef Kartları Stilleri
  goalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    borderTopWidth: 4,
    borderTopColor: "#6366F1",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  goalTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  amountText: { fontSize: 14, color: "#6B7280", marginBottom: 10 },
  savedHighlight: { color: "#111827", fontWeight: "bold", fontSize: 16 },
  progressBg: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", borderRadius: 5 },
  statusMessage: {
    fontSize: 13,
    color: "#6366F1",
    fontStyle: "italic",
    marginBottom: 15,
    fontWeight: "500",
  },
  actionRow: { flexDirection: "row", gap: 10 },
  fundInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
  },
  fundButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 15,
    justifyContent: "center",
    borderRadius: 8,
    height: 44,
  },
  fundButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },

  // Boş Durum Stilleri
  emptyContainer: { alignItems: "center", marginTop: 10, padding: 20 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 10,
    marginBottom: 5,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },
});
