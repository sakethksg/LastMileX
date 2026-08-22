"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface NavContextType {
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
}

const NavContext = createContext<NavContextType>({
  isMobileNavOpen: false,
  setIsMobileNavOpen: () => {},
  toggleMobileNav: () => {},
});

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // Automatically close mobile menu upon navigation
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);

  return (
    <NavContext.Provider value={{ isMobileNavOpen, setIsMobileNavOpen, toggleMobileNav }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  return useContext(NavContext);
}
