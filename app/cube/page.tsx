import { CubeCalculator } from "@/components/CubeCalculator";
import { getCubeCalculatorData } from "@/lib/cube-calculator";

export const dynamic = "force-dynamic";

export default async function CubePage() {
  const data = await getCubeCalculatorData();

  return (
    <div className="page-frame">
      <div className="page-banner">Calculadora de Cube e Craft</div>
      <div className="page-body">
        <CubeCalculator data={data} />
      </div>
    </div>
  );
}
