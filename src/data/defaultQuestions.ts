import { Question } from '../types';

export const defaultQuestions: Question[] = [
  {
    id: 1,
    question: "Perkembangan teknologi kecerdasan buatan (AI) telah menggantikan banyak pekerjaan manusia, namun di sisi lain memunculkan profesi baru seperti AI Prompt Engineer. Fenomena ini menunjukkan bahwa perubahan sosial...",
    options: [
      { id: "A", text: "Bersifat ambivalen, selalu membawa dampak positif dan negatif secara bersamaan dalam struktur masyarakat.", isCorrect: true },
      { id: "B", text: "Hanya menguntungkan kelompok kapitalis yang memiliki modal besar untuk membeli teknologi.", isCorrect: false },
      { id: "C", text: "Selalu bersifat regresif karena mengurangi kesempatan kerja masyarakat kelas bawah.", isCorrect: false },
      { id: "D", text: "Membawa masyarakat menuju era kemunduran peradaban karena ketergantungan pada mesin.", isCorrect: false },
      { id: "E", text: "Adalah proses linear yang pada akhirnya akan menghancurkan sistem sosial itu sendiri.", isCorrect: false }
    ],
    explanation: "HOTS Analisis (C4): Perubahan sosial, khususnya akibat inovasi teknologi (invention), memiliki sifat ambivalen atau bermuka dua. Ia menghancurkan struktur lama (kehilangan pekerjaan) namun sekaligus menciptakan struktur baru (profesi baru).",
    mapel: "Sosiologi",
    subTopik: "Perubahan Sosial & Teknologi"
  },
  {
    id: 2,
    question: "Banyak masyarakat pedesaan kini beralih menggunakan e-commerce untuk memasarkan hasil bumi mereka langsung ke konsumen kota. Jika ditinjau dari teori evolusi unilinear, fenomena ini diinterpretasikan sebagai...",
    options: [
      { id: "A", text: "Tahapan perkembangan linier menuju masyarakat industri modern yang rasional.", isCorrect: true },
      { id: "B", text: "Bentuk kemunduran tradisi agraris akibat intervensi kapitalisme global.", isCorrect: false },
      { id: "C", text: "Siklus berulang di mana masyarakat desa akan kembali ke sistem barter.", isCorrect: false },
      { id: "D", text: "Konflik kelas antara tengkulak tradisional dan platform e-commerce asing.", isCorrect: false },
      { id: "E", text: "Cultural lag, karena masyarakat desa belum siap menerima teknologi digital.", isCorrect: false }
    ],
    explanation: "HOTS Evaluasi (C5): Teori evolusi unilinear berasumsi semua masyarakat melewati tahapan yang sama. Penggunaan e-commerce menunjukkan transisi dari masyarakat tradisional menuju masyarakat modern/industri yang mengedepankan efisiensi dan rasionalitas pasar.",
    mapel: "Sosiologi",
    subTopik: "Teori Evolusi Sosial"
  },
  {
    id: 3,
    question: "Di era globalisasi, arus informasi dari negara-negara maju mendominasi media massa di negara berkembang, seringkali membawa nilai-nilai yang bertentangan dengan norma lokal. Tindakan paling rasional bagi masyarakat lokal untuk menghadapi hal ini adalah...",
    options: [
      { id: "A", text: "Melakukan glokalisasi, yaitu mengadopsi teknologi global namun mengisinya dengan nilai-nilai dan kearifan lokal.", isCorrect: true },
      { id: "B", text: "Menutup akses internet sepenuhnya (isolasi) untuk melindungi generasi muda dari pengaruh buruk.", isCorrect: false },
      { id: "C", text: "Mengadopsi seluruh budaya asing secara membabi buta agar dianggap sebagai masyarakat modern.", isCorrect: false },
      { id: "D", text: "Melakukan demonstrasi anarkis untuk menolak segala bentuk investasi dan budaya asing.", isCorrect: false },
      { id: "E", text: "Menciptakan budaya tandingan yang bertujuan untuk menghancurkan kebudayaan negara maju.", isCorrect: false }
    ],
    explanation: "HOTS Mencipta/Sintesis (C6): Memblokir atau mengisolasi adalah hal mustahil di era global. Solusi sosiologis yang adaptif adalah glokalisasi: membekali generasi dengan literasi kritis (filter) sekaligus memperkuat fundamental lokal (identitas).",
    mapel: "Sosiologi",
    subTopik: "Globalisasi & Glokalisasi"
  },
  {
    id: 4,
    question: "Sebuah perusahaan multinasional merelokasi pabriknya dari negara maju ke negara berkembang demi upah buruh yang murah. Dampak sosiologis jangka panjang yang paling mungkin terjadi pada komunitas lokal di negara berkembang tersebut adalah...",
    options: [
      { id: "A", text: "Terjadinya transformasi mata pencaharian dari agraris ke industrial yang memicu perubahan struktur kelas sosial.", isCorrect: true },
      { id: "B", text: "Penurunan tingkat kriminalitas karena semua penduduk desa otomatis menjadi pekerja pabrik yang sejahtera.", isCorrect: false },
      { id: "C", text: "Kembalinya sistem feodalisme di mana pemilik pabrik bertindak sebagai raja atas kaum buruh.", isCorrect: false },
      { id: "D", text: "Hilangnya sama sekali konflik sosial karena kebutuhan ekonomi masyarakat telah terpenuhi penuh.", isCorrect: false },
      { id: "E", text: "Evolusi biologis masyarakat lokal akibat paparan limbah industri asing.", isCorrect: false }
    ],
    explanation: "HOTS Analisis (C4): Industrialisasi di wilayah baru akan menggeser basis ekonomi (agraris ke industri). Hal ini mengubah stratifikasi sosial, munculnya kelas buruh (proletar), kelas manajerial, dan berpotensi menggeser nilai-nilai gotong royong menjadi individualistis.",
    mapel: "Sosiologi",
    subTopik: "Industrialisasi & Struktur Sosial"
  },
  {
    id: 5,
    question: "Tren <i>fast fashion</i> menyebabkan siklus pergantian model pakaian sangat cepat. Di satu sisi menggerakkan ekonomi kreatif, di sisi lain menciptakan limbah tekstil raksasa dan perilaku konsumtif. Fenomena ini menggambarkan...",
    options: [
      { id: "A", text: "Ambivalensi globalisasi, di mana kemajuan ekonomi dibarengi dengan degradasi ekologi dan nilai sosial.", isCorrect: true },
      { id: "B", text: "Kemenangan kapitalisme murni yang selalu membawa kesejahteraan bagi konsumen dan produsen.", isCorrect: false },
      { id: "C", text: "Proses akulturasi budaya yang harmonis antara desain lokal dan mesin produksi global.", isCorrect: false },
      { id: "D", text: "Penetrasi kebudayaan secara paksa (penetration pacifique) oleh negara adidaya.", isCorrect: false },
      { id: "E", text: "Modernisasi yang berjalan sesuai dengan teori evolusi unilinear Comte.", isCorrect: false }
    ],
    explanation: "HOTS Evaluasi (C5): Konsep ambivalensi menunjukkan adanya dua sisi koin yang berlawanan. Globalisasi fast fashion memajukan pasar (positif) namun mengeksploitasi lingkungan dan menciptakan hedonisme (negatif).",
    mapel: "Sosiologi",
    subTopik: "Globalisasi & Lingkungan"
  },
  {
    id: 6,
    question: "Seorang remaja mengalami kebingungan identitas karena di rumah diajarkan nilai patriarki tradisional, namun di media sosial ia terpapar kuat oleh nilai kesetaraan gender (feminisme) global. Kondisi psikologis-sosiologis ini disebut...",
    options: [
      { id: "A", text: "Cultural shock, akibat perbenturan nilai yang kontras dalam proses sosialisasi yang berjalan bersamaan.", isCorrect: true },
      { id: "B", text: "Anomie, hilangnya sama sekali norma di masyarakat sehingga remaja bertindak kriminal.", isCorrect: false },
      { id: "C", text: "Asimilasi, peleburan dua budaya yang menghasilkan budaya baru tanpa sisa budaya lama.", isCorrect: false },
      { id: "D", text: "Etnosentrisme, sikap remaja yang merendahkan kebudayaan asing.", isCorrect: false },
      { id: "E", text: "Dekadensi moral, yang selalu terjadi pada setiap remaja pengguna media sosial.", isCorrect: false }
    ],
    explanation: "HOTS Analisis (C4): Gegar budaya (Cultural shock) tidak hanya terjadi saat berpindah tempat fisik, tapi juga saat terpapar sistem nilai baru yang sangat berbeda melalui media digital, menyebabkan disorientasi pribadi.",
    mapel: "Sosiologi",
    subTopik: "Gegar Budaya & Sosialisasi"
  },
  {
    id: 7,
    question: "Sistem kerja jarak jauh (Remote Working/WFH) akibat pandemi menjadi permanen di banyak perusahaan. Secara sosiologis, ini mengubah batasan ruang privat (rumah) dan ruang publik (kantor). Konsekuensi logis dari perubahan ini adalah...",
    options: [
      { id: "A", text: "Redefinisi peran institusi keluarga dan kaburnya batas antara waktu kerja dan waktu domestik.", isCorrect: true },
      { id: "B", text: "Meningkatnya solidaritas mekanis di lingkungan tempat tinggal karena intensitas pertemuan tatap muka.", isCorrect: false },
      { id: "C", text: "Penurunan tingkat stres secara absolut karena pekerja tidak perlu lagi keluar rumah.", isCorrect: false },
      { id: "D", text: "Melemahnya sistem kapitalisme karena perusahaan kehilangan kontrol atas pekerjanya.", isCorrect: false },
      { id: "E", text: "Kembalinya masyarakat ke fase pra-industri yang bergantung pada alam.", isCorrect: false }
    ],
    explanation: "HOTS Evaluasi (C5): Kerja remote menginvasi ruang privat. Rumah yang tadinya tempat istirahat menjadi tempat produksi. Ini merekonstruksi peran keluarga dan manajemen batas (boundary management) antara karir dan kehidupan domestik.",
    mapel: "Sosiologi",
    subTopik: "Perubahan Struktur Kerja"
  },
  {
    id: 8,
    question: "Masyarakat Bali mempertahankan tradisi Nyepi, di mana selama 24 jam internet dan aktivitas luar ruangan dihentikan, di tengah gempuran modernisasi pariwisata. Fakta ini membantah teori homogenisasi global karena...",
    options: [
      { id: "A", text: "Masyarakat lokal masih memiliki resiliensi kultural dan agen (agency) untuk memfilter arus globalisasi.", isCorrect: true },
      { id: "B", text: "Globalisasi tidak pernah berhasil masuk ke wilayah yang berstatus kepulauan.", isCorrect: false },
      { id: "C", text: "Pariwisata selalu menghancurkan tradisi asli tanpa terkecuali.", isCorrect: false },
      { id: "D", text: "Pemerintah secara otoriter mengisolasi Bali dari dunia internasional selamanya.", isCorrect: false },
      { id: "E", text: "Masyarakat Bali menolak seluruh bentuk teknologi dari luar secara total.", isCorrect: false }
    ],
    explanation: "HOTS Sintesis (C6): Homogenisasi (McDonaldisasi) berasumsi seluruh dunia akan seragam. Nyepi membuktikan tesis heterogenisasi/glokalisasi: lokalitas bisa bertahan, menyesuaikan, dan bahkan membatasi kekuatan global melalui resiliensi kultural.",
    mapel: "Sosiologi",
    subTopik: "Kearifan Lokal & Resiliensi"
  },
  {
    id: 9,
    question: "Munculnya profesi baru seperti Content Creator, AI Prompter, dan Data Analyst merupakan wujud perubahan sosial yang disebabkan oleh...",
    options: [
      { id: "A", text: "Inovasi teknologi (Discovery/Invention) yang merestrukturisasi sistem pembagian kerja masyarakat.", isCorrect: true },
      { id: "B", text: "Konflik kelas antara kaum borjuis dan proletar dalam memperebutkan alat produksi klasik.", isCorrect: false },
      { id: "C", text: "Perubahan lingkungan fisik dan bencana alam yang memaksa adaptasi pekerjaan.", isCorrect: false },
      { id: "D", text: "Pengaruh difusi budaya primitif yang direvitalisasi ke bentuk modern.", isCorrect: false },
      { id: "E", text: "Kebijakan politik isolasionisme yang memaksa warga menciptakan pekerjaan sendiri.", isCorrect: false }
    ],
    explanation: "HOTS Analisis (C4): Perkembangan teknologi digital adalah agen perubahan (invention). Menurut Durkheim, ini mendorong pembagian kerja yang semakin kompleks (solidaritas organis) dengan spesialisasi profesi yang sangat tinggi.",
    mapel: "Sosiologi",
    subTopik: "Inovasi Teknologi & Profesi Baru"
  },
  {
    id: 10,
    question: "Meskipun undang-undang kesetaraan ras telah disahkan bertahun-tahun lalu di suatu negara, praktik diskriminasi dalam proses rekrutmen kerja masih sering terjadi secara terselubung. Ini menunjukkan bahwa...",
    options: [
      { id: "A", text: "Perubahan hukum (institusi formal) seringkali lebih cepat daripada perubahan <i>mindset</i> atau budaya masyarakat.", isCorrect: true },
      { id: "B", text: "Undang-undang tidak memiliki kekuatan memaksa dalam sistem sosial demokratis.", isCorrect: false },
      { id: "C", text: "Masyarakat selalu menolak perubahan yang direncanakan oleh pemerintah.", isCorrect: false },
      { id: "D", text: "Perubahan evolusioner selalu gagal diterapkan dalam masalah rasial.", isCorrect: false },
      { id: "E", text: "Diskriminasi adalah hukum alam yang tidak dapat diintervensi oleh sistem hukum buatan manusia.", isCorrect: false }
    ],
    explanation: "HOTS Evaluasi (C5): Ini adalah bentuk lain dari Cultural Lag, di mana hukum/regulasi (bisa dianggap elemen formal/material) berubah cepat, namun norma, prasangka, dan kebiasaan yang mengakar (imaterial) lambat berubah.",
    mapel: "Sosiologi",
    subTopik: "Cultural Lag & Hukum"
  },
  {
    id: 11,
    question: "Fenomena 'Cancel Culture' di media sosial sering kali menjatuhkan sanksi sosial kepada individu tanpa melalui proses peradilan yang sah. Dilihat dari teori kontrol sosial, fenomena ini bersifat...",
    options: [
      { id: "A", text: "Disosiatif, karena menciptakan peradilan massa (mob justice) yang mengabaikan pranata hukum resmi.", isCorrect: true },
      { id: "B", text: "Asosiatif, karena menyatukan netizen untuk menegakkan keadilan absolut.", isCorrect: false },
      { id: "C", text: "Preventif, karena selalu berhasil mencegah kejahatan di dunia nyata sepenuhnya.", isCorrect: false },
      { id: "D", text: "Institusional, karena dilakukan oleh lembaga negara yang berwenang.", isCorrect: false },
      { id: "E", text: "Evolutif, sebagai bentuk tertinggi dari sistem hukum demokrasi modern.", isCorrect: false }
    ],
    explanation: "HOTS Analisis (C4): Cancel culture bertindak sebagai kontrol sosial informal yang sangat koersif. Namun, sifatnya disosiatif karena sering memicu konflik, perundungan siber (cyberbullying), dan melangkahi proses peradilan institusional (due process of law).",
    mapel: "Sosiologi",
    subTopik: "Kontrol Sosial & Media Digital"
  },
  {
    id: 12,
    question: "Tingginya urbanisasi ke Jakarta menyebabkan munculnya permukiman kumuh (slum area) di pinggiran sungai. Dampak rentetan (multiplier effect) sosiologis dari perubahan demografis ini adalah...",
    options: [
      { id: "A", text: "Peningkatan patologi sosial seperti kriminalitas akibat kompetisi ekonomi yang keras di ruang terbatas.", isCorrect: true },
      { id: "B", text: "Pemerataan kekayaan karena orang desa membawa modal besar ke kota.", isCorrect: false },
      { id: "C", text: "Terbentuknya asimilasi budaya yang sempurna antara warga lokal dan pendatang tanpa konflik.", isCorrect: false },
      { id: "D", text: "Penurunan tingkat polusi kota karena warga kumuh tidak memiliki kendaraan bermotor.", isCorrect: false },
      { id: "E", text: "Kembalinya nilai-nilai agraris di tengah kota metropolitan karena latar belakang pendatang.", isCorrect: false }
    ],
    explanation: "HOTS Analisis (C4): Perubahan demografis (urbanisasi tak terkendali) menyebabkan overpopulasi dan marginalisasi. Ini bermuara pada patologi sosial (penyakit sosial) akibat disorganisasi sosial dan himpitan ekonomi.",
    mapel: "Sosiologi",
    subTopik: "Urbanisasi & Demografi"
  },
  {
    id: 13,
    question: "Gerakan sosial yang menuntut penanganan krisis iklim (Climate Strike) dipelopori oleh generasi muda di berbagai belahan dunia. Gerakan ini merupakan respons atas dampak negatif modernisasi berupa...",
    options: [
      { id: "A", text: "Eksploitasi sumber daya alam masif yang mengancam keberlanjutan ekologis antargenerasi.", isCorrect: true },
      { id: "B", text: "Kurangnya lapangan kerja di sektor industri ekstraktif bagi lulusan baru.", isCorrect: false },
      { id: "C", text: "Penolakan generasi muda terhadap penggunaan teknologi digital secara umum.", isCorrect: false },
      { id: "D", text: "Keinginan masyarakat global untuk kembali ke sistem pemerintahan monarki.", isCorrect: false },
      { id: "E", text: "Dominasi kebudayaan Timur yang menggeser hegemoni kebudayaan Barat.", isCorrect: false }
    ],
    explanation: "HOTS Evaluasi (C5): Modernisasi dan industrialisasi rakus sering mengorbankan ekologi. Gerakan sosial iklim lahir sebagai antitesis dan upaya korektif dari masyarakat sipil terhadap kegagalan negara/korporasi menjaga lingkungan hidup (teori gerakan sosial baru).",
    mapel: "Sosiologi",
    subTopik: "Gerakan Sosial & Lingkungan"
  },
  {
    id: 14,
    question: "Sebuah program pemberdayaan masyarakat mencoba mengubah kebiasaan masyarakat pesisir dari menangkap ikan dengan bom menjadi menggunakan alat ramah lingkungan. Proses ini sering mengalami kegagalan pada tahap awal karena...",
    options: [
      { id: "A", text: "Masyarakat terikat pada vested interest (kepentingan tertanam) yang memberikan keuntungan ekonomi instan.", isCorrect: true },
      { id: "B", text: "Alat ramah lingkungan selalu lebih mahal dan tidak pernah bisa disediakan oleh pemerintah.", isCorrect: false },
      { id: "C", text: "Masyarakat pesisir secara genetik menolak segala bentuk inovasi dari orang luar.", isCorrect: false },
      { id: "D", text: "Bom ikan merupakan warisan budaya leluhur yang diakui oleh UNESCO.", isCorrect: false },
      { id: "E", text: "Pemerintah tidak pernah memberikan sosialisasi mengenai bahaya bom ikan.", isCorrect: false }
    ],
    explanation: "HOTS Analisis (C4): Vested interest adalah kepentingan yang telah tertanam kuat. Nelayan yang biasa menggunakan bom mendapat hasil instan (ekonomi). Mengubah ini sulit karena mereka merasa inovasi baru akan merugikan pendapatan jangka pendek mereka.",
    mapel: "Sosiologi",
    subTopik: "Pemberdayaan & Vested Interest"
  },
  {
    id: 15,
    question: "Globalisasi memungkinkan K-Pop diterima luas di Indonesia. Banyak remaja meniru gaya berpakaian dan bahasa idolanya. Jika dilihat dari proses interaksi sosial, mekanisme yang terjadi dominan berupa...",
    options: [
      { id: "A", text: "Imitasi dan identifikasi lintas batas negara yang dimediasi oleh teknologi informasi.", isCorrect: true },
      { id: "B", text: "Sugesti hipnotik massa yang menghilangkan kesadaran rasional penggemar.", isCorrect: false },
      { id: "C", text: "Asimilasi total yang menghilangkan identitas keindonesiaan secara permanen.", isCorrect: false },
      { id: "D", text: "Simpati belaka tanpa ada perubahan perilaku di dunia nyata.", isCorrect: false },
      { id: "E", text: "Akomodasi paksaan antara budaya lokal dengan budaya Korea Selatan.", isCorrect: false }
    ],
    explanation: "HOTS Analisis (C4): Interaksi sosial yang terjadi adalah imitasi (meniru gaya) dan identifikasi (ingin menjadi sama dengan idola). Globalisasi memfasilitasi proses psikologis-sosiologis ini terjadi secara transnasional (melewati batas negara).",
    mapel: "Sosiologi",
    subTopik: "Interaksi Sosial & Imitasi"
  },
  {
    id: 16,
    question: "Dalam teori Karl Marx, perubahan sosial digerakkan oleh konflik kelas. Pada era kapitalisme digital saat ini, siapakah yang dapat diposisikan sebagai pemegang 'alat produksi' (borjuis baru)?",
    options: [
      { id: "A", text: "Perusahaan teknologi raksasa (Big Tech) yang menguasai algoritma dan data pengguna.", isCorrect: true },
      { id: "B", text: "Para buruh pabrik yang kini bisa menggunakan smartphone.", isCorrect: false },
      { id: "C", text: "Pemerintah negara berkembang yang mengandalkan utang luar negeri.", isCorrect: false },
      { id: "D", text: "Konsumen yang memiliki kebebasan memilih produk di e-commerce.", isCorrect: false },
      { id: "E", text: "Akademisi yang menulis teori-teori sosiologi kontemporer.", isCorrect: false }
    ],
    explanation: "HOTS Sintesis/Evaluasi (C5-C6): Dalam kapitalisme pengawasan (surveillance capitalism), 'alat produksi' bukan lagi sekadar mesin pabrik, melainkan kepemilikan atas server, algoritma, dan Big Data. Big Tech adalah borjuis baru yang mengeksploitasi data (sebagai komoditas baru).",
    mapel: "Sosiologi",
    subTopik: "Teori Konflik & Kapitalisme Digital"
  },
  {
    id: 17,
    question: "Masuknya investasi asing ke daerah terpencil sering kali dibarengi dengan pembebasan lahan warga adat. Terjadi konflik agraria karena perbedaan persepsi: investor memandang tanah sebagai komoditas, warga adat memandangnya sebagai ruang spiritual. Solusi sosiologis berbasis kearifan lokal adalah...",
    options: [
      { id: "A", text: "Menerapkan pendekatan mediasi partisipatif yang mengakui hak ulayat dan pembagian keuntungan yang adil (profit sharing).", isCorrect: true },
      { id: "B", text: "Mengusir investor secara paksa dengan menggunakan kekuatan milisi masyarakat adat.", isCorrect: false },
      { id: "C", text: "Pemerintah mengambil alih paksa tanah adat atas nama pembangunan nasional yang otoriter.", isCorrect: false },
      { id: "D", text: "Membiarkan mekanisme pasar bebas menentukan harga tanah tanpa campur tangan.", isCorrect: false },
      { id: "E", text: "Mendoktrin masyarakat adat agar membuang kepercayaan spiritual mereka demi modernisasi.", isCorrect: false }
    ],
    explanation: "HOTS Sintesis (C6): Konflik ini berakar pada benturan nilai. Solusi sosiologis bukan dengan pemaksaan (koersi), melainkan akomodasi (mediasi). Mengakui hak ulayat dan integrasi ekonomi berkelanjutan adalah jalan keluar resolusi konflik.",
    mapel: "Sosiologi",
    subTopik: "Konflik Agraria & Akomodasi"
  },
  {
    id: 18,
    question: "Pendidikan saat ini dituntut untuk menghasilkan lulusan yang berpikir kritis (HOTS), bukan sekadar menghafal. Tuntutan ini merupakan respons dari sistem pendidikan terhadap tuntutan perubahan sosial di era revolusi industri 4.0, agar...",
    options: [
      { id: "A", text: "Manusia tidak tergantikan oleh kecerdasan buatan (AI) dalam hal kreativitas dan pemecahan masalah kompleks.", isCorrect: true },
      { id: "B", text: "Sekolah bisa menetapkan biaya pendidikan yang lebih mahal dengan alasan kurikulum internasional.", isCorrect: false },
      { id: "C", text: "Siswa menjadi patuh sepenuhnya terhadap doktrin otoritas tanpa berani bertanya.", isCorrect: false },
      { id: "D", text: "Menghapuskan sama sekali pengajaran ilmu sosial dan humaniora di masa depan.", isCorrect: false },
      { id: "E", text: "Memastikan semua lulusan menjadi pegawai negeri sipil yang terstandarisasi.", isCorrect: false }
    ],
    explanation: "HOTS Analisis (C4): Revolusi industri 4.0 mengotomatisasi pekerjaan rutin. Pendidikan (sebagai institusi sosial) harus beradaptasi (fungsi adaptasi Parson) dengan menghasilkan individu dengan skill yang tidak dimiliki mesin: nalar kritis, empati, dan kreativitas kompleks.",
    mapel: "Sosiologi",
    subTopik: "Institusi Pendidikan & Adaptasi"
  },
  {
    id: 19,
    question: "Di tengah tren globalisasi makanan cepat saji (fast food), masyarakat Minangkabau sukses mempopulerkan Rendang hingga diakui dunia. Strategi pelestarian budaya ini membuktikan bahwa...",
    options: [
      { id: "A", text: "Kearifan lokal memiliki daya saing global jika diadaptasikan dengan strategi diplomasi budaya modern.", isCorrect: true },
      { id: "B", text: "Globalisasi hanya bisa dikalahkan jika masyarakat menolak total produk asing.", isCorrect: false },
      { id: "C", text: "Rendang telah mengalami homogenisasi menjadi makanan asing sepenuhnya.", isCorrect: false },
      { id: "D", text: "Budaya lokal harus disubordinasi di bawah kebudayaan mayoritas dunia.", isCorrect: false },
      { id: "E", text: "Sistem sosial masyarakat Minangkabau tertutup terhadap inovasi teknologi.", isCorrect: false }
    ],
    explanation: "HOTS Evaluasi (C5): Eksistensi Rendang di kancah global adalah contoh sukses diplomasi gastro (gastro-diplomacy) dan glokalisasi. Identitas lokal tidak hancur oleh globalisasi, melainkan bisa berekspansi (menjadi pemain global) dengan strategi yang tepat.",
    mapel: "Sosiologi",
    subTopik: "Diplomasi Budaya & Kuliner"
  },
  {
    id: 20,
    question: "Banyak kaum muda kota yang beralih ke gaya hidup minimalis, mengurangi konsumsi barang secara drastis demi ketenangan pikiran dan kelestarian lingkungan. Fenomena ini muncul sebagai gerakan anti-tesis terhadap...",
    options: [
      { id: "A", text: "Budaya konsumerisme dan gaya hidup materialistis yang dipromosikan oleh kapitalisme global.", isCorrect: true },
      { id: "B", text: "Sistem pemerintahan demokratis yang gagal menyediakan subsidi barang murah.", isCorrect: false },
      { id: "C", text: "Kemiskinan struktural yang membuat mereka tidak mampu membeli barang mewah.", isCorrect: false },
      { id: "D", text: "Modernisasi yang mengharuskan setiap orang memiliki rumah besar.", isCorrect: false },
      { id: "E", text: "Tradisi asketisme agama kuno yang mewajibkan kemiskinan sukarela.", isCorrect: false }
    ],
    explanation: "HOTS Analisis (C4): Minimalisme adalah gerakan sosial berbasis gaya hidup (lifestyle movement). Ia lahir sebagai antitesis (reaksi penolakan) terhadap norma dominan kapitalisme yang mengukur kesuksesan dari akumulasi materi (konsumerisme akut).",
    mapel: "Sosiologi",
    subTopik: "Gaya Hidup & Anti-Konsumerisme"
  }
];
