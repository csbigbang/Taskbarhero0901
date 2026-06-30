import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <section className="section page-hero">
        <div className="container">
          <div className="card">
            <span className="eyebrow">404</span>
            <h1>Página não encontrada</h1>
            <p>Esse item, fase ou rota não existe no banco atual.</p>
            <div className="hero-actions">
              <Link className="btn primary" href="/">Voltar ao início</Link>
              <Link className="btn" href="/items">Ver itens</Link>
              <Link className="btn" href="/drops">Procurar drops</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
