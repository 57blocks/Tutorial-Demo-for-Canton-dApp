import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { loop } from '@fivenorth/loop-sdk';
import type { Holding, ActiveContract, InstrumentSpec, TransferOptions, EstimatedGasResponse, TransactionPayload } from '@fivenorth/loop-sdk';
import { Utility as CredentialAppUtility } from '@daml.js/utility-credential-app-v0-0.4.1';
import { Utility as CredentialUtility } from '@daml.js/utility-credential-v0-0.1.0';
import { Splice as TransferInstructionSplice } from '@daml.js/splice-api-token-transfer-instruction-v1-1.0.0';
type Provider = Parameters<NonNullable<Parameters<typeof loop.init>[0]['onAccept']>>[0];

const CREDENTIAL_TEMPLATE_ID = CredentialAppUtility.Credential.App.V0.Model.Offer.CredentialOffer.templateId;
const CREDENTIAL_V0_TEMPLATE_ID = CredentialUtility.Credential.V0.Credential.Credential.templateId;
const TRANSFER_INSTRUCTION_INTERFACE_ID = TransferInstructionSplice.Api.Token.TransferInstructionV1.TransferInstruction.templateId;
const REGISTRY_URL = import.meta.env.VITE_REGISTRY_URL;
const POLL_INTERVAL = 8000;
const CC_SYMBOL = 'CC';
const DEFAULT_INSTRUMENT_ID = 'Amulet';

function getCreateArg(contract: any): Record<string, any> {
  return contract?.contractEntry?.JsActiveContract?.createdEvent?.createArgument
    || contract?.createdEvent?.createArgument
    || contract?.createArgument
    || {};
}

function isIntendedRecipient(contract: any, partyId: string, field: string): boolean {
  const arg = getCreateArg(contract);
  const value = arg[field];
  if (!value || !partyId) return false;
  return value === partyId;
}

function isSender(contract: any, partyId: string): boolean {
  const arg = getCreateArg(contract);
  const sender = arg?.transfer?.sender;
  if (!sender || !partyId) return false;
  return sender === partyId;
}

export interface SentTransferInfo {
  contractId: string;
  receiver: string;
  amount: string;
  instrument: { id: string; admin: string };
  executeBefore: string;
}

function extractSentInfo(contract: any): SentTransferInfo {
  const entry = (contract as any).contractEntry?.JsActiveContract?.createdEvent
    || (contract as any).createdEvent
    || contract;
  const cid = entry?.contractId || (contract as any).contractId || '';
  const createArg = entry?.createArgument || (contract as any).createArgument || {};
  const transfer = createArg?.transfer || {};
  return {
    contractId: cid,
    receiver: transfer.receiver || '',
    amount: transfer.amount || '',
    instrument: {
      id: transfer.instrumentId?.id || '',
      admin: transfer.instrumentId?.admin || '',
    },
    executeBefore: transfer.executeBefore || '',
  };
}

export function isExpiredTransfer(sent: SentTransferInfo): boolean {
  if (!sent.executeBefore) return false;
  return new Date(sent.executeBefore) < new Date();
}

interface LoopContextValue {
  provider: Provider | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInitializing: boolean;
  holdings: Holding[];
  holdingContracts: ActiveContract[];
  credentialOffers: ActiveContract[];
  sentContracts: SentTransferInfo[];
  ccBalance: string;
  estimatedGas: EstimatedGasResponse | null;
  isEstimatingGas: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  acceptCredential: (contractId: string) => Promise<void>;
  rejectCredential: (contractId: string) => Promise<void>;
  acceptTransferHolding: (contractId: string) => Promise<void>;
  rejectTransferHolding: (contractId: string) => Promise<void>;
  withdrawExpiredTransfer: (contractId: string) => Promise<void>;
  transfer: (recipient: string, amount: string | number, instrument?: InstrumentSpec, options?: TransferOptions) => Promise<any>;
  estimateGas: (payload: TransactionPayload) => Promise<EstimatedGasResponse>;
  estimateTransferGas: (recipient: string, amount: string | number, instrument?: InstrumentSpec, options?: TransferOptions) => Promise<EstimatedGasResponse>;
  clearGasEstimate: () => void;
  refreshData: () => Promise<void>;
}

const LoopContext = createContext<LoopContextValue | null>(null);

