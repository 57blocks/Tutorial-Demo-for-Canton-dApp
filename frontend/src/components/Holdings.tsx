import { useState } from 'react';
import { useLoop } from '../context/LoopContext';

// Map known token symbols to reliable icon URLs (CoinGecko asset images)
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
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-sm font-bold">
      {symbol?.slice(0, 2)}
    </div>
  );
}

export function Holdings() {
  const { holdings, isConnected } = useLoop();

  if (!isConnected) {
    return (
      <div className="text-center py-16 text-[var(--color-muted-foreground)]">
        Connect your wallet to view holdings
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--color-muted-foreground)]">
        No holdings found
      </div>
    );
  }

  const sortedHoldings = [...holdings].sort((a, b) => {
    const keyA = `${a.instrument_id.admin}-${a.instrument_id.id}`;
    const keyB = `${b.instrument_id.admin}-${b.instrument_id.id}`;
    return keyA.localeCompare(keyB);
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedHoldings.map((holding) => (
        <div
          key={`${holding.instrument_id.admin}-${holding.instrument_id.id}`}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 flex flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            <TokenIcon image={holding.image} symbol={holding.symbol} />
            <div>
              <div className="font-semibold">{holding.symbol}</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">{holding.org_name}</div>
            </div>
          </div>

          <div className="mt-auto">
            <div className="text-2xl font-bold tabular-nums">
              {formatAmount(holding.total_unlocked_coin, holding.decimals)}
            </div>
            {holding.total_locked_coin && Number(holding.total_locked_coin) > 0 && (
              <div className="text-xs text-[var(--color-muted-foreground)]">
                Locked: {formatAmount(holding.total_locked_coin, holding.decimals)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatAmount(raw: string, _decimals: number): string {
  return Number(raw).toLocaleString();
}
