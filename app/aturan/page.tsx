import Link from "next/link";

const rules = [
  "Waktu bersifat diskret, berupa bilangan bulat, dimulai dari t = 0.",
  "Antrean siap bersifat FIFO: yang masuk lebih dulu berada di depan.",
  "Proses di CPU berjalan selama min(quantum, sisa burst).",
  "Jika sisa burst habis, proses selesai dan CPU mengambil proses terdepan.",
  "Jika quantum habis dan sisa burst masih ada, proses di-preempt ke ekor antrean.",
  "Bawaan aturan seri: proses yang tiba tepat saat preempsi masuk antrean lebih dulu, baru proses yang di-preempt. Simulator menyediakan konvensi sebaliknya.",
  "Proses yang tiba pada waktu yang sama diurutkan menurut nomor proses.",
  "Jika antrean kosong dan masih ada proses yang belum tiba, CPU menganggur (idle); Gantt menampilkan blok kosong.",
  "Jika proses di-preempt tetapi tidak ada proses lain mengantre, proses itu langsung lanjut. Ini tidak dihitung sebagai context switch.",
  "Context switch dihitung setiap kali CPU berganti dari satu proses ke proses lain yang berbeda.",
];
const reference = [
  ["P1", 0, 5, 14, 14, 9, 0],
  ["P2", 1, 3, 11, 10, 7, 1],
  ["P3", 2, 6, 16, 14, 8, 2],
  ["P4", 4, 2, 10, 6, 4, 4],
];

export default function RulesPage() {
  return <main className="content-page">
    <p className="eyebrow">Konvensi dibuat eksplisit</p>
    <h1>Aturan yang dipakai</h1>
    <p className="page-lede">Buku teks dapat memakai konvensi berbeda. Putar memakai sepuluh aturan berikut agar setiap giliran dapat ditelusuri.</p>
    <section className="paper-panel">
      <h2>Sepuluh aturan Round Robin</h2>
      <ol className="rules-list">{rules.map((rule) => <li key={rule}>{rule}</li>)}</ol>
    </section>
    <section className="paper-panel">
      <h2>Rumus metrik</h2>
      <dl className="formula-list">
        <div><dt>Waktu selesai (completion)</dt><dd>Waktu ketika proses menuntaskan seluruh burst.</dd></div>
        <div><dt>Turnaround</dt><dd>Completion − Arrival</dd></div>
        <div><dt>Waktu tunggu (waiting)</dt><dd>Turnaround − Burst</dd></div>
        <div><dt>Waktu respons (response)</dt><dd>Waktu pertama kali masuk CPU − Arrival</dd></div>
        <div><dt>Utilisasi CPU</dt><dd>Waktu eksekusi proses ÷ waktu total sejak t = 0 × 100%</dd></div>
        <div><dt>Throughput</dt><dd>Jumlah proses selesai ÷ waktu total sejak t = 0</dd></div>
      </dl>
      <p className="mt-4 text-sm text-slate-600">Biaya context switch menggunakan waktu tetapi bukan eksekusi burst. Rata-rata akhir dihitung atas seluruh proses.</p>
    </section>
    <section className="paper-panel">
      <h2>Contoh acuan · PRD 7.1</h2>
      <p className="my-3">Quantum = 2, biaya context switch = 0, kedatangan lebih dulu pada aturan seri.</p>
      <div className="overflow-x-auto">
        <table className="simple-table"><caption>Perhitungan per proses</caption><thead><tr>{["Proses", "Arrival", "Burst", "Completion", "Turnaround", "Waiting", "Response"].map((label) => <th key={label}>{label}</th>)}</tr></thead>
          <tbody>{reference.map((row) => <tr key={row[0]}>{row.map((value, index) => index === 0 ? <th key={index}>{value}</th> : <td key={index}>{value}</td>)}</tr>)}</tbody>
          <tfoot><tr><th>Rata-rata</th><td>—</td><td>—</td><td>12,75</td><td>11</td><td>7</td><td>1,75</td></tr></tfoot>
        </table>
      </div>
      <pre className="reference-gantt" aria-label="Gantt contoh acuan">{`| P1 | P2 | P3 | P1 | P4 | P2 | P3 | P1 | P3 |
0    2    4    6    8    10   11   13   14   16`}</pre>
      <p>Jumlah context switch: <strong>8</strong>. Utilisasi CPU: <strong>100%</strong>. Throughput: <strong>0,25 proses/satuan waktu</strong>.</p>
      <Link className="text-link mt-4 inline-block" href="/simulator">Amati contoh di simulator →</Link>
    </section>
  </main>;
}
