import { useState } from 'react';
import { motion } from 'motion/react';
import { useLoop } from '../context/LoopContext';

const TOKEN_ICONS: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  CBTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  solvBTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  cETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  USDCx: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  testUSDCx: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
};


function TokenIcon({ image, symbol }: { image?: string; symbol?: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = (symbol && TOKEN_ICONS[symbol]) || image;

  if (resolvedSrc && !failed) {
    return (
      <img
        src={resolvedSrc}
        alt={symbol}
        className="w-10 h-10 rounded-full"
        onError={() => setFailed(true)}
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
      style={{
        background: 'rgba(255,255,255,0.06)',
        color: 'var(--color-accent)',
      }}
    >
      {symbol?.slice(0, 2)}
    </div>
  );
}

export function Holdings() {
  const { holdings, isConnected } = useLoop();

  if (!isConnected) {
    return (
      <div
        className="text-center py-16 rounded-2xl border"
        style={{
          borderColor: 'rgba(255,255,255,0.05)',
          background: 'rgba(10,10,28,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
          color: 'var(--color-muted-foreground)',
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <svg className="w-5 h-5" style={{ color: 'var(--color-muted-foreground)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M9 12h6" />
          </svg>
        </div>
        <p className="text-sm">Connect your wallet to view holdings</p>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div
        className="text-center py-16 rounded-2xl border"
        style={{
          borderColor: 'rgba(255,255,255,0.05)',
          background: 'rgba(10,10,28,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
          color: 'var(--color-muted-foreground)',
        }}
      >
        <p className="text-sm">No holdings found</p>
      </div>
    );
  }

  const sortedHoldings = [...holdings].sort((a, b) => {
    const keyA = `${a.instrument_id.admin}-${a.instrument_id.id}`;
    const keyB = `${b.instrument_id.admin}-${b.instrument_id.id}`;
    return keyA.localeCompare(keyB);
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sortedHoldings.map((holding, i) => {
        return (
        <motion.div
          key={`${holding.instrument_id.admin}-${holding.instrument_id.id}`}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.3,
            delay: i * 0.05,
            ease: [0.16, 1, 0.3, 1],
          }}
          whileHover={{ y: -2, transition: { duration: 0.15, ease: 'easeOut' } }}
          className="rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer group relative overflow-hidden"
          style={{
            borderColor: 'rgba(255,255,255,0.05)',
            background: 'rgba(10,10,28,0.55)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
            transition: 'border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
            e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.40)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.28)';
          }}
        >

          {/* Subtle warm glow on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(140px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,99,99,0.08), transparent)`,
            }}
          />

          <div className="flex items-center gap-3 relative z-10">
            <TokenIcon image={holding.image} symbol={holding.symbol} />
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-foreground)' }}>{holding.symbol}</div>
              <div className="text-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                {holding.org_name}
              </div>
            </div>
          </div>

          <div className="mt-auto relative z-10">
            <div
              className="text-2xl font-bold tabular-nums tracking-tight"
              style={{ fontFamily: "'JetBrains Mono', 'SF Mono', monospace", color: 'var(--color-foreground)' }}
            >
              {formatAmount(holding.total_unlocked_coin, holding.decimals)}
            </div>
            {holding.total_locked_coin && Number(holding.total_locked_coin) > 0 && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                Locked: {formatAmount(holding.total_locked_coin, holding.decimals)}
              </div>
            )}
          </div>
        </motion.div>
      )})}
    </div>
  );
}

function formatAmount(raw: string, _decimals: number): string {
  return Number(raw).toLocaleString();
}
