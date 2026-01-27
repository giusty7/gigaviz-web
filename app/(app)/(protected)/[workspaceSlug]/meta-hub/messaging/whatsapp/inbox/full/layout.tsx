import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function FullInboxLayout({ children, params }: Props) {
  // Await params to comply with Next.js 16 requirements
  await params;
  
  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen overflow-hidden bg-[#050a18]">
      {children}
    </div>
  );
}
