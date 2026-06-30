"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main>
      <section className="section page-hero">
        <div className="container">
          <div className="notice">
            <strong>Erro ao carregar o banco</strong>
            <span>{error.message}</span>
            <button className="btn primary" type="button" onClick={reset}>Tentar novamente</button>
          </div>
        </div>
      </section>
    </main>
  );
}
