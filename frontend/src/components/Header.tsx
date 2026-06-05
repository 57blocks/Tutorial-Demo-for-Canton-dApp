import { useState, useCallback } from 'react';
import { useLoop } from '../context/LoopContext';
import SmoothButton from '@components/ui/smoothui/smooth-button';
import { Wallet, LogOut, Copy, Check, Hexagon } from 'lucide-react';

export function Header() {
  const { isConnected, isConnecting, connect, disconnect, provider } = useLoop();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!provider?.party_id) return;
    try {
      await navigator.clipboard.writeText(provider.party_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = provider.party_id;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [provider?.party_id]);

  return (
    <header
      className="flex items-center justify-between px-6 py-3.5 border-b sticky top-0 z-30"
      style={{
        borderColor: 'rgba(255,255,255,0.05)',
        background: 'rgba(10,10,28,0.55)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-transform"
          style={{
            background: 'var(--color-accent-muted)',
            color: 'var(--color-accent)',
          }}
        >
          <Hexagon className="w-5 h-5" />
        </div>
        <div>
          <h1
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif", color: 'var(--color-foreground)' }}
          >
            Loop
          </h1>
          <div
            className="text-[10px] font-medium uppercase tracking-widest leading-none"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Wallet
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isConnected && provider && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg border transition-all duration-150 cursor-pointer group"
            style={{
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              borderColor: copied ? 'var(--color-accent)' : 'var(--color-border)',
              background: copied ? 'var(--color-accent-muted)' : 'rgba(255,255,255,0.04)',
              color: copied ? 'var(--color-accent-soft)' : 'var(--color-muted-foreground)',
            }}
            title="Click to copy Party ID"
          >
            <span style={{ color: copied ? 'var(--color-accent-soft)' : 'var(--color-foreground-dim)' }}>
              {provider.party_id.split('::')[0].slice(0, 14)}...
            </span>
            <span style={{ color: 'var(--color-muted-foreground)' }}>
              ::
            </span>
            <span style={{ color: 'var(--color-muted-foreground)' }}>
              {provider.party_id.split('::')[1]?.slice(0, 6)}...
            </span>
            {copied ? (
              <Check className="w-3 h-3" style={{ color: 'var(--color-accent)' }} />
            ) : (
              <Copy
                className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ color: 'var(--color-muted-foreground)' }}
              />
            )}
          </button>
        )}
        {isConnected ? (
          <SmoothButton variant="outline" size="sm" onClick={disconnect}>
            <LogOut className="w-4 h-4" />
            Disconnect
          </SmoothButton>
        ) : (
          <SmoothButton variant="candy" size="sm" onClick={connect} disabled={isConnecting}>
            <Wallet className="w-4 h-4" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </SmoothButton>
        )}
      </div>
    </header>
  );
}
