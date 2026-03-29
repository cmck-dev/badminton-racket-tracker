import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 300,
          borderRadius: 100,
        }}
      >
        🏸
      </div>
    ),
    { width: 512, height: 512 }
  );
}
