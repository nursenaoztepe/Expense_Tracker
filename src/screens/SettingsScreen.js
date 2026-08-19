import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import db from "../database/db";
import { fetchExchangeRates } from "../services/currencyApi";

export default function SettingsScreen() {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setLoading(true);
    const data = await fetchExchangeRates();
    if (data) {
      setRates(data);
    }
    setLoading(false);
  };

  // Veritabanını PDF Raporu olarak dışa aktarma
  const exportToPDF = async () => {
    try {
      const allRows = db.getAllSync("SELECT * FROM expenses ORDER BY id DESC");

      if (allRows.length === 0) {
        Alert.alert("Uyarı", "Raporlanacak hiçbir işlem bulunamadı.");
        return;
      }

      // 1. PDF içinde görünecek HTML şablonunu ve tabloyu hazırlıyoruz
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
              h1 { color: #6366F1; text-align: center; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #E5E7EB; padding: 12px; text-align: left; }
              th { background-color: #F3F4F6; color: #374151; font-weight: bold; }
              tr:nth-child(even) { background-color: #F9FAFB; }
              .income { color: #10B981; font-weight: bold; }
              .expense { color: #EF4444; font-weight: bold; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #9CA3AF; }
            </style>
          </head>
          <body>
            <h1>Harcama ve Gelir Raporu</h1>
            <table>
              <tr>
                <th>Tarih</th>
                <th>Kategori</th>
                <th>Not</th>
                <th>Tutar</th>
              </tr>
              ${allRows
                .map((row) => {
                  const isIncome = row.type === "income";
                  const dateStr = row.date
                    ? new Date(row.date).toLocaleDateString("tr-TR")
                    : "-";
                  return `
                <tr>
                  <td>${dateStr}</td>
                  <td>${row.category}</td>
                  <td>${row.note || "-"}</td>
                  <td class="${isIncome ? "income" : "expense"}">
                    ${isIncome ? "+" : "-"}${row.amount} TL
                  </td>
                </tr>
                `;
                })
                .join("")}
            </table>
            <div class="footer">Bu rapor ExpenseTracker uygulaması tarafından oluşturulmuştur.</div>
          </body>
        </html>
      `;

      // 2. HTML'i PDF dosyasına çeviriyoruz
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // 3. Paylaşım menüsünü açarak PDF'i gönderiyoruz
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Harcama Raporunu Paylaş",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Hata", "Bu cihazda dosya paylaşımı desteklenmiyor.");
      }
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      Alert.alert("Hata", "PDF dosyası oluşturulurken bir sorun çıktı.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Döviz Kuru Kartı */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.cardTitle}>Güncel Döviz Kurları</Text>
            {/* YENİ: Başarılı yüklemede görünen yeşil canlı kur noktası */}
            {rates && !loading && (
              <View style={[styles.dot, { backgroundColor: "#10B981" }]} />
            )}
          </View>
          <TouchableOpacity onPress={loadRates} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Yenile</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#6366F1"
            style={{ marginVertical: 20 }}
          />
        ) : rates ? (
          <View style={styles.ratesContainer}>
            <View style={styles.rateItem}>
              <Text style={styles.rateCurrency}>🇺🇸 USD / TRY</Text>
              <Text style={styles.rateValue}>
                {(1 / rates.USD).toFixed(2)} ₺
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rateItem}>
              <Text style={styles.rateCurrency}>🇪🇺 EUR / TRY</Text>
              <Text style={styles.rateValue}>
                {(1 / rates.EUR).toFixed(2)} ₺
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}>
            Kurlar çekilemedi. İnternet bağlantınızı kontrol edin.
          </Text>
        )}
      </View>

      {/* Yedekleme (PDF Rapor) Kartı */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Raporlama</Text>
        <Text style={styles.cardDescription}>
          Tüm gelir ve gider kayıtlarınızı içeren detaylı bir PDF raporu
          oluşturarak cihazınıza kaydedebilir veya paylaşabilirsiniz.
        </Text>

        <TouchableOpacity style={styles.exportButton} onPress={exportToPDF}>
          <Text style={styles.exportButtonText}>📄 PDF Olarak Raporla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },

  // YENİ: Canlı nokta stili
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8, marginTop: 2 },

  refreshButton: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: { color: "#4F46E5", fontWeight: "600", fontSize: 14 },
  ratesContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rateItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  rateCurrency: { fontSize: 16, fontWeight: "600", color: "#4B5563" },
  rateValue: { fontSize: 18, fontWeight: "bold", color: "#10B981" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 5 },
  errorText: { color: "#EF4444", textAlign: "center", marginTop: 10 },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  exportButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  exportButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});