export function useLoop() {
  const ctx = useContext(LoopContext);
  if (!ctx) throw new Error('useLoop must be used within LoopProvider');
  return ctx;
}

export function LoopProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [holdingContracts, setHoldingContracts] = useState<ActiveContract[]>([]);
  const [credentialOffers, setCredentialOffers] = useState<ActiveContract[]>([]);
  const [credentialContracts, setCredentialContracts] = useState<ActiveContract[]>([]);
  const [sentContracts, setSentContracts] = useState<SentTransferInfo[]>([]);
  const [estimatedGas, setEstimatedGas] = useState<EstimatedGasResponse | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const providerRef = useRef<Provider | null>(null);
  const estimatingRef = useRef(false);

  const ccBalance = useMemo(() => {
    const cc = holdings.find(h => h.symbol === CC_SYMBOL);
    return cc?.total_unlocked_coin ?? '0';
  }, [holdings]);

  // Initialize SDK
  useEffect(() => {
    loop.init({
      appName: 'Loop Wallet dApp',
      network: 'devnet',
      onAccept: (p) => {
        providerRef.current = p;
        setProvider(p);
        setIsConnected(true);
        setIsConnecting(false);
      },
      onReject: () => {
        setIsConnecting(false);
      },
    });

    // Try auto-connect, then mark init as complete
    loop.autoConnect().finally(() => setIsInitializing(false));
  }, []);

  const fetchData = useCallback(async () => {
    const p = providerRef.current;
    if (!p) return;
    try {
      const [h, hc, cc, creds] = await Promise.all([
        p.getHolding(),
        p.getActiveContracts({ interfaceId: TRANSFER_INSTRUCTION_INTERFACE_ID }),
        p.getActiveContracts({ templateId: CREDENTIAL_TEMPLATE_ID }),
        p.getActiveContracts({ templateId: CREDENTIAL_V0_TEMPLATE_ID }),
      ]);
      const partyId = p.party_id;
      const filteredHc = (hc || []).filter((c: any) => isIntendedRecipient(c, partyId, 'owner'));
      const filteredCc = (cc || []).filter((c: any) => isIntendedRecipient(c, partyId, 'holder'));
      const filteredSent = (hc || []).filter((c: any) => isSender(c, partyId)).map(extractSentInfo);
      console.log('[LoopDApp] Holdings:', h);
      console.log('[LoopDApp] Holding contracts (filtered):', filteredHc, '(all:', hc?.length, ')');
      console.log('[LoopDApp] Credential offers (filtered):', filteredCc, '(all:', cc?.length, ')');
      console.log('[LoopDApp] Credential contracts:', creds);
      console.log('[LoopDApp] Sent contracts:', filteredSent);
      setHoldings(h || []);
      setHoldingContracts(filteredHc);
      setCredentialOffers(filteredCc);
      setCredentialContracts(creds || []);
      setSentContracts(filteredSent);
    } catch (e) {
      console.error('Failed to fetch data:', e);
    }
  }, []);

  // Start polling when connected
  useEffect(() => {
    if (isConnected) {
      fetchData();
      pollRef.current = setInterval(fetchData, POLL_INTERVAL);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isConnected, fetchData]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Clear any stale session/ticket to avoid "ticket expired" errors
      loop.logout();
      await loop.connect();
    } catch {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    loop.logout();
    providerRef.current = null;
    setProvider(null);
    setIsConnected(false);
    setHoldings([]);
    setHoldingContracts([]);
    setCredentialOffers([]);
    setSentContracts([]);
    setCredentialContracts([]);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const acceptCredential = useCallback(async (contractId: string) => {
    const p = providerRef.current;
    if (!p) return;
    await p.submitTransaction({
      commands: [{
        ExerciseCommand: {
          templateId: CREDENTIAL_TEMPLATE_ID,
          contractId,
          choice: 'CredentialOffer_AcceptFree',
          argument: { tag: 'CredentialOffer_AcceptFree', value: {} },
        },
      }],
      disclosedContracts: [],
    });
    await fetchData();
  }, [fetchData]);

  const rejectCredential = useCallback(async (contractId: string) => {
    const p = providerRef.current;
    if (!p) return;
    await p.submitTransaction({
      commands: [{
        ExerciseCommand: {
          templateId: CREDENTIAL_TEMPLATE_ID,
          contractId,
          choice: 'CredentialOffer_Reject',
          argument: { tag: 'CredentialOffer_Reject', value: { reason: 'Rejected by holder' } },
        },
      }],
      disclosedContracts: [],
    });
    await fetchData();
  }, [fetchData]);

  const acceptTransferHolding = useCallback(async (contractId: string) => {
    const p = providerRef.current;
    if (!p) return;

    // Fetch choice context from registry
    const choiceContextRes = await fetch(
      `${REGISTRY_URL}/registry/transfer-instruction/v1/${contractId}/choice-contexts/accept`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: {}, excludeDebugFields: true }),
      },
    );
    if (!choiceContextRes.ok) {
      throw new Error(`Failed to get choice context: ${choiceContextRes.status} ${await choiceContextRes.text()}`);
    }
    const choiceContext = await choiceContextRes.json();

    // Find the holding contract to get its instrument ID
    const holdingContract = holdingContracts.find((c: any) => {
      const entry = c.contractEntry?.JsActiveContract?.createdEvent || c.createdEvent || c;
      const cid = entry?.contractId || c.contract_id || c.contractId || '';
      return cid === contractId;
    });

    const holdingEntry = (holdingContract as any)?.contractEntry?.JsActiveContract?.createdEvent
      || (holdingContract as any)?.createdEvent
      || holdingContract;
    const holdingCreateArg = holdingEntry?.createArgument || (holdingContract as any)?.createArgument || {};
    const instrumentId = holdingCreateArg?.transfer?.instrumentId?.id
      || holdingCreateArg?.instrument?.id?.id
      || holdingCreateArg?.instrument?.id
      || '';

    // Find credential contracts whose createArgument.id includes the instrument ID
    const matchingCredentials = instrumentId
      ? credentialContracts.filter((cred: any) => {
          const credEntry = cred.contractEntry?.JsActiveContract?.createdEvent || cred.createdEvent || cred;
          const credCreateArg = credEntry?.createArgument || cred?.createArgument || {};
          return credCreateArg.id && credCreateArg.id.includes(instrumentId);
        })
      : [];

    // Patch choice context with receiver credentials
    const receiverCredentialCids = matchingCredentials.map((cred: any) => {
      const entry = cred.contractEntry?.JsActiveContract?.createdEvent || cred.createdEvent || cred;
      return { tag: 'AV_ContractId', value: entry.contractId };
    });

    const choiceContextData = choiceContext.choiceContextData || { values: {} };
    choiceContextData.values = choiceContextData.values || {};
    choiceContextData.values['utility.digitalasset.com/receiver-credentials'] = {
      tag: 'AV_List',
      value: receiverCredentialCids,
    };

    // Build disclosed contracts from registry response + credential contracts
    const registryDisclosed = choiceContext.disclosedContracts || [];
    const credentialDisclosed = matchingCredentials.map((cred: any) => {
      const entry = cred.contractEntry?.JsActiveContract?.createdEvent || cred.createdEvent || cred;
      const synchronizerId = cred.contractEntry?.JsActiveContract?.synchronizerId || (cred as any).synchronizerId || '';
      return {
        templateId: entry.templateId,
        contractId: entry.contractId,
        createdEventBlob: entry.createdEventBlob,
        synchronizerId,
      };
    });
    const disclosedContracts = [...registryDisclosed, ...credentialDisclosed];

    await p.submitTransaction({
      commands: [{
        ExerciseCommand: {
          templateId: TRANSFER_INSTRUCTION_INTERFACE_ID,
          contractId,
          choice: 'TransferInstruction_Accept',
          choiceArgument: {
            extraArgs: {
              context: choiceContextData,
              meta: { values: {} },
            },
          },
        },
      }],
      disclosedContracts,
    });
    await fetchData();
  }, [fetchData, holdingContracts, credentialContracts]);

  const rejectTransferHolding = useCallback(async (contractId: string) => {
    const p = providerRef.current;
    if (!p) return;

    // Fetch choice context from registry
    const choiceContextRes = await fetch(
      `${REGISTRY_URL}/registry/transfer-instruction/v1/${contractId}/choice-contexts/reject`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: {}, excludeDebugFields: true }),
      },
    );
    if (!choiceContextRes.ok) {
      throw new Error(`Failed to get choice context: ${choiceContextRes.status} ${await choiceContextRes.text()}`);
    }
    const choiceContext = await choiceContextRes.json();

    await p.submitTransaction({
      commands: [{
        ExerciseCommand: {
          templateId: TRANSFER_INSTRUCTION_INTERFACE_ID,
          contractId,
          choice: 'TransferInstruction_Reject',
          choiceArgument: {
            extraArgs: {
              context: choiceContext.choiceContextData || { values: {} },
              meta: { values: {} },
            },
          },
        },
      }],
      disclosedContracts: choiceContext.disclosedContracts || [],
    });
    await fetchData();
  }, [fetchData]);

  const withdrawExpiredTransfer = useCallback(async (contractId: string) => {
    const p = providerRef.current;
    if (!p) return;

    await p.submitTransaction({
      commands: [{
        ExerciseCommand: {
          templateId: TRANSFER_INSTRUCTION_INTERFACE_ID,
          contractId,
          choice: 'TransferInstruction_Withdraw',
          choiceArgument: {
            extraArgs: {
              context: { values: {} },
              meta: { values: {} },
            },
          },
        },
      }],
      disclosedContracts: [],
    });
    await fetchData();
  }, [fetchData]);

  const transfer = useCallback(async (
    recipient: string,
    amount: string | number,
    instrument?: InstrumentSpec,
    options?: TransferOptions,
  ) => {
    const p = providerRef.current;
    if (!p) throw new Error('Not connected');
    return p.transfer(recipient, amount, instrument, options);
  }, []);

  const estimateGas = useCallback(async (payload: TransactionPayload): Promise<EstimatedGasResponse> => {
    const p = providerRef.current;
    if (!p) throw new Error('Not connected');
    return p.estimateGas(payload);
  }, []);

  const estimateTransferGas = useCallback(async (
    recipient: string,
    amount: string | number,
    instrument?: InstrumentSpec,
    options?: TransferOptions,
  ): Promise<EstimatedGasResponse> => {
    const p = providerRef.current;
    if (!p) throw new Error('Not connected');
    if (estimatingRef.current) throw new Error('Gas estimation already in progress');

    estimatingRef.current = true;
    setIsEstimatingGas(true);
    try {
      const amountStr = typeof amount === 'number' ? amount.toString() : amount;
      const now = new Date().toISOString();
      const executeBefore = options?.executeBefore instanceof Date
        ? options.executeBefore.toISOString()
        : options?.executeBefore || undefined;

      const transferRequest = {
        recipient,
        amount: amountStr,
        instrument: {
          instrument_admin: instrument?.instrument_admin,
          instrument_id: instrument?.instrument_id || DEFAULT_INSTRUMENT_ID,
        },
        requested_at: now,
        execute_before: executeBefore,
        ...(options?.memo ? { memo: options.memo } : {}),
      };

      const preparedPayload = await p.connection.prepareTransfer(p.getAuthToken(), transferRequest);
      const estimate = await p.estimateGas({
        commands: preparedPayload.commands,
        disclosedContracts: preparedPayload.disclosedContracts,
        packageIdSelectionPreference: preparedPayload.packageIdSelectionPreference,
        actAs: preparedPayload.actAs,
        readAs: preparedPayload.readAs,
        synchronizerId: preparedPayload.synchronizerId,
      });

      setEstimatedGas(estimate);
      console.log('[LoopDApp] Gas estimate:', estimate);
      return estimate;
    } finally {
      estimatingRef.current = false;
      setIsEstimatingGas(false);
    }
  }, []);

  const clearGasEstimate = useCallback(() => {
    setEstimatedGas(null);
  }, []);

  return (
    <LoopContext.Provider value={{
      provider,
      isConnected,
      isConnecting,
      isInitializing,
      holdings,
      holdingContracts,
      credentialOffers,
      sentContracts,
      ccBalance,
      estimatedGas,
      isEstimatingGas,
      connect,
      disconnect,
      acceptCredential,
      rejectCredential,
      acceptTransferHolding,
      rejectTransferHolding,
      withdrawExpiredTransfer,
      transfer,
      estimateGas,
      estimateTransferGas,
      clearGasEstimate,
      refreshData: fetchData,
    }}>
      {children}
    </LoopContext.Provider>
  );
}
