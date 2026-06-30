"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/drops?q=${encodeURIComponent(q)}` : "/drops");
  }

  return (
    <form className="global-search" onSubmit={submit} role="search" aria-label="Busca global">
      <span className="global-search-icon" aria-hidden="true">⌕</span>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar item, fase, drop, ID..."
        aria-label="Buscar item, fase, drop ou ID"
      />
      <button type="submit" aria-label="Pesquisar">↵</button>
    </form>
  );
}
