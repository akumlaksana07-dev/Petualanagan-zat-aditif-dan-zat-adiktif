export interface StoryBeat {
  id: string;
  chapterLabel: string;
  title: string;
  narrative: string;
  highlightLabel: string;
  highlightText: string;
  theme: 'threat' | 'safe_vs_danger' | 'boss';
}

export interface SortingItem {
  id: string;
  name: string;
  categoryHint: string;
  isSafe: boolean;
  explanation: string;
}

export interface EffectRound {
  id: string;
  prompt: string;
  substanceTag: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const STORY_PROLOGUE: StoryBeat[] = [
  {
    id: 'beat-1',
    chapterLabel: 'Prolog · Bab 1 dari 3',
    title: 'Krisis di Kerajaan Nutrisi',
    narrative:
      'Dahulu, Kerajaan Nutrisi hidup sehat berkat bahan pangan alami dari alam. Suatu malam, pasukan Raja Zat Adiktif menyusup ke pasar dan dapur warga, mengganti bahan alami dengan zat kimia terlarang dan zat pembuat kecanduan.',
    highlightLabel: 'Mengapa Mario Bertindak?',
    highlightText:
      'Sebagai Penjaga Pangan Kerajaan, Mario harus turun langsung menyelamatkan persediaan makanan sehat sebelum seluruh warga jatuh sakit.',
    theme: 'threat',
  },
  {
    id: 'beat-2',
    chapterLabel: 'Prolog · Bab 2 dari 3',
    title: 'Membedakan Zat Aman dan Zat Berbahaya',
    narrative:
      'Di sepanjang perjalanan, Mario akan menemukan zat aditif alami yang aman—seperti Kunyit, Daun Suji, Gula Aren, Stevia, Garam, Asam Sitrat, dan Vitamin—yang memberi energi serta perisai pelindung tubuh.',
    highlightLabel: 'Waspada Zat Terlarang',
    highlightText:
      'Sebaliknya, Rhodamin B, Methanil Yellow, Formalin, dan Boraks adalah bahan tekstil atau pengawet mayat beracun yang harus dihindari atau disingkirkan dari atas!',
    theme: 'safe_vs_danger',
  },
  {
    id: 'beat-3',
    chapterLabel: 'Prolog · Bab 3 dari 3',
    title: 'Misi Puncak: Lawan Raja Zat Adiktif',
    narrative:
      'Di balik seluruh kekacauan berdiri Raja Zat Adiktif—gabungan Nikotin, Tar, dan Narkotika—yang menyebarkan ketergantungan semu dan merusak sistem saraf serta paru-paru.',
    highlightLabel: 'Cara Mengalahkan Bos Akhir',
    highlightText:
      'Kumpulkan Kapsul Anti-Adiksi dari blok tanda tanya [?], tembakkan dengan tombol F / Shift, atau injak kepalanya saat ia kelelahan di Benteng Terakhir!',
    theme: 'boss',
  },
];

export const LEVEL_TRANSITION_STORIES: Record<
  number,
  {
    chapterLabel: string;
    title: string;
    story: string;
    miniGameTitle: string;
    miniGameSubtitle: string;
    miniGameType: 'sorting' | 'effects';
  }
> = {
  1: {
    chapterLabel: 'Transisi Level 1 → Level 2',
    title: 'Lembah Pewarna & Pemanis Telah Bersih!',
    story:
      'Mario berhasil mengusir Rhodamin B dan Methanil Yellow dari Lembah Pewarna. Namun kurir kerajaan membawa kabar darurat: gudang pengawet di Kota Pengawet & Penyedap telah disusupi Formalin dan Boraks! Sebelum masuk kota, bantu dapur kerajaan menyortir bahan aman dan berbahaya.',
    miniGameTitle: 'Mini-Game 1: Sortir Bahan Dapur Kerajaan',
    miniGameSubtitle:
      'Tentukan apakah zat yang muncul termasuk Zat Aman untuk pangan atau Zat Berbahaya yang harus ditolak!',
    miniGameType: 'sorting',
  },
  2: {
    chapterLabel: 'Transisi Level 2 → Level 3',
    title: 'Menuju Gerbang Benteng Raja Zat Adiktif!',
    story:
      'Formalin dan Boraks berhasil dihentikan! Kini Mario berdiri tepat di depan Benteng Zat Adiktif, markas Nikotin, Alkohol, dan Raja Tar-Narkotika. Selesaikan uji dampak zat di laboratorium lapangan untuk merakit Perisai Vitamin dan Kapsul Anti-Adiksi sebelum bertarung melawan Bos Akhir!',
    miniGameTitle: 'Mini-Game 2: Lab Uji Dampak Zat & Persiapan Lawan Bos',
    miniGameSubtitle:
      'Cocokkan setiap zat aditif dan zat adiktif dengan dampak nyatanya bagi tubuh manusia.',
    miniGameType: 'effects',
  },
};

export const SORTING_MINIGAME_ITEMS: SortingItem[] = [
  {
    id: 'sm-1',
    name: 'Kunyit (Kurkumin)',
    categoryHint: 'Pewarna Kuning Makanan',
    isSafe: true,
    explanation: 'Kunyit adalah pewarna kuning alami yang aman dan kaya antioksidan.',
  },
  {
    id: 'sm-2',
    name: 'Rhodamin B',
    categoryHint: 'Pewarna Merah Terang',
    isSafe: false,
    explanation: 'Rhodamin B adalah pewarna tekstil beracun yang dilarang untuk makanan!',
  },
  {
    id: 'sm-3',
    name: 'Daun Stevia',
    categoryHint: 'Pemanis Ekstrak Tanaman',
    isSafe: true,
    explanation: 'Stevia adalah pemanis alami rendah kalori yang aman bagi tubuh.',
  },
  {
    id: 'sm-4',
    name: 'Formalin',
    categoryHint: 'Larutan Pengawet',
    isSafe: false,
    explanation: 'Formalin adalah pengawet mayat yang merusak lambung, hati, dan ginjal.',
  },
  {
    id: 'sm-5',
    name: 'Asam Sitrat (Jeruk)',
    categoryHint: 'Pengawet & Pengatur Asam',
    isSafe: true,
    explanation: 'Asam sitrat alami dari buah jeruk aman menghambat pertumbuhan bakteri.',
  },
  {
    id: 'sm-6',
    name: 'Boraks (Bleng)',
    categoryHint: 'Pengenyal Bakso Ilegal',
    isSafe: false,
    explanation: 'Boraks adalah antiseptik/pengawet kayu beracun yang memicu gagal ginjal.',
  },
];

export const EFFECT_MATCH_MINIGAME_ROUNDS: EffectRound[] = [
  {
    id: 'em-1',
    substanceTag: 'Nikotin (Zat Adiktif Rokok)',
    prompt: 'Mengapa Nikotin sangat sulit dihentikan oleh perokok?',
    options: [
      'Memicu pelepasan dopamin semu sehingga menimbulkan ketergantungan kuat',
      'Mengubah vitamin C menjadi gula tebu di dalam darah',
      'Membantu memperlebar pembuluh darah paru-paru secara alami',
    ],
    correctIndex: 0,
    explanation:
      'Nikotin merangsang reseptor otak melepaskan dopamin secara cepat sehingga tubuh terus menuntut asupan ulang (adiksi).',
  },
  {
    id: 'em-2',
    substanceTag: 'Alkohol (Etanol)',
    prompt: 'Apa efek utama Alkohol terhadap sistem saraf pusat manusia?',
    options: [
      'Bertindak sebagai depresan yang memperlambat saraf, keseimbangan, dan kesadaran',
      'Menjadi pewarna alami yang menyehatkan organ hati',
      'Meningkatkan daya tahan tubuh terhadap formalin',
    ],
    correctIndex: 0,
    explanation:
      'Alkohol menekan kerja sistem saraf pusat (depresan) dan berisiko merusak hati (sirosis).',
  },
  {
    id: 'em-3',
    substanceTag: 'Garam Dapur (NaCl)',
    prompt: 'Bagaimana cara Garam Dapur mengawetkan ikan asin secara aman?',
    options: [
      'Menarik air dari sel bakteri pembusuk melalui proses osmosis',
      'Melapisi ikan dengan pewarna tekstil kuning',
      'Membekukan seluruh sel saraf pada manusia',
    ],
    correctIndex: 0,
    explanation:
      'Kadar garam tinggi menarik air keluar dari mikroba pembusuk sehingga bakteri tidak bisa berkembang biak.',
  },
  {
    id: 'em-4',
    substanceTag: 'Tar (Residu Asap Rokok)',
    prompt: 'Bahaya paling fatal dari pengendapan Tar pada organ pernapasan adalah...',
    options: [
      'Mengendap lengket di alveolus paru-paru dan memicu kanker paru',
      'Menambah aroma gurih alami seperti kaldu jamur',
      'Menguatkan tulang dan mencegah dehidrasi',
    ],
    correctIndex: 0,
    explanation:
      'Tar mengandung ribuan senyawa kimia karsinogenik yang menempel di silia dan jaringan paru-paru.',
  },
  {
    id: 'em-5',
    substanceTag: 'Methanil Yellow',
    prompt: 'Apa akibat mengonsumsi jajanan yang dicampur Methanil Yellow?',
    options: [
      'Keracunan sistem saraf, kerusakan hati, dan risiko tumor',
      'Memberikan antioksidan pelindung seperti buah naga',
      'Menurunkan kadar gula darah secara aman',
    ],
    correctIndex: 0,
    explanation:
      'Methanil Yellow adalah pewarna cat dan tekstil yang dilarang keras masuk ke dalam pangan.',
  },
];
