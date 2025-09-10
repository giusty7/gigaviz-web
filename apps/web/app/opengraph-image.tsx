import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        height: "100%", width: "100%", display: "flex",
        alignItems: "center", justifyContent: "center",
        flexDirection: "column", background: "#0b1220", color: "white"
      }}>
        <div style={{ fontSize: 72, letterSpacing: -1 }}>Gigaviz</div>
        <div style={{ fontSize: 28, opacity: .7 }}>gigaviz.com</div>
      </div>
    ), size
  );
}

