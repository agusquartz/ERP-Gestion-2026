
'use client';

export function ActionButton({onClick, variant = "secondary" ,type,  className = "" }) {
  // Define base style generic for every buttons 
  const baseStyles = "px-6 py-2.5 rounded-[8px] font-bold text-[14px] transition-all active:scale-95";
  
  //Dictionary of variants: Defines colors and borders according to the 'variant' property
  const variants = {
    primary: "bg-[#2b6df5] text-white hover:bg-[#1e56c8] shadow-sm",
    secondary: "cursor-pointer rounded-[5px] px-3.5 py-1.5 text-sm font-medium border border-primary text-primary hover:bg-primary/5 transition-all duration-200 hover:bg-primary-hover active:translate-y-px",
    tertiary: "cursor-pointer rounded-[5px] px-3.5 py-1.5 text-sm font-medium border border-[#64748b] text-[#64748b] hover:bg-[#64748b]/5 transition-all duration-200 active:translate-y-px",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };
  //Key text, a value that represents text that could go in the dynamic button
  const buttonText = {
    "Presupuesto" : "Crear Factura",
    "Facturas" : "Crear Nota de Credito",
  }
  return (
    <button
      onClick={onClick}
      
      className={`${baseStyles} ${variants[variant]} ${className}`}
    > 
      {/*Search in dicctionary and put the text in button and */}
      {buttonText[type] || "Nueva Acción"}
    
    </button>
  );
}