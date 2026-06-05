import { motion } from 'motion/react';
import { Hexagon } from 'lucide-react';

interface WalletLoadingProps {
  message?: string;
}

export function WalletLoading({ message = 'Initializing Loop...' }: WalletLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 10, 28, 0.72)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
      }}
    >
      {/* Orbiting ring */}
      <motion.div
        style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: 'var(--color-accent)',
          borderRightColor: 'rgba(99, 102, 241, 0.3)',
        }}
        animate={{ rotate: 360 }}
        transition={{
          rotate: { duration: 1.5, ease: 'linear', repeat: Infinity },
        }}
      />

      {/* Outer pulse ring */}
      <motion.div
        style={{
          position: 'absolute',
          width: 160,
          height: 160,
          borderRadius: '50%',
          border: '1px solid rgba(99, 102, 241, 0.12)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.15, 0.6],
        }}
        transition={{
          duration: 2.2,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      {/* Hexagon logo */}
      <motion.div
        style={{
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          background: 'var(--color-accent-muted)',
          color: 'var(--color-accent)',
          position: 'relative',
        }}
        animate={{
          scale: [1, 1.06, 1],
          boxShadow: [
            '0 0 0 0 rgba(99, 102, 241, 0)',
            '0 0 32px 4px rgba(99, 102, 241, 0.18)',
            '0 0 0 0 rgba(99, 102, 241, 0)',
          ],
        }}
        transition={{
          duration: 2,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      >
        <Hexagon className="w-8 h-8" />
      </motion.div>

      {/* Label */}
      <motion.p
        style={{
          marginTop: 28,
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--color-foreground-dim)',
          letterSpacing: '0.01em',
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 2,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
