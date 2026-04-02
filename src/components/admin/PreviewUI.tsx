import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/* ─── PageWrapper ─── */
export const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    dir="rtl"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      padding: 28,
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'var(--con-bg)',
    }}
  >
    {children}
  </motion.div>
);

/* ─── PageHeader ─── */
interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, subtitle, actions }) => (
  <motion.div
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.4 }}
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 16,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--con-radius)',
          background: 'linear-gradient(135deg, var(--con-brand), #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--con-text)' }}>{title}</h1>
        <p style={{ fontSize: 13, color: 'var(--con-text-muted)', marginTop: 2 }}>{subtitle}</p>
      </div>
    </div>
    {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
  </motion.div>
);

/* ─── StatsCard ─── */
interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend?: string;
  color?: string;
  delay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = React.memo(
  ({ icon, title, value, trend, color = 'var(--con-brand)', delay = 0 }) => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      style={{
        background: 'var(--con-card)',
        border: '1px solid var(--con-border)',
        borderRadius: 'var(--con-radius)',
        padding: '20px 22px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        flex: '1 1 220px',
        minWidth: 220,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: 'var(--con-text-muted)', marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--con-text)', lineHeight: 1.1 }}>
          {value}
        </p>
        {trend && (
          <p
            style={{
              fontSize: 12,
              color: trend.startsWith('+') ? 'var(--con-success)' : trend.startsWith('-') ? 'var(--con-danger)' : 'var(--con-text-muted)',
              marginTop: 4,
            }}
          >
            {trend}
          </p>
        )}
      </div>
    </motion.div>
  )
);

StatsCard.displayName = 'StatsCard';

/* ─── Modal ─── */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, width = 560 }) => {
  useEffect(() => {
    if (isOpen) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--con-card)',
              border: '1px solid var(--con-border)',
              borderRadius: 'var(--con-radius)',
              width: '100%',
              maxWidth: width,
              maxHeight: '85vh',
              overflowY: 'auto',
              direction: 'rtl',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 22px',
                borderBottom: '1px solid var(--con-border)',
                position: 'sticky',
                top: 0,
                background: 'var(--con-card)',
                zIndex: 1,
              }}
            >
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>{title}</h2>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  color: 'var(--con-text-muted)',
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 22 }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── Shared button styles ─── */
export const btnPrimary: React.CSSProperties = {
  background: 'var(--con-brand)',
  color: '#fff',
  padding: '9px 18px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  transition: 'opacity 0.2s',
};

export const btnOutline: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--con-text)',
  padding: '9px 18px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  border: '1px solid var(--con-border)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  transition: 'border-color 0.2s',
};

export const badge = (color: string): React.CSSProperties => ({
  background: `${color}18`,
  color,
  padding: '4px 10px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  display: 'inline-block',
});
