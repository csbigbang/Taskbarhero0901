import { SaveInspector } from "@/components/SaveInspector";

export const metadata = {
  title: "Analisar Salvamento | TBH Banco de Dados BR",
  description: "Leia o save do Task Bar Hero e veja personagens, equipamentos e valor estimado dos itens equipados.",
};

export default function SaveInspectorPage() {
  return (
    <div className="page-frame">
      <div className="page-banner page-banner-assets">Analisar Salvamento</div>
      <div className="page-body">
        <SaveInspector />
      </div>
    </div>
  );
}
