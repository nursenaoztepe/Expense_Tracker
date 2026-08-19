import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit"; // LineChart eklendi
import db from "../database/db";

const screenWidth = Dimensions.get("window").width;

const colorPalette = [
  "#6366F1",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];

export default function StatsScreen() {
  const [chartData, setChartData] = useState([]);
  const [lineData, setLineData] = useState(null); // Çizgi grafik state'i eklendi
  const [hasData, setHasData] = useState(false);
  const [insight, setInsight] = useState({
    title: "",
    message: "",
    icon: "",
    color: "",
  });

  useFocusEffect(
    useCallback(() => {
      processChartData();
    }, []),
  );

  const processChartData = () => {
    try {
      const expenses = db.getAllSync(
        "SELECT * FROM expenses WHERE type = 'expense'",
      );
      const incomes = db.getAllSync(
        "SELECT * FROM expenses WHERE type = 'income'",
      );

      if (expenses.length === 0) {
        setHasData(false);
        return;
      }

      let totalExpense = 0;
      let totalIncome = 0;
      incomes.forEach((i) => (totalIncome += i.amount));

      const categoryTotals = {};
      expenses.forEach((item) => {
        totalExpense += item.amount;
        if (categoryTotals[item.category]) {
          categoryTotals[item.category] += item.amount;
        } else {
          categoryTotals[item.category] = item.amount;
        }
      });

      let colorIndex = 0;
      const formattedData = Object.keys(categoryTotals).map((key) => {
        const dataPoint = {
          name: key,
          amount: categoryTotals[key],
          color: colorPalette[colorIndex % colorPalette.length],
          legendFontColor: "#374151",
          legendFontSize: 13,
        };
        colorIndex++;
        return dataPoint;
      });

      formattedData.sort((a, b) => b.amount - a.amount);
      setChartData(formattedData);
      setHasData(true);

      generateSmartInsight(formattedData, totalExpense, totalIncome);

      // --- YENİ: Çizgi Grafik (Trend) İçin Veri Hazırlama ---
      // Son 5 harcamayı alıp grafiğe uygun formata getiriyoruz
      const recentExpenses = db
        .getAllSync(
          "SELECT amount, category FROM expenses WHERE type = 'expense' ORDER BY id DESC LIMIT 5",
        )
        .reverse();

      if (recentExpenses.length > 0) {
        setLineData({
          labels: recentExpenses.map((e) =>
            e.category.length > 6
              ? e.category.substring(0, 5) + ".."
              : e.category,
          ),
          datasets: [
            {
              data: recentExpenses.map((e) => e.amount),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Grafik verisi işlenirken hata:", error);
    }
  };

  const generateSmartInsight = (data, expense, income) => {
    const maxCat = data[0];
    if (expense > income && income > 0) {
      setInsight({
        title: "Bütçe Alarmı!",
        message:
          "Giderleriniz gelirlerinizi aşmış durumda. Harcamalarınızı yavaşlatmalısınız.",
        icon: "warning",
        color: "#EF4444",
      });
    } else if (maxCat.amount > expense * 0.5) {
      setInsight({
        title: "Dengesiz Dağılım",
        message: `Harcamalarınızın %${Math.round((maxCat.amount / expense) * 100)}'i sadece "${maxCat.name}" kategorisine gitmiş!`,
        icon: "analytics",
        color: "#F59E0B",
      });
    } else {
      setInsight({
        title: "Harika Gidiyorsunuz!",
        message:
          "Harcamalarınız dengeli dağılmış ve akışınız sağlıklı görünüyor. Böyle devam edin!",
        icon: "checkmark-circle",
        color: "#10B981",
      });
    }
  };

  // Pasta grafik için şeffaflık ayarı
  const chartConfig = { color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` };

  // Çizgi grafik için özel İndigo temalı ayar
  const lineChartConfig = {
    backgroundColor: "#FFFFFF",
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // İndigo Rengi (#6366F1)
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // Gri metin
    style: { borderRadius: 16 },
    propsForDots: { r: "5", strokeWidth: "2", stroke: "#6366F1" },
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.headerTitle}>Harcama Analizi</Text>

      {/* Akıllı Asistan Kartı */}
      {hasData && (
        <View style={[styles.insightCard, { borderLeftColor: insight.color }]}>
          <View style={styles.insightHeader}>
            <Ionicons name={insight.icon} size={24} color={insight.color} />
            <Text style={[styles.insightTitle, { color: insight.color }]}>
              {insight.title}
            </Text>
          </View>
          <Text style={styles.insightText}>{insight.message}</Text>
        </View>
      )}

      {!hasData ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Grafik oluşturmak için henüz yeterli gider verisi bulunmuyor.
          </Text>
        </View>
      ) : (
        <View>
          {/* 1. Grafik: Pasta Grafiği (Kategori Dağılımı) */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Kategori Dağılımı</Text>
            <PieChart
              data={chartData}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              accessor={"amount"}
              backgroundColor={"transparent"}
              paddingLeft={"10"}
              center={[10, 0]}
              absolute
            />
          </View>

          {/* 2. Grafik: Çizgi Grafiği (Son Harcamalar Trendi) */}
          {lineData && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Son Harcama Trendi</Text>
              <LineChart
                data={lineData}
                width={screenWidth - 70} // Ekran genişliğine göre ayarlandı
                height={220}
                chartConfig={lineChartConfig}
                bezier // Çizgilerin köşeli değil, yumuşak kıvrımlı (dalgalı) olmasını sağlar
                style={styles.lineChartStyle}
                yAxisSuffix=" ₺"
              />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  insightCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 6,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  insightTitle: { fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  insightText: { fontSize: 14, color: "#4B5563", lineHeight: 20 },
  chartCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 15,
    elevation: 3,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  lineChartStyle: { marginVertical: 8, borderRadius: 16 },
  emptyContainer: {
    margin: 20,
    padding: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
});
