import React from "react";
export const AuthDivider = ({ children }) => {
    return (<div className="relative flex py-4 items-center w-full">
      <div className="flex-grow border-t border-[rgba(201,162,39,0.1)]"></div>
      {children && (<span className="flex-shrink mx-4 font-display text-[9px] tracking-[0.2em] text-[#F7F5EE]/40 uppercase select-none">
          {children}
        </span>)}
      <div className="flex-grow border-t border-[rgba(201,162,39,0.1)]"></div>
    </div>);
};
