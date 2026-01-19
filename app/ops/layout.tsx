export const dynamic = "force-dynamic";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
  other: {
    "X-Robots-Tag": "noindex, nofollow",
  },
};

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
