import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { loop } from '@fivenorth/loop-sdk';
import type { Holding, ActiveContract } from '@fivenorth/loop-sdk';
import type { Provider } from '@fivenorth/loop-sdk/dist/provider';

const CREDENTIAL_TEMPLATE_ID = '#utility-credential-app-v0:Utility.Credential.App.V0.Model.Offer:CredentialOffer';
const CREDENTIAL_V0_TEMPLATE_ID = '#utility-credential-v0:Utility.Credential.V0.Credential:Credential';
const HOLDING_INTERFACE_ID = '#splice-api-token-holding-v1:Splice.Api.Token.HoldingV1:Holding';
const TRANSFER_INSTRUCTION_INTERFACE_ID = '#splice-api-token-transfer-instruction-v1:Splice.Api.Token.TransferInstructionV1:TransferInstruction';
const REGISTRY_URL = 'https://api.utilities.digitalasset-dev.com/api/token-standard/v0/registrars/192ae516-ec66-4dce-ace9-f237a95609c0::12200be238a3079e5c7b425e9e9c458eebd6a6991bf0ec7dd22b388be3bf0a8c57f1';
const TRANSFER_PREAPPROVAL_TEMPLATE ="#utility-registry-app-v0:Utility.Registry.App.V0.Model.TransferPreapproval:TransferPreapproval";
const POLL_INTERVAL = 8000;

interface LoopContextValue {
  provider: Provider | null;
  isConnected: boolean;
  isConnecting: boolean;
  holdings: Holding[];
  holdingContracts: ActiveContract[];
  credentialOffers: ActiveContract[];
  connect: () => Promise<void>;
  disconnect: () => void;
  acceptCredential: (contractId: string) => Promise<void>;
  rejectCredential: (contractId: string) => Promise<void>;
  acceptTransferHolding: (contractId: string) => Promise<void>;
  rejectTransferHolding: (contractId: string) => Promise<void>;
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
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [holdingContracts, setHoldingContracts] = useState<ActiveContract[]>([]);
  const [credentialOffers, setCredentialOffers] = useState<ActiveContract[]>([]);
  const [credentialContracts, setCredentialContracts] = useState<ActiveContract[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const providerRef = useRef<Provider | null>(null);

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

    // Try auto-connect
    loop.autoConnect().catch(() => {});
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
      console.log('[LoopDApp] Holdings:', h);
      console.log('[LoopDApp] Holding contracts:', hc);
      console.log('[LoopDApp] Credential offers:', cc);
      console.log('[LoopDApp] Credential contracts:', creds);
      setHoldings(h || []);
      setHoldingContracts(hc || []);
      setCredentialOffers(cc || []);
      setCredentialContracts(creds || []);
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

  return (
    <LoopContext.Provider value={{
      provider,
      isConnected,
      isConnecting,
      holdings,
      holdingContracts,
      credentialOffers,
      connect,
      disconnect,
      acceptCredential,
      rejectCredential,
      acceptTransferHolding,
      rejectTransferHolding,
      refreshData: fetchData,
    }}>
      {children}
    </LoopContext.Provider>
  );
}
