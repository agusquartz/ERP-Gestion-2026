import { InfoIcon } from "@/shared/components/Icons";
import { s } from "../styles/NewPurchasesStyles";

export function PurchaseInformation() {
  return (
    <div className={s.infoPanel}>
      <div className="text-blue-500 mt-0.5">
        <InfoIcon size={20} />
      </div>
      <div>
        <h4 className="text-[11px] font-bold text-gray-800 uppercase mb-1">El total podría variar</h4>
        <p className={s.infoText}>
          Los costos utilizados para hacer este pedido fueron recuperados de la última compra, podrían haber cambios.
        </p>
      </div>
    </div>
  );
}