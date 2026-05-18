import { Modal } from "@/shared/components/Modal";
import { ActionButton } from "./ActionButton";

export function CancelOrderModal({ open, onClose, onConfirm, orderId }) {
  return (
    <Modal open={open} onClose={onClose} width={400}>
      <div className="flex flex-col items-center text-center py-2">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Estás seguro?
        </h2>
        
        <p className="text-gray-500 text-sm mb-8">
          La orden de compra Nº {orderId} se perderá para siempre...
        </p>

        <div className="flex gap-3 w-full">
          <ActionButton
            variant="primary"
            text="Atrás"
            onClick={onClose}
            className="flex-1"
          />
          <ActionButton
            variant="danger"
            text="Cancelar Orden"
            onClick={onConfirm}
            className="flex-1 !bg-white !text-[#EF4444] !border-[#FFE6E5]"
          />
        </div>
      </div>
    </Modal>
  );
}
