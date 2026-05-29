import { useLoop } from '../context/LoopContext';
import SmoothButton from '@components/ui/smoothui/smooth-button';
import { Wallet, LogOut } from 'lucide-react';

export function Header() {
  const { isConnected, isConnecting, connect, disconnect, provider } = useLoop();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-lg font-semibold">Loop Wallet</h1>
      </div>

      <div className="flex items-center gap-4">
        {isConnected && provider && (
          <span className="text-sm text-[var(--color-muted-foreground)] font-mono truncate max-w-[200px]">
            {provider.party_id.split('::')[0].slice(0, 16)}...
          </span>
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
