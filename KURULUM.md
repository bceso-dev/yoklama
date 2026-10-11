# Akıllı Yoklama Sistemi – Kurulum Rehberi

Bu klasördeki dosyalar:

| Dosya | Ne işe yarar |
|---|---|
| `Code.gs` | Google Apps Script backend (E-Tablo'ya kayıt, PIN ve GPS doğrulama) |
| `index.html` | Öğrenci formu + öğretmen projeksiyon ekranı (tek dosya) |
| `KURULUM.md` | Bu rehber |

## Adım 1 – Google E-Tablo ve Apps Script

1. Google Drive'da yeni bir **Google E-Tablo** oluşturun, adını `Yoklama` yapın.
2. **Uzantılar > Apps Script** menüsünü açın.
3. Editördeki her şeyi silin, `Code.gs` dosyasının içeriğini yapıştırın ve kaydedin (Ctrl+S / Cmd+S).
4. Dosyanın en üstündeki `SINIF_LAT`, `SINIF_LNG` ve `MAX_MESAFE_METRE` değerlerini sınıfınıza göre düzenleyin.
   - Koordinat bulmak için: Google Haritalar'da sınıfa sağ tıklayın, ilk satırdaki sayıları kopyalayın (ilki enlem, ikincisi boylam).
5. Sağ üstten **Dağıt > Yeni dağıtım**:
   - Tür: **Web uygulaması**
   - Açıklama: `Yoklama API`
   - Şu kimlikle çalıştır: **Ben**
   - Erişimi olanlar: **Herkes**
6. **Dağıt** deyin, izin isterse Google hesabınızla onaylayın.
7. Çıkan **Web uygulaması URL'sini** kopyalayın (`https://script.google.com/macros/s/.../exec`).

> Kodda sonradan değişiklik yaparsanız **Dağıt > Dağıtımları yönet > Düzenle > Sürüm: Yeni sürüm** diyerek yeniden dağıtmanız gerekir, yoksa eski kod çalışmaya devam eder.

## Adım 2 – index.html ayarları

`index.html` dosyasını bir metin editörüyle açın ve `// --- YAPILANDIRMA ---` bölümünü düzenleyin:

```js
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/....../exec"; // Adım 1'deki URL
const SINIF_LAT = 38.419200;
const SINIF_LNG = 27.128700;
const MAX_MESAFE_METRE = 45;
```

Koordinatlar `Code.gs` ile aynı olmalı.

## Adım 3 – Yayınlama (GitHub Pages, ücretsiz)

Öğrencilerin telefonundan konum izni verebilmesi için sayfanın **https** ile açılması şart. En kolay yol GitHub Pages:

1. github.com'da yeni bir **public** repo oluşturun (ör. `yoklama`).
2. `index.html` dosyasını repoya yükleyin (Add file > Upload files).
3. Repo **Settings > Pages > Branch: main / (root) > Save**.
4. 1-2 dakika sonra adresiniz hazır: `https://KULLANICIADI.github.io/yoklama/`

Alternatif: Netlify Drop (app.netlify.com/drop) sayfasına klasörü sürükleyip bırakmak da yeterlidir.

## Adım 4 – Sınıfta kullanım

1. Projeksiyona şu adresi açın: `https://KULLANICIADI.github.io/yoklama/?teacher=true`
   - Ekranda öğrenci adresinin **QR kodu** ve 30 saniyede bir değişen **PIN** görünür.
2. Öğrenciler QR kodu kendi internetleriyle okutur, numara + ad soyad + anlık PIN girer.
3. Sistem şunları kontrol eder:
   - PIN geçerli mi (şu anki veya bir önceki 30 sn penceresi)
   - GPS konumu sınıfa `MAX_MESAFE_METRE` içinde mi (hem telefonda hem sunucuda)
   - Aynı öğrenci numarası bugün daha önce kayıt yaptı mı
4. Kayıtlar E-Tablo'daki `Yoklama` sayfasına düşer: Tarih, Saat, Öğrenci No, Ad Soyad, Uzaklık.

## Bilgisayarda yerel test

Yayınlamadan önce denemek için klasörde şu komutu çalıştırıp tarayıcıda `http://localhost:8000` adresini açın (localhost'ta konum izni https olmadan da çalışır):

```bash
cd ~/Yoklama && python3 -m http.server 8000
```

Öğretmen ekranı: `http://localhost:8000/?teacher=true`

## Bilinmesi gerekenler

- Bina içinde GPS hassasiyeti 20-50 m sapabilir. `MAX_MESAFE_METRE` değerini ilk derste deneyerek ayarlayın (gerekirse 60-80 m yapın).
- PIN sunucu saatine göre üretilir; öğretmen ekranı açılışta sunucudan saati alıp kendini senkronize eder.
- Orijinal öneriden farklar: mükerrer kontrolü artık **aynı gün** içindir (dönem boyu değil), GPS kontrolü sunucuda da yapılır, tabloya başlık satırı ve uzaklık sütunu eklenir, projeksiyon ekranında QR kod otomatik üretilir.
