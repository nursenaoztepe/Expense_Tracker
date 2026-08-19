<h1 align="center">💰 ExpenseTracker</h1>

<p align="center">
  <strong>React Native ve Expo ile geliştirilmiş, çevrimdışı öncelikli (offline-first) kişisel finans ve bütçe yönetimi mobil uygulaması.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
</p>

---

## 🚀 Proje Hakkında

**ExpenseTracker**, kullanıcıların günlük gelir ve giderlerini mobil cihazlarında güvenle saklayıp yönetebilecekleri, detaylı raporlar alabilecekleri ve anlık döviz kurlarını takip edebilecekleri kapsamlı bir finans uygulamasıdır. Proje, modern UI/UX standartlarına uygun olarak tasarlanmış olup, veri güvenliği için harici bir sunucu yerine cihazın yerel depolamasını kullanır.

## ✨ Temel Özellikler

* **📝 Çevrimdışı Veri Yönetimi (CRUD):** Harcamalarınızı ve gelirlerinizi anında ekleyin, düzenleyin veya silin. Tüm veriler `expo-sqlite` ile cihazınızda yerel olarak saklanır.
* **💱 Canlı Döviz Kurları (REST API):** `open.er-api.com` servis mimarisi ile uygulamaya her girdiğinizde güncel USD ve EUR kurları anlık olarak çekilir ve arayüze yansıtılır.
* **📄 Dinamik PDF Raporlama:** Tüm finansal geçmişiniz HTML şablonları ile derlenir, `expo-print` ile PDF dosyasına dönüştürülür ve cihazın yerel paylaşım menüsüyle (WhatsApp, Mail vb.) dışa aktarılır.
* **🔍 Gelişmiş Filtreleme ve Sıralama:** Kategoriye, işlem türüne (Gelir/Gider) veya tutara göre karmaşık filtreleme algoritmalarıyla geçmiş kayıtlarınıza anında ulaşın.
* **📱 Modern Kullanıcı Arayüzü (UI/UX):** Ekranda yer kaplamayan Modal pencereleri, klavye dostu (`KeyboardAvoidingView`) form yapıları ve pratik Yüzen İşlem Butonu (FAB) ile akıcı bir deneyim.

## 🛠️ Kullanılan Teknolojiler

* **Geliştirme Ortamı:** React Native, Expo CLI
* **Veritabanı:** SQLite (Local Storage)
* **Ağ İstekleri:** JavaScript Fetch API (Asenkron Servis Mimarisi)
* **Paketler:** `@expo/vector-icons`, `expo-print`, `expo-sharing`
