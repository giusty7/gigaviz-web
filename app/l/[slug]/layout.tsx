export default function PublicLinkLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f172a]">
        {children}
      </body>
    </html>
  );
}
