"use client";

export function BackToTop() {
  return (
    <button
      className="back-to-top"
      type="button"
      aria-label="Voltar ao topo"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ↑
    </button>
  );
}
