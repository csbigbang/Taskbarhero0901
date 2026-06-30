import { ProgressSimulator } from "@/components/ProgressSimulator";

export const metadata = {
  title: "Simulador de Progressão | TBH Banco de Dados BR",
  description: "Monte uma rota de evolução para Task Bar Hero com foco em level, farm, orçamento e upgrades.",
};

export default function ProgressPage() {
  return (
    <div className="page-frame">
      <div className="page-banner page-banner-assets">Simulador de Progressão</div>
      <div className="page-body">
        <ProgressSimulator />
      </div>
    </div>
  );
}
