import type { ReactNode } from "react";

export default function FullInboxLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen overflow-hidden bg-[#050a18]">
      {children}
    </div>
  );
}
