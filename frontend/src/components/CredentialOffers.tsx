import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLoop } from '../context/LoopContext';
import BasicModal from '@components/ui/smoothui/basic-modal';
import BasicToast from '@components/ui/smoothui/basic-toast';
import SmoothButton from '@components/ui/smoothui/smooth-button';
import { ShieldCheck, ShieldX, ChevronDown, ChevronRight, ArrowDownToLine, X } from 'lucide-react';
import type { ActiveContract } from '@fivenorth/loop-sdk';

function extractTransferInfo(contract: ActiveContract) {
  const entry = (contract as any).contractEntry?.JsActiveContract?.createdEvent
    || (contract as any).createdEvent
    || contract;

  const contractId = entry?.contractId
    || contract.contract_id
    || (contract as any).contractId
    || '';

  const createArg = entry?.createArgument || (contract as any).createArgument || {};

  return {
    contractId,
    owner: truncatePartyId(createArg.owner),
    sender: truncatePartyId(createArg.sender),
    amount: createArg.amount || '',
    instrument: createArg.instrument || {},
    createdAt: entry?.createdAt || (contract as any).createdAt || '',
    raw: contract,
  };
}

function extractOfferInfo(offer: ActiveContract) {
  const entry = (offer as any).contractEntry?.JsActiveContract?.createdEvent
    || (offer as any).createdEvent
    || offer;

  const contractId = entry?.contractId
    || offer.contract_id
    || (offer as any).contractId
    || '';

  const createArg = entry?.createArgument || (offer as any).createArgument || {};

  return {
    contractId,
    id: createArg.id || '',
    description: createArg.description || '',
    issuer: truncatePartyId(createArg.issuer),
    holder: truncatePartyId(createArg.holder),
    operator: truncatePartyId(createArg.operator),
    claims: createArg.claims || [],
    createdAt: entry?.createdAt || (offer as any).createdAt || '',
    packageName: entry?.packageName || (offer as any).packageName || '',
    raw: offer,
  };
}

