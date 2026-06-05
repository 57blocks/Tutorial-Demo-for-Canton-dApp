import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoopProvider, useLoop } from './context/LoopContext';
import { Header } from './components/Header';
import { Holdings } from './components/Holdings';
import { CredentialOffers } from './components/CredentialOffers';
import { TransferForm } from './components/TransferForm';
import { ExpiredTransferBanner } from './components/ExpiredTransferBanner';
import { WalletLoading } from './components/WalletLoading';
import { Wallet, Send } from 'lucide-react';

const TABS = [
  { key: 'wallet', label: 'Wallet', icon: Wallet },
  { key: 'transfer', label: 'Transfer', icon: Send },
] as const;

function AppContent() {
  const [tab, setTab] = useState<string>('wallet');
  const { isInitializing, isConnecting, isConnected } = useLoop();
  const showLoading = (isInitializing || isConnecting) && !isConnected;

  return (
    <div className="min-h-screen flex flex-col" style={{ color: 'var(--color-foreground)' }}>
      <AnimatePresence>
        {showLoading && (
          <WalletLoading
            message={isConnecting ? 'Connecting wallet...' : 'Initializing Loop...'}
          />
        )}
      </AnimatePresence>

      <Header />

      {/* Tab bar */}
      <div
        className="sticky top-0 z-20 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.05)',
          background: 'rgba(10,10,28,0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors"
                style={{
                  color: active ? 'var(--color-accent-soft)' : 'var(--color-muted-foreground)',
                  transition: `color var(--duration-normal) var(--ease-out)`,
                }}
              >
                <Icon
                  className="w-4 h-4 transition-transform"
                  style={{
                    transform: active ? 'scale(1.1)' : 'scale(1)',
                    transition: `transform var(--duration-normal) var(--ease-spring)`,
                  }}
                />
                {label}
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'var(--color-accent)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.8 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          {tab === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <ExpiredTransferBanner />
              <CredentialOffers />
              <section>
                <h2
                  className="text-lg font-semibold mb-4 tracking-tight"
                  style={{ color: 'var(--color-foreground-dim)' }}
                >
                  Holdings
                </h2>
                <Holdings />
              </section>
            </motion.div>
          )}

          {tab === 'transfer' && (
            <motion.div
              key="transfer"
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <TransferForm />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <LoopProvider>
      <AppContent />
    </LoopProvider>
  );
}

export default App;
