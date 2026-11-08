// Recorte calculado a partir do bounding box real do conteúdo visível dentro
// do viewBox 960x260 dos SVGs (o asset tem bastante respiro em branco à
// direita e embaixo — sem isso a logo renderiza minúscula dentro da caixa).
const VIEWBOX_W = 960;
const VIEWBOX_H = 260;
const CONTENT_LEFT = 40;
const CONTENT_TOP = 65;
const CONTENT_W = 480; // 520 - 40
const CONTENT_H = 138; // 203 - 65

export function AurenLogo({ tone = "dark", height = 40 }: { tone?: "dark" | "light"; height?: number }) {
  const src = tone === "light" ? "/auren-logo-negativa.svg" : "/auren-logo-principal.svg";

  const scale = height / CONTENT_H;
  const wrapperWidth = CONTENT_W * scale;
  const imgHeight = VIEWBOX_H * scale;
  const imgWidth = VIEWBOX_W * scale;

  return (
    <div style={{ height, width: wrapperWidth, overflow: "hidden", position: "relative" }}>
      <img
        src={src}
        alt="Auren — Clínica & Diagnóstico"
        style={{
          position: "absolute",
          height: imgHeight,
          width: imgWidth,
          left: -CONTENT_LEFT * scale,
          top: -CONTENT_TOP * scale,
          maxWidth: "none",
        }}
      />
    </div>
  );
}
