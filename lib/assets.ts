export type AssetCredit = {
  filename: string;
  author: string;
  source: string;
  license: string;
  date: string;
};

/** Kredit yang ditampilkan halaman /tentang; disimpan di kode agar build tidak
 * bergantung pada ASSETS.md yang sengaja dikecualikan dari repositori. */
export const assetCredits: AssetCredit[] = [
  {
    filename: "Ikon antarmuka (lucide-react)",
    author: "Lucide Icons and Contributors; Cole Bemis (ikon turunan Feather)",
    source: "https://github.com/lucide-icons/lucide/blob/main/LICENSE",
    license: "ISC; MIT untuk ikon turunan Feather",
    date: "2026-11-16",
  },
  {
    filename: "Komponen tombol (components/ui/button.tsx, diadaptasi)",
    author: "shadcn",
    source: "https://github.com/shadcn-ui/ui/blob/main/LICENSE.md",
    license: "MIT",
    date: "2026-11-16",
  },
  {
    filename: "Grafik Laboratorium Quantum (recharts)",
    author: "Recharts contributors",
    source: "https://github.com/recharts/recharts/blob/master/LICENSE",
    license: "MIT",
    date: "2026-11-16",
  },
  {
    filename: "SVG proses, CPU, antrean, dan pengantar",
    author: "Tim Putar SO",
    source: "Kode sumber proyek ini",
    license: "Buatan sendiri",
    date: "2026-11-16",
  },
  {
    filename: "Transisi SVG/CSS/WAAPI",
    author: "Tim Putar SO",
    source: "Kode sumber proyek ini",
    license: "Buatan sendiri",
    date: "2026-11-16",
  },
];
