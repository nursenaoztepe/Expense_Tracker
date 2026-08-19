import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import db from "../database/db";

const CURRENCY_SYMBOLS = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

export default function HomeScreen() {
  const [expenses, setExpenses] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // Para Birimi ve Canlı Kur State'leri
  const [currency, setCurrency] = useState("TRY");
  const [exchangeRates, setExchangeRates] = useState({
    TRY: 1,
    USD: 0.029, // İnternet yoksa kullanılacak varsayılan (fallback) kur
    EUR: 0.026, // İnternet yoksa kullanılacak varsayılan (fallback) kur
  });
  const [isLiveRate, setIsLiveRate] = useState(false); // Ekranda "Canlı" yazısını göstermek için

  // Arama ve Temel Filtre State'leri
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Gelişmiş Filtreleme State'leri
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState("dateDesc");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uniqueCategories, setUniqueCategories] = useState([]);

  // Yeni İşlem Ekleme State'leri
  const [isModalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState("expense");

  // YENİ: Uygulama açıldığında canlı kurları çeken useEffect (API İsteği)
  useEffect(() => {
    const fetchLiveRates = async () => {
      try {
        // Ücretsiz, ana para birimini (base) TRY alan açık API
        const response = await fetch("https://open.er-api.com/v6/latest/TRY");
        const data = await response.json();

        if (data && data.rates) {
          setExchangeRates({
            TRY: 1,
            USD: data.rates.USD,
            EUR: data.rates.EUR,
          });
          setIsLiveRate(true); // Veri başarıyla çekildi
        }
      } catch (error) {
        console.error(
          "Canlı kurlar çekilemedi, çevrimdışı (offline) kurlar kullanılıyor.",
          error,
        );
        setIsLiveRate(false);
      }
    };

    fetchLiveRates();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const fetchData = () => {
    try {
      const allRows = db.getAllSync("SELECT * FROM expenses ORDER BY id DESC");
      setExpenses(allRows);
      calculateTotals(allRows);

      const categories = [
        "all",
        ...new Set(allRows.map((item) => item.category)),
      ];
      setUniqueCategories(categories);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    }
  };

  const calculateTotals = (data) => {
    let income = 0;
    let expense = 0;
    data.forEach((item) => {
      if (item.type === "income") income += item.amount;
      else expense += item.amount;
    });
    setTotalIncome(income);
    setTotalExpense(expense);
  };

  const confirmDelete = (id, category) => {
    Alert.alert(
      "İşlemi Sil",
      `"${category}" kategorisindeki bu işlemi silmek istediğinize emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => deleteTransaction(id),
        },
      ],
    );
  };

  const deleteTransaction = (id) => {
    db.runSync("DELETE FROM expenses WHERE id = ?", [id]);
    fetchData();
  };

  const handleSaveTransaction = () => {
    if (!amount || !category) {
      Alert.alert("Hata", "Lütfen tutar ve kategori alanlarını doldurun.");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      Alert.alert("Hata", "Lütfen geçerli bir tutar girin.");
      return;
    }

    db.runSync(
      "INSERT INTO expenses (amount, category, type, note, date) VALUES (?, ?, ?, ?, ?)",
      [numericAmount, category, type, note, new Date().toISOString()],
    );

    setAmount("");
    setCategory("");
    setNote("");
    setModalVisible(false);
    fetchData();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setSortBy("dateDesc");
    setSelectedCategory("all");
    setFilterModalVisible(false);
  };

  // --- KUR DÖNÜŞÜM YARDIMCI FONKSİYONU ---
  const formatCurrency = (val) => {
    const rate = exchangeRates[currency]; // Artık state içindeki canlı veriyi okuyor
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${(val * rate).toFixed(currency === "TRY" ? 0 : 2)} ${symbol}`;
  };

  let processedExpenses = expenses.filter((item) => {
    const query = searchQuery.toLowerCase();
    const textMatch =
      item.category.toLowerCase().includes(query) ||
      (item.note && item.note.toLowerCase().includes(query));
    const typeMatch = filterType === "all" || item.type === filterType;
    const catMatch =
      selectedCategory === "all" || item.category === selectedCategory;
    return textMatch && typeMatch && catMatch;
  });

  if (sortBy === "dateDesc") processedExpenses.sort((a, b) => b.id - a.id);
  else if (sortBy === "dateAsc") processedExpenses.sort((a, b) => a.id - b.id);
  else if (sortBy === "amountDesc")
    processedExpenses.sort((a, b) => b.amount - a.amount);
  else if (sortBy === "amountAsc")
    processedExpenses.sort((a, b) => a.amount - b.amount);

  const renderItem = ({ item }) => {
    const isIncome = item.type === "income";
    return (
      <View style={styles.transactionCard}>
        <View style={styles.cardLeft}>
          <Text style={styles.categoryText}>{item.category}</Text>
          <Text style={styles.noteText}>{item.note || "Not yok"}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text
            style={[
              styles.amountText,
              isIncome ? styles.incomeText : styles.expenseText,
            ]}
          >
            {isIncome ? "+" : "-"}
            {item.amount} ₺
          </Text>
          <TouchableOpacity
            onPress={() => confirmDelete(item.id, item.category)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        {/* YENİ: Dinamik Para Birimi Seçici ve Canlı Kur Bildirimi */}
        <View style={styles.topRow}>
          <View style={styles.liveIndicator}>
            <View
              style={[
                styles.dot,
                { backgroundColor: isLiveRate ? "#10B981" : "#F59E0B" },
              ]}
            />
            <Text style={styles.liveText}>
              {isLiveRate ? "Canlı Kur" : "Çevrimdışı"}
            </Text>
          </View>

          <View style={styles.currencyToggleContainer}>
            {Object.keys(exchangeRates).map((cur) => (
              <TouchableOpacity
                key={cur}
                style={[
                  styles.currencyBtn,
                  currency === cur && styles.currencyBtnActive,
                ]}
                onPress={() => setCurrency(cur)}
              >
                <Text
                  style={[
                    styles.currencyBtnText,
                    currency === cur && styles.currencyBtnTextActive,
                  ]}
                >
                  {cur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.balanceLabel}>Toplam Bakiye</Text>
        <Text style={styles.balanceText}>
          {formatCurrency(totalIncome - totalExpense)}
        </Text>

        <View style={styles.row}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Gelir</Text>
            <Text style={[styles.summaryItemAmount, styles.incomeText]}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Gider</Text>
            <Text style={[styles.summaryItemAmount, styles.expenseText]}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Kategori veya not ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.advancedFilterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === "all" && styles.filterAllActive,
          ]}
          onPress={() => setFilterType("all")}
        >
          <Text
            style={[
              styles.filterText,
              filterType === "all" && styles.filterTextActive,
            ]}
          >
            Hepsi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === "income" && styles.filterIncomeActive,
          ]}
          onPress={() => setFilterType("income")}
        >
          <Text
            style={[
              styles.filterText,
              filterType === "income" && styles.filterTextActive,
            ]}
          >
            Gelirler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === "expense" && styles.filterExpenseActive,
          ]}
          onPress={() => setFilterType("expense")}
        >
          <Text
            style={[
              styles.filterText,
              filterType === "expense" && styles.filterTextActive,
            ]}
          >
            Giderler
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={processedExpenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aradığınız kriterlere uygun işlem bulunamadı.
          </Text>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni İşlem Ekle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === "expense" && styles.activeExpense,
                  ]}
                  onPress={() => setType("expense")}
                >
                  <Text
                    style={[
                      styles.typeText,
                      type === "expense" && styles.activeText,
                    ]}
                  >
                    Gider
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === "income" && styles.activeIncome,
                  ]}
                  onPress={() => setType("income")}
                >
                  <Text
                    style={[
                      styles.typeText,
                      type === "income" && styles.activeText,
                    ]}
                  >
                    Gelir
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Tutar (Örn: 500) - TL Cinsinden"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <TextInput
                style={styles.input}
                placeholder="Kategori (Örn: Market)"
                value={category}
                onChangeText={setCategory}
              />
              <TextInput
                style={styles.input}
                placeholder="Not (İsteğe bağlı)"
                value={note}
                onChangeText={setNote}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveTransaction}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gelişmiş Filtreleme</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <Text style={styles.sectionTitle}>Sıralama Ölçütü</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === "dateDesc" && styles.sortActive,
                  ]}
                  onPress={() => setSortBy("dateDesc")}
                >
                  <Text
                    style={[
                      styles.sortText,
                      sortBy === "dateDesc" && styles.sortTextActive,
                    ]}
                  >
                    En Yeni
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === "dateAsc" && styles.sortActive,
                  ]}
                  onPress={() => setSortBy("dateAsc")}
                >
                  <Text
                    style={[
                      styles.sortText,
                      sortBy === "dateAsc" && styles.sortTextActive,
                    ]}
                  >
                    En Eski
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === "amountDesc" && styles.sortActive,
                  ]}
                  onPress={() => setSortBy("amountDesc")}
                >
                  <Text
                    style={[
                      styles.sortText,
                      sortBy === "amountDesc" && styles.sortTextActive,
                    ]}
                  >
                    En Yüksek Tutar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === "amountAsc" && styles.sortActive,
                  ]}
                  onPress={() => setSortBy("amountAsc")}
                >
                  <Text
                    style={[
                      styles.sortText,
                      sortBy === "amountAsc" && styles.sortTextActive,
                    ]}
                  >
                    En Düşük Tutar
                  </Text>
                </TouchableOpacity>
              </ScrollView>
              <Text style={styles.sectionTitle}>Kategoriye Göre Filtrele</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {uniqueCategories.map((cat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.catBadge,
                      selectedCategory === cat && styles.catBadgeActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catBadgeText,
                        selectedCategory === cat && styles.catBadgeTextActive,
                      ]}
                    >
                      {cat === "all" ? "Tüm Kategoriler" : cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearButtonText}>Temizle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.applyButtonText}>Sonuçları Göster</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  summaryCard: {
    backgroundColor: "#6366F1",
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    elevation: 8,
    position: "relative",
  },

  // YENİ: Canlı Kur Göstergesi ve Para Birimi Container'ı
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  liveText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "bold",
  },

  currencyToggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    padding: 2,
  },
  currencyBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  currencyBtnActive: { backgroundColor: "#FFFFFF" },
  currencyBtnText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "bold",
  },
  currencyBtnTextActive: { color: "#6366F1" },

  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  balanceText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  summaryItem: { alignItems: "center" },
  summaryItemLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 5,
  },
  summaryItemAmount: { fontSize: 18, fontWeight: "bold" },
  incomeText: { color: "#10B981" },
  expenseText: { color: "#EF4444" },

  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  advancedFilterButton: {
    backgroundColor: "#111827",
    width: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    alignItems: "center",
  },
  filterAllActive: { backgroundColor: "#6366F1" },
  filterIncomeActive: { backgroundColor: "#10B981" },
  filterExpenseActive: { backgroundColor: "#EF4444" },
  filterText: { fontSize: 13, fontWeight: "700", color: "#6B7280" },
  filterTextActive: { color: "#FFFFFF" },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  transactionCard: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  cardLeft: { flex: 1 },
  cardRight: { flexDirection: "row", alignItems: "center" },
  categoryText: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  noteText: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  amountText: { fontSize: 16, fontWeight: "bold", marginRight: 12 },
  deleteButton: {
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 20,
    fontSize: 16,
  },

  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#6366F1",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
    maxHeight: "85%",
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },

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
  input: {
    backgroundColor: "#F9FAFB",
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
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
    marginTop: 10,
  },
  horizontalScroll: { flexGrow: 0, marginBottom: 20 },
  sortButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sortActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  sortText: { color: "#4B5563", fontWeight: "600" },
  sortTextActive: { color: "#FFFFFF" },
  catBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  catBadgeActive: { backgroundColor: "#111827" },
  catBadgeText: { color: "#4B5563", fontSize: 14, fontWeight: "600" },
  catBadgeTextActive: { color: "#FFFFFF" },

  modalActionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  clearButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  clearButtonText: { color: "#4B5563", fontSize: 16, fontWeight: "bold" },
  applyButton: {
    flex: 2,
    backgroundColor: "#6366F1",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});
