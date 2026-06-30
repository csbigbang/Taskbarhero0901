import { InventoryValueTool } from "@/components/InventoryValueTool";

export const metadata = {
  title: "Inventário BR | TBH Banco de Dados BR",
  description: "Calcule o valor do inventário, veja itens mais valiosos, itens para vender, guardar ou usar no Cube.",
};

export default function InventoryPage() {
  return (
    <div className="page-frame">
      <div className="page-banner">Inventário / Valor da Conta</div>
      <div className="page-body">
        <InventoryValueTool />
      </div>
    </div>
  );
}
