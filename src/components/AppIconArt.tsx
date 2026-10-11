/**
 * アプリのアイコンの絵柄（仮、0013）。ImageResponse で PNG にする。
 * 日本語の文字は ImageResponse の既定のフォントにないので、図形だけで描く。
 * 掲示板に貼ったチラシ：少し傾いた紙に、ピンと展示名の行。
 */
export function AppIconArt({ size }: { size: number }) {
  const u = size / 100;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2f55d4",
      }}
    >
      <div
        style={{
          width: 50 * u,
          height: 64 * u,
          display: "flex",
          flexDirection: "column",
          gap: 5 * u,
          padding: `${14 * u}px ${8 * u}px`,
          background: "#ffffff",
          borderRadius: 2 * u,
          transform: "rotate(-6deg)",
          boxShadow: `0 ${2 * u}px ${4 * u}px rgba(0,0,0,0.25)`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -3 * u,
            left: 21 * u,
            width: 8 * u,
            height: 8 * u,
            borderRadius: 9999,
            background: "#e2457a",
          }}
        />
        <div style={{ height: 14 * u, background: "#f2c230", borderRadius: u }} />
        <div style={{ height: 4 * u, width: "90%", background: "#1d2433", borderRadius: u }} />
        <div style={{ height: 4 * u, width: "65%", background: "#1d2433", borderRadius: u }} />
        <div style={{ height: 3 * u, width: "50%", background: "#9aa3b2", borderRadius: u }} />
      </div>
    </div>
  );
}
