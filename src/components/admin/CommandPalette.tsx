/**
 * Command Palette — البحث السريع (Cmd+K / Ctrl+K)
 * يتيح التنقل السريع بين جميع صفحات لوحة التحكم
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { loadConfig, type PageConfig } from "@/pages/admin/PageBuilder";
import {
  LayoutDashboard, Users, ClipboardList, FileSpreadsheet, Wallet,
  MessageSquare, BarChart3, Car, Building2, Settings2, Bell, Landmark,
  GitCompare, Map, TrendingUp, Receipt, ArrowRightLeft, FileText, Brain,
  Shield, GraduationCap, Lock, Target, Plug, Package, CheckCircle2,
  ListTodo, ScrollText, Mail, ShieldAlert, UserCheck, Sparkles, Clock,
  Truck, Link2, FileCheck, CreditCard, Zap, Server, ToggleLeft, GitBranch,
  Calculator, HelpCircle, Workflow, Activity, Gauge, Globe, UserCog,
  BadgeDollarSign, HandCoins, ChartPie, Banknote, CircleDollarSign,
  Tags, ClipboardCheck, FolderSearch, KeyRound, Search, Star,
  ArrowRight, Blocks, BellRing, CalendarRange, Coins,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, ClipboardList, FileSpreadsheet, Wallet,
  MessageSquare, BarChart3, Car, Building2, Settings2, Bell, Landmark,
  GitCompare, Map, TrendingUp, Receipt, ArrowRightLeft, FileText, Brain,
  Shield, GraduationCap, Lock, Target, Plug, Package, CheckCircle2,
  ListTodo, ScrollText, Mail, ShieldAlert, UserCheck, Sparkles, Clock,
  Truck, Link2, FileCheck, CreditCard, Zap, Server, ToggleLeft, GitBranch,
  Calculator, HelpCircle, Workflow, Activity, Gauge, Globe, UserCog,
  BadgeDollarSign, HandCoins, ChartPie, Banknote, CircleDollarSign,
  Tags, ClipboardCheck, FolderSearch, KeyRound,
  Blocks, BellRing, CalendarRange, Coins,
};

const FAVORITES_KEY = "fll_favorites_v1";

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export function toggleFavorite(id: string): string[] {
  const favs = loadFavorites();
  const next = favs.includes(id)
    ? favs.filter((f) => f !== id)
    : [...favs, id];
  saveFavorites(next);
  return next;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const pages = useMemo(() => {
    const config = loadConfig();
    return config.filter((p) => p.enabled);
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show favorites first, then recent
      const favPages = pages.filter((p) => favorites.includes(p.id));
      const rest = pages.filter((p) => !favorites.includes(p.id));
      return [...favPages, ...rest].slice(0, 15);
    }
    const q = query.toLowerCase();
    return pages
      .filter(
        (p) =>
          p.label.includes(query) ||
          p.id.includes(q) ||
          p.group.includes(query) ||
          p.path.includes(q),
      )
      .slice(0, 15);
  }, [query, pages, favorites]);

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-cmd-item]");
    items[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (page: PageConfig) => {
      navigate(page.path);
      setOpen(false);
    },
    [navigate],
  );

  const handleToggleFav = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const next = toggleFavorite(id);
      setFavorites(next);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    },
    [filtered, selectedIndex, handleSelect],
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "15vh",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 0.68, 0, 1] }}
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
          style={{
            width: "100%",
            maxWidth: 520,
            background: "var(--con-bg-surface-2)",
            border: "1px solid var(--con-border-strong)",
            borderRadius: "var(--con-radius-lg, 12px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderBottom: "1px solid var(--con-border-default)",
            }}
          >
            <Search size={16} style={{ color: "var(--con-text-muted)", flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="ابحث عن صفحة... (اكتب اسم الصفحة أو المجموعة)"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "var(--con-text-primary)",
                fontFamily: "var(--con-font-primary)",
              }}
            />
            <kbd
              style={{
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 4,
                background: "var(--con-bg-elevated)",
                border: "1px solid var(--con-border-default)",
                color: "var(--con-text-muted)",
                fontFamily: "var(--con-font-mono)",
              }}
            >
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div
            ref={listRef}
            style={{
              maxHeight: 360,
              overflowY: "auto",
              padding: "4px 0",
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "var(--con-text-muted)",
                  fontSize: 13,
                }}
              >
                لا توجد نتائج لـ "{query}"
              </div>
            ) : (
              filtered.map((page, index) => {
                const Ico = ICON_MAP[page.icon] || LayoutDashboard;
                const isSelected = index === selectedIndex;
                const isFav = favorites.includes(page.id);

                return (
                  <div
                    key={page.id}
                    data-cmd-item
                    onClick={() => handleSelect(page)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 16px",
                      margin: "1px 6px",
                      borderRadius: "var(--con-radius-sm, 6px)",
                      cursor: "pointer",
                      transition: "background 0.1s",
                      background: isSelected
                        ? "var(--con-bg-elevated)"
                        : "transparent",
                    }}
                  >
                    <Ico
                      size={16}
                      style={{
                        color: isSelected
                          ? "var(--con-brand)"
                          : "var(--con-text-muted)",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 400,
                          color: "var(--con-text-primary)",
                        }}
                      >
                        {page.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--con-text-disabled)",
                        }}
                      >
                        {page.group}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleToggleFav(e, page.id)}
                      title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        display: "flex",
                        color: isFav
                          ? "var(--con-warning, #F59E0B)"
                          : "var(--con-text-disabled)",
                        opacity: isSelected || isFav ? 1 : 0.3,
                        transition: "opacity 0.15s, color 0.15s",
                      }}
                    >
                      <Star size={13} fill={isFav ? "currentColor" : "none"} />
                    </button>
                    {isSelected && (
                      <ArrowRight
                        size={12}
                        style={{ color: "var(--con-text-muted)" }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Hint */}
          <div
            style={{
              padding: "8px 16px",
              borderTop: "1px solid var(--con-border-default)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 11,
              color: "var(--con-text-disabled)",
            }}
          >
            <span>↑↓ للتنقل</span>
            <span>↵ للفتح</span>
            <span>★ للمفضلة</span>
            <span style={{ marginRight: "auto" }}>
              <kbd
                style={{
                  padding: "1px 4px",
                  borderRadius: 3,
                  background: "var(--con-bg-elevated)",
                  border: "1px solid var(--con-border-default)",
                  fontFamily: "var(--con-font-mono)",
                  fontSize: 10,
                }}
              >
                ⌘K
              </kbd>{" "}
              للفتح
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
