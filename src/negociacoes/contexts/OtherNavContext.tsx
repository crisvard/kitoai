import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { MAX_BROWSERS_PER_USER } from '../config';

interface OtherNavContextValue {
  navItems: string[];
  activeNav: string;
  setActiveNav: (nav: string) => void;
  selectedNavs: string[];
  toggleNavSelection: (nav: string) => void;
  isGridMode: boolean;
  setGridMode: (v: boolean) => void;
  addNavItem: () => void;
  removeNavItem: (nav: string) => void;
  maxNavs: number;
}

const OtherNavContext = createContext<OtherNavContextValue | null>(null);

export function OtherNavProvider({ children }: { children: ReactNode }) {
  const [navItems, setNavItems] = useState<string[]>(['NAV 01']);
  const [activeNav, setActiveNav] = useState('NAV 01');
  const [selectedNavs, setSelectedNavs] = useState<string[]>(['NAV 01']);
  const [isGridMode, setGridMode] = useState(false);

  const toggleNavSelection = (nav: string) => {
    setSelectedNavs((prev) =>
      prev.includes(nav) ? prev.filter((n) => n !== nav) : [...prev, nav]
    );
  };

  const addNavItem = useMemo(() => {
    return () => {
      setNavItems((prev) => {
        if (prev.length >= MAX_BROWSERS_PER_USER) return prev;
        let nextNumber = 1;
        while (prev.includes(`NAV ${String(nextNumber).padStart(2, '0')}`)) {
          nextNumber++;
        }
        const newLabel = `NAV ${String(nextNumber).padStart(2, '0')}`;
        return [...prev, newLabel];
      });
    };
  }, []);

  const removeNavItem = (nav: string) => {
    setNavItems((prev) => {
      const next = prev.filter(n => n !== nav);
      if (next.length > 0 && activeNav === nav) {
        setActiveNav(next[0]);
      } else if (next.length === 0) {
        // Se fechar todas, talvez criar uma nova vazia ou limpar. Vamos limpar.
        setActiveNav('');
      }
      return next;
    });
    setSelectedNavs((prev) => prev.filter(n => n !== nav));
  };

  const value = useMemo(
    () => ({
      navItems, activeNav, setActiveNav,
      selectedNavs, toggleNavSelection,
      isGridMode, setGridMode,
      addNavItem, removeNavItem, maxNavs: MAX_BROWSERS_PER_USER
    }),
    [navItems, activeNav, selectedNavs, isGridMode, addNavItem]
  );

  return <OtherNavContext.Provider value={value}>{children}</OtherNavContext.Provider>;
}

export function useOtherNav() {
  const ctx = useContext(OtherNavContext);
  if (!ctx) {
    return {
      navItems: [],
      activeNav: '',
      setActiveNav: () => { },
      selectedNavs: [],
      toggleNavSelection: () => { },
      isGridMode: false,
      setGridMode: () => { },
      addNavItem: () => { },
      removeNavItem: () => { },
      maxNavs: MAX_BROWSERS_PER_USER,
    };
  }
  return ctx;
}
