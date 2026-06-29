import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../utils/cn";
import { LayoutDashboard, User as UserIcon, BookOpen, Settings, LogOut } from "lucide-react";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, className }) => {
  const { logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const index = itemsRef.current.indexOf(activeElement as HTMLAnchorElement | HTMLButtonElement);

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (index + 1) % itemsRef.current.length;
        itemsRef.current[nextIndex]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = (index - 1 + itemsRef.current.length) % itemsRef.current.length;
        itemsRef.current[prevIndex]?.focus();
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);

    // Focus the first item when opened
    setTimeout(() => {
      itemsRef.current[0]?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  const menuItems = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Profile", to: "/dashboard#profile", icon: UserIcon },
    { label: "Reading Journal", to: "/journal", icon: BookOpen },
    { label: "Settings", to: "/dashboard#settings", icon: Settings },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "absolute right-0 mt-2 w-56 bg-[#0D1626] border border-[rgba(201,162,39,0.18)] rounded-md py-2 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] focus:outline-none",
            className
          )}
          role="menu"
          aria-label="User profile menu"
        >
          {menuItems.map((item, index) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              ref={(el) => { itemsRef.current[index] = el; }}
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-display tracking-[0.1em] text-[#F7F5EE]/80 hover:text-[#C9A227] hover:bg-white/3 transition-all focus:bg-white/3 focus:text-[#C9A227] focus:outline-none uppercase"
              role="menuitem"
            >
              <item.icon className="w-4 h-4 opacity-70" />
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="h-[1px] bg-[rgba(201,162,39,0.1)] my-1.5" />

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            ref={(el) => { itemsRef.current[menuItems.length] = el; }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-display tracking-[0.1em] text-red-400 hover:text-red-300 hover:bg-white/3 transition-all focus:bg-white/3 focus:text-red-300 focus:outline-none uppercase text-left"
            role="menuitem"
          >
            <LogOut className="w-4 h-4 opacity-70" />
            <span>Sign Out</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
