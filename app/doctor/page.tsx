import { BuildDoctor } from "@/components/BuildDoctor";

export const metadata = {
  title: "Analisador de Builds | TBH Banco de Dados BR",
  description: "Analise seu save do Task Bar Hero e receba uma rota de melhoria para os personagens.",
};

export default function BuildDoctorPage() {
  return (
    <div className="page-frame">
      <div className="page-banner page-banner-assets">Analisador de Builds</div>
      <div className="page-body">
        <BuildDoctor />
      </div>
    </div>
  );
}
