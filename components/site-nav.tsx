import Link from "next/link";
import { RotateCcw } from "lucide-react";

export function SiteNav() {
  return (
    <nav className="site-nav" aria-label="Navigasi utama">
      <Link href="/" className="site-brand"><RotateCcw size={19} aria-hidden="true" /> Putar SO</Link>
      <div className="site-links">
        <Link href="/simulator">Simulator</Link>
        <Link href="/lab">Lab quantum</Link>
        <Link href="/aturan">Aturan</Link>
        <Link href="/tentang">Tentang</Link>
      </div>
    </nav>
  );
}
