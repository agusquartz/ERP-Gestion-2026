


export function ActionButton({ children, onClick, variant = "secondary" }) {
  // Define base stles and color variatioons
  const baseStyles = "px-6 py-2.5 rounded-[8px] font-bold text-[14px] transition-all active:scale-95";
  //const baseStyles = "font-bold transition-all active:scale-95";
  
  const variants = {
    primary: "bg-[#2b6df5] text-white hover:bg-[#1e56c8] shadow-sm",
    secondary: "cursor-pointer rounded-[5px] px-3.5 py-1.5 text-sm font-medium border border-primary text-primary hover:bg-primary/5 transition-all duration-200 hover:bg-primary-hover active:translate-y-px",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} `}
    >
      {children}
    </button>
  );
}