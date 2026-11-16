import { assetCredits } from "@/lib/assets";

export default function AboutPage() {
  return <main className="content-page">
    <p className="eyebrow">Kredit & transparansi</p>
    <h1>Tentang Putar SO</h1>
    <p className="page-lede">Alat peraga penjadwalan CPU Round Robin untuk mata kuliah Sistem Operasi. Belajar dilakukan dengan mengamati konfigurasi dan akibatnya, bukan kuis atau skor.</p>
    <section className="paper-panel">
      <h2>Dibuat untuk eksplorasi</h2>
      <p className="mt-3 leading-8">Seluruh penjadwalan berjalan di peramban memakai satu mesin simulasi murni. Tidak ada akun, basis data, atau pengiriman skenario ke server. Materi dan contoh acuan mengikuti PRD Putar SO v1.0.</p>
      <p className="mt-3 leading-8">Ilustrasi merupakan SVG geometris inline, bukan aset dari model generatif gambar. Bentuk proses dipakai ulang pada pengantar, simulator, dan laboratorium. Ikon berasal dari Lucide; font menggunakan font sistem.</p>
    </section>
    <section className="paper-panel">
      <h2>Aset pihak ketiga & lisensi</h2>
      <p className="my-3 text-sm text-slate-600">Daftar kredit ini dikelola di kode aplikasi dan selaras dengan inventaris ASSETS.md.</p>
      <div className="overflow-x-auto">
        <table className="simple-table"><thead><tr><th>Aset / berkas</th><th>Pembuat</th><th>Sumber</th><th>Lisensi</th><th>Tanggal diambil</th></tr></thead>
          <tbody>{assetCredits.map((asset) => <tr key={asset.filename}><th>{asset.filename}</th><td>{asset.author}</td><td>{asset.source.startsWith("https://") ? <a className="text-link" href={asset.source} target="_blank" rel="noreferrer">Sumber lisensi ↗</a> : asset.source}</td><td>{asset.license}</td><td>{asset.date}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  </main>;
}
