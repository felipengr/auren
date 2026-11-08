export function AurenLogo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const textColor = tone === "light" ? "text-white" : "text-ink";
  const subColor = tone === "light" ? "text-white/70" : "text-muted";

  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-gold" aria-hidden />
      <div>
        <p className={`font-display text-xl leading-none ${textColor}`}>auren</p>
        <p className={`text-[10px] tracking-wide ${subColor}`}>CLÍNICA &amp; DIAGNÓSTICO</p>
      </div>
    </div>
  );
}
