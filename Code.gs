/**
 * Akıllı Yoklama Sistemi – Google Apps Script Backend
 * Bu dosyanın içeriğini Google E-Tablo > Uzantılar > Apps Script editörüne yapıştırın.
 */

// --- YAPILANDIRMA (index.html ile aynı değerleri girin) ---
var SINIF_LAT = 38.419200;      // Sınıfın enlemi
var SINIF_LNG = 27.128700;      // Sınıfın boylamı
var MAX_MESAFE_METRE = 100;      // İzin verilen maksimum uzaklık (metre)
var SAYFA_ADI = "Yoklama";      // Kayıtların yazılacağı sayfa

function jsonCevap(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Öğretmen ekranı sunucu saatini buradan alır (PIN senkronu için)
function doGet(e) {
  return jsonCevap({ ok: true, sunucuSaati: Math.floor(new Date().getTime() / 1000) });
}

function pinUret(saniye) {
  return String(Math.floor(saniye / 30) % 9000 + 1000);
}

function mesafeHesapla(lat1, lon1, lat2, lon2) {
  var R = 6371e3;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = JSON.parse(e.postData.contents);
    var ogrenciNo = String(data.ogrenci_no || "").trim();
    var adSoyad = String(data.ad_soyad || "").trim();
    var girilenPin = String(data.pin || "").trim();
    var lat = Number(data.lat);
    var lng = Number(data.lng);

    if (!ogrenciNo || !adSoyad || !girilenPin) {
      return jsonCevap({ basarili: false, mesaj: "Eksik bilgi gönderildi." });
    }

    // 1) Dinamik PIN doğrulama (şu anki ve bir önceki 30 sn penceresi kabul edilir)
    var simdi = Math.floor(new Date().getTime() / 1000);
    if (girilenPin !== pinUret(simdi) && girilenPin !== pinUret(simdi - 30)) {
      return jsonCevap({ basarili: false, mesaj: "Hatalı veya süresi dolmuş PIN kodu! Tahtadaki güncel kodu girin." });
    }

    // 2) GPS doğrulama (sunucu tarafında da kontrol edilir)
    if (isNaN(lat) || isNaN(lng)) {
      return jsonCevap({ basarili: false, mesaj: "Konum bilgisi alınamadı." });
    }
    var mesafe = mesafeHesapla(SINIF_LAT, SINIF_LNG, lat, lng);
    if (mesafe > MAX_MESAFE_METRE) {
      return jsonCevap({ basarili: false, mesaj: "Sınıf sınırları dışındasınız! (Uzaklık: " + Math.round(mesafe) + " m)" });
    }

    // 3) Sayfa ve başlık satırı
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SAYFA_ADI);
    if (!sheet) {
      sheet = ss.insertSheet(SAYFA_ADI);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Tarih", "Saat", "Öğrenci No", "Ad Soyad", "Uzaklık (m)"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
      // Tarih ve numara sütunları metin olarak saklansın (otomatik dönüşümü engeller)
      sheet.getRange("A:A").setNumberFormat("@");
      sheet.getRange("C:C").setNumberFormat("@");
    }

    // 4) Mükerrer kayıt kontrolü (aynı gün, aynı numara)
    var tz = ss.getSpreadsheetTimeZone();
    var bugun = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var h = rows[i][0];
      // Not: Sheets'ten gelen tarih nesneleri "instanceof Date" testini geçmez, getTime ile kontrol edilir
      var satirTarih = (h && typeof h.getTime === "function") ? Utilities.formatDate(h, tz, "yyyy-MM-dd") : String(h).trim();
      if (satirTarih === bugun && String(rows[i][2]).trim() === ogrenciNo) {
        return jsonCevap({ basarili: false, mesaj: "Bu öğrenci numarası ile bugün zaten yoklama verilmiş!" });
      }
    }

    // 5) Kaydet
    var saat = Utilities.formatDate(new Date(), tz, "HH:mm:ss");
    sheet.appendRow([bugun, saat, ogrenciNo, adSoyad, Math.round(mesafe)]);

    return jsonCevap({ basarili: true, mesaj: "Yoklamanız başarıyla kaydedildi!" });

  } catch (err) {
    return jsonCevap({ basarili: false, mesaj: "Hata oluştu: " + err.toString() });
  } finally {
    lock.releaseLock();
  }
}
