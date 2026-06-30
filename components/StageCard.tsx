import Link from "next/link";
import type { TbhStage } from "@/lib/types";
import { clean, prettyCode, stageTitle } from "@/lib/format";

export function StageCard({ stage }: { stage: TbhStage }) {
  const title = stageTitle(stage);

  return (
    <article className="small-card stage-card">
      <Link className="card-hit" href={`/stages/${encodeURIComponent(stage.stage_key)}`} aria-label={`Abrir ${title}`} />
      <div className="stage-badge-wrap">
        <span className="stage-badge stage-badge-act" aria-hidden="true" />
        <span className="stage-badge-number">{clean(stage.act)}-{clean(stage.stage_no)}</span>
      </div>
      <h3>{title}</h3>
      <p>{clean(stage.name_en_us, "Sem nome EN-US")}</p>
      <div className="pill-row">
        <span className="pill">ID: {stage.stage_key}</span>
        <span className="pill">Nível: {clean(stage.stage_level)}</span>
        <span className="pill">Tipo: {prettyCode(stage.stage_type)}</span>
        <span className="pill">Dificuldade: {prettyCode(stage.stage_difficulty)}</span>
      </div>
    </article>
  );
}