function truncatePartyId(partyId: string | undefined): string {
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

function CollapsibleJson({ data, label }: { data: unknown; label: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {label}
      </button>
      {expanded && (
        <pre
          className="px-3 pb-3 text-xs whitespace-pre-wrap break-all max-h-60 overflow-y-auto"
          style={{ color: 'var(--color-foreground-dim)' }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function CredentialOffers() {
  const { credentialOffers, holdingContracts, acceptCredential, rejectCredential, acceptTransferHolding, rejectTransferHolding } = useLoop();
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [seenOffers, setSeenOffers] = useState<Set<string>>(new Set());
  const [seenTransfers, setSeenTransfers] = useState<Set<string>>(new Set());

  const offers = credentialOffers.map((o, i) => ({ ...extractOfferInfo(o), _idx: i }));
  const transfers = holdingContracts.map((c, i) => ({ ...extractTransferInfo(c), _idx: i }));

  useEffect(() => {
    if (offers.length > 0) {
      const newIds = offers
        .map(o => o.contractId || `idx-${o._idx}`)
        .filter(id => !seenOffers.has(id));
      if (newIds.length > 0) {
        setSeenOffers(prev => new Set([...prev, ...newIds]));
      }
    }
  }, [credentialOffers, seenOffers]);

  useEffect(() => {
    if (transfers.length > 0) {
      const newIds = transfers
        .map(t => t.contractId || `idx-${t._idx}`)
        .filter(id => !seenTransfers.has(id));
      if (newIds.length > 0) {
        setSeenTransfers(prev => new Set([...prev, ...newIds]));
      }
    }
  }, [holdingContracts, seenTransfers]);

  const handleAccept = async (contractId: string) => {
    setIsProcessing(true);
    try {
      await acceptCredential(contractId);
      setToast({ message: 'Credential accepted successfully', type: 'success' });
      setSelectedOffer(null);
    } catch (e: any) {
      setToast({ message: `Failed to accept: ${e.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (contractId: string) => {
    setIsProcessing(true);
    try {
      await rejectCredential(contractId);
      setToast({ message: 'Credential rejected', type: 'success' });
      setSelectedOffer(null);
    } catch (e: any) {
      setToast({ message: `Failed to reject: ${e.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptTransfer = async (contractId: string) => {
    setIsProcessing(true);
    try {
      await acceptTransferHolding(contractId);
      setToast({ message: 'Transfer accepted successfully', type: 'success' });
      setSelectedTransfer(null);
    } catch (e: any) {
      setToast({ message: `Failed to accept transfer: ${e.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectTransfer = async (contractId: string) => {
    setIsProcessing(true);
    try {
      await rejectTransferHolding(contractId);
      setToast({ message: 'Transfer rejected', type: 'success' });
      setSelectedTransfer(null);
    } catch (e: any) {
      setToast({ message: `Failed to reject transfer: ${e.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentOffer = offers.find(o => (o.contractId || `idx-${o._idx}`) === selectedOffer);
  const currentTransfer = transfers.find(t => (t.contractId || `idx-${t._idx}`) === selectedTransfer);

  const cardBaseStyle: React.CSSProperties = {
    border: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(10,10,28,0.55)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
    borderRadius: 'var(--radius-lg)',
    transition: 'border-color var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out)',
  };

  const sectionStyle: React.CSSProperties = {
    color: 'var(--color-foreground-dim)',
    fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif",
  };

  return (
    <>
      {/* Credential Offer List */}
      {offers.length > 0 && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={sectionStyle}>
            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            Pending Credential Offers ({offers.length})
          </h2>
          <div className="flex flex-col gap-2">
            {offers.map((offer, i) => {
              const offerId = offer.contractId || `idx-${offer._idx}`;
              return (
                <motion.div
                  key={offerId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between rounded-2xl p-4 cursor-pointer"
                  style={cardBaseStyle}
                  onClick={() => setSelectedOffer(offerId)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.boxShadow = 'var(--shadow-palette)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--color-accent-muted)' }}
                    >
                      <ShieldCheck className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{offer.id || offer.description || 'Credential Offer'}</div>
                      <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {offer.issuer ? `From: ${offer.issuer}` : offerId.slice(0, 24) + '...'}
                      </div>
                    </div>
                  </div>
                  <SmoothButton variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedOffer(offerId); }}>
                    Review
                  </SmoothButton>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Transfer Holdings List */}
      {transfers.length > 0 && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={sectionStyle}>
            <ArrowDownToLine className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            Pending Transfer Holdings ({transfers.length})
          </h2>
          <div className="flex flex-col gap-2">
            {transfers.map((transfer, i) => {
              const transferId = transfer.contractId || `idx-${transfer._idx}`;
              return (
                <motion.div
                  key={transferId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between rounded-2xl p-4 cursor-pointer"
                  style={cardBaseStyle}
                  onClick={() => setSelectedTransfer(transferId)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; e.currentTarget.style.boxShadow = 'var(--shadow-palette)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--color-accent-muted)' }}
                    >
                      <ArrowDownToLine className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {transfer.amount ? `${transfer.amount} tokens` : 'Token Transfer'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {transfer.sender ? `From: ${transfer.sender}` : transferId.slice(0, 24) + '...'}
                      </div>
                    </div>
                  </div>
                  <SmoothButton variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTransfer(transferId); }}>
                    Review
                  </SmoothButton>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Modal for accepting/rejecting credentials */}
      <BasicModal
        isOpen={selectedOffer !== null && !!currentOffer}
        onClose={() => setSelectedOffer(null)}
        title="Credential Offer"
        size="md"
      >
        {currentOffer && (
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              You have received a credential offer. Would you like to accept or reject it?
            </p>

            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {(currentOffer.id || currentOffer.description) && (
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Credential</div>
                  <div className="font-medium">{currentOffer.id}</div>
                  {currentOffer.description && currentOffer.description !== currentOffer.id && (
                    <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{currentOffer.description}</div>
                  )}
                </div>
              )}

              {currentOffer.issuer && (
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Issuer</div>
                  <div className="text-sm font-mono">{currentOffer.issuer}</div>
                </div>
              )}

              {currentOffer.claims.length > 0 && (
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-muted-foreground)' }}>Claims</div>
                  <div className="flex flex-col gap-1">
                    {currentOffer.claims.map((claim: any, i: number) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <span style={{ color: 'var(--color-accent-soft)' }}>{claim.property}:</span>
                        <span>{claim.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentOffer.createdAt && (
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Created</div>
                  <div className="text-sm">{formatDate(currentOffer.createdAt)}</div>
                </div>
              )}
            </div>

            <CollapsibleJson data={currentOffer.raw} label="Show raw contract data" />

            <div className="flex gap-3 justify-end mt-2">
              <SmoothButton
                variant="destructive"
                size="sm"
                onClick={() => handleReject(currentOffer.contractId)}
                disabled={isProcessing}
              >
                <ShieldX className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Reject'}
              </SmoothButton>
              <SmoothButton
                variant="candy"
                size="sm"
                onClick={() => handleAccept(currentOffer.contractId)}
                disabled={isProcessing}
              >
                <ShieldCheck className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Accept'}
              </SmoothButton>
            </div>
          </div>
        )}
      </BasicModal>

      {/* Modal for accepting/rejecting transfer holdings */}
      <BasicModal
        isOpen={selectedTransfer !== null && !!currentTransfer}
        onClose={() => setSelectedTransfer(null)}
        title="Transfer Holding"
        size="md"
      >
        {currentTransfer && (
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              You have received a token transfer. Would you like to accept or reject it?
            </p>

            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {currentTransfer.amount && (
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Amount</div>
                  <div className="font-medium">{currentTransfer.amount}</div>
                </div>
              )}

              {currentTransfer.sender && (
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Sender</div>
                  <div className="text-sm font-mono">{currentTransfer.sender}</div>
                </div>
              )}

              {currentTransfer.owner && (
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Owner</div>
                  <div className="text-sm font-mono">{currentTransfer.owner}</div>
                </div>
              )}

              {currentTransfer.createdAt && (
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Created</div>
                  <div className="text-sm">{formatDate(currentTransfer.createdAt)}</div>
                </div>
              )}
            </div>

            <CollapsibleJson data={currentTransfer.raw} label="Show raw contract data" />

            <div className="flex gap-3 justify-end mt-2">
              <SmoothButton
                variant="destructive"
                size="sm"
                onClick={() => handleRejectTransfer(currentTransfer.contractId)}
                disabled={isProcessing}
              >
                <X className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Reject'}
              </SmoothButton>
              <SmoothButton
                variant="candy"
                size="sm"
                onClick={() => handleAcceptTransfer(currentTransfer.contractId)}
                disabled={isProcessing}
              >
                <ArrowDownToLine className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Accept'}
              </SmoothButton>
            </div>
          </div>
        )}
      </BasicModal>

      {/* Toast notifications */}
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
