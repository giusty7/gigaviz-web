export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="container py-8 text-sm text-white/60 flex items-center justify-between">
        <p>© {new Date().getFullYear()} Gigaviz</p>
        <p>Built with Next.js</p>
      </div>
    </footer>
  );
}
