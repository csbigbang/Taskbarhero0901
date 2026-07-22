import Link from "next/link";

export function MarketNotice() {
  return (
    <section className="market-update-notice" aria-labelledby="market-update-title">
      <div>
        <span>Atualizacao 1.01.00</span>
        <h2 id="market-update-title">Itens Celestial, Divine e Cosmic voltaram ao Mercado Steam</h2>
        <p>
          Materiais e equipamentos de grau alto agora podem ser negociados novamente. A liberacao pode variar
          por conta e a Steam pode demorar ate 1 hora para refletir todos os itens.
        </p>
      </div>
      <div className="market-update-actions">
        <Link href="/market?grade=CELESTIAL">Ver Celestial</Link>
        <Link href="/market?grade=DIVINE">Ver Divine</Link>
        <Link href="/market?grade=COSMIC">Ver Cosmic</Link>
        <a href="https://steamcommunity.com/market/search?appid=3678970" target="_blank" rel="noreferrer">
          Mercado Steam
        </a>
      </div>
    </section>
  );
}
