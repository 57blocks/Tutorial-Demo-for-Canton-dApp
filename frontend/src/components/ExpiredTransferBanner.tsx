import { useState } from 'react';
import { motion } from 'motion/react';
import { useLoop, isExpiredTransfer, type SentTransferInfo } from '../context/LoopContext';
import SmoothButton from '@components/ui/smoothui/smooth-button';
import BasicToast from '@components/ui/smoothui/basic-toast';
import { AlertTriangle, Clock } from 'lucide-react';

function truncatePartyId(partyId: string): string {
  if (!partyId) return '';
  const parts = partyId.split('::');
  if (parts.length >= 2) {
    return `${parts[0].slice(0, 8)}...::${parts[1].slice(0, 8)}...`;
  }
  return partyId.length > 20 ? `${partyId.slice(0, 16)}...` : partyId;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ExpiredTransferBanner() {
  const { sentContracts, withdrawExpiredTransfer } = useLoop();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const expired = sentContracts.filter(isExpiredTransfer);

  if (expired.length === 0) return null;

  const handleWithdraw = async (contractId: string) => {
    setIsProcessing(true);
    setProcessingId(contractId);
    try {
      await withdrawExpiredTransfer(contractId);
      setToast({ message: 'Transfer withdrawn successfully', type: 'success' });
    } catch (e: any) {
      setToast({ message: `Withdraw failed: ${e.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  const handleWithdrawAll = async () => {
    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;
    for (const t of expired) {
      setProcessingId(t.contractId);
      try {
        await withdrawExpiredTransfer(t.contractId);
        successCount++;
      } catch {
        failCount++;
      }
    }
    setIsProcessing(false);
    setProcessingId(null);
    if (failCount === 0) {
      setToast({ message: `${successCount} transfer(s) withdrawn`, type: 'success' });
    } else {
      setToast({
        message: `${successCount} withdrawn, ${failCount} failed`,
        type: failCount === expired.length ? 'error' : 'success',
      });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border p-4 mb-6"
        style={{
          borderColor: 'rgba(245,158,11,0.25)',
          background: 'var(--color-warning-muted)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--color-warning)' }}>
            {expired.length} Expired Transfer{expired.length > 1 ? 's' : ''}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-foreground-dim)' }}>
            — These outgoing transfers have expired and can be withdrawn
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {expired.map((t: SentTransferInfo) => (
            <motion.div
              key={t.contractId}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{
                border: '1px solid var(--color-border)',
                background: 'rgba(0,0,0,0.03)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground-dim)' }}>
                    {t.amount} {t.instrument?.id || 'tokens'}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-foreground-dim)' }}>
                    To: {truncatePartyId(t.receiver)} &middot; Expired: {formatDate(t.executeBefore)}
                  </div>
                </div>
              </div>
              <SmoothButton
                variant="outline"
                size="sm"
                onClick={() => handleWithdraw(t.contractId)}
                disabled={isProcessing}
              >
                {processingId === t.contractId ? 'Withdrawing...' : 'Withdraw'}
              </SmoothButton>
            </motion.div>
          ))}
        </div>

        {expired.length > 1 && (
          <div className="mt-3 flex justify-end">
            <SmoothButton
              variant="candy"
              size="sm"
              onClick={handleWithdrawAll}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `Withdraw All (${expired.length})`}
            </SmoothButton>
          </div>
        )}
      </motion.div>

      {toast && (
        <BasicToast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}
    </>
  );
}
