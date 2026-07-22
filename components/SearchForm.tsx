import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  extra?: ReactNode;
  resetHref?: string;
};

export function SearchForm({ placeholder = "Pesquisar...", defaultValue = "", extra, resetHref }: Props) {
  return (
    <form className="searchbar tbh-pro-searchbar" action="" method="get">
      <div className="search-input-wrap">
        <span className="search-cursor" aria-hidden="true">▶</span>
        <input name="q" defaultValue={defaultValue} placeholder={placeholder} autoComplete="off" />
      </div>
      {extra}
      <button className="btn primary" type="submit">Buscar</button>
      {resetHref ? <Link className="btn ghost" href={resetHref}>Limpar filtros</Link> : null}
    </form>
  );
}
