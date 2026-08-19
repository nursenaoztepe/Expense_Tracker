// src/services/currencyApi.js

const API_URL = "https://open.er-api.com/v6/latest/TRY"; // Türk Lirası bazlı kurlar

export const fetchExchangeRates = async () => {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Ağ yanıtı başarılı değil");
    }

    const data = await response.json();

    // Sadece ihtiyacımız olan kurları döndürelim (Örn: USD ve EUR)
    return {
      USD: data.rates.USD,
      EUR: data.rates.EUR,
      lastUpdate: data.time_last_update_utc,
    };
  } catch (error) {
    console.error("Döviz kurları çekilirken hata oluştu: ", error);
    return null; // Hata durumunda null dönerek uygulamanın çökmesini engelliyoruz
  }
};
