export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container py-8 text-sm text-muted-foreground flex items-center justify-between">
        <p>© {new Date().getFullYear()} Gigaviz</p>
        <p>Built with Next.js</p>
      </div>
    </footer>
  );
}
