import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLoop } from '../context/LoopContext';
import SmoothButton from '@components/ui/smoothui/smooth-button';
import BasicToast from '@components/ui/smoothui/basic-toast';
import { Send, ChevronDown, Clock, FileText, User, Coins, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const EXPIRY_PRESETS = [
  { label: '3 hours', minutes: 180 },
  { label: '1 day', minutes: 1440 },
  { label: '1 week', minutes: 10080 },
  { label: '10 days', minutes: 14400 },
  { label: '30 days', minutes: 43200 },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function DateTimePicker({ value, onChange, onClose, minDate }: {
  value: string;
  onChange: (iso: string) => void;
  onClose: () => void;
  minDate: Date;
}) {
  const selected = value ? new Date(value) : new Date();
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [selDay, setSelDay] = useState(selected.getDate());
  const [selMonth, setSelMonth] = useState(selected.getMonth());
  const [selYear, setSelYear] = useState(selected.getFullYear());
  const [hour, setHour] = useState(selected.getHours());
  const [minute, setMinute] = useState(selected.getMinutes());

  const emit = useCallback((y: number, m: number, d: number, h: number, min: number) => {
    const dt = new Date(y, m, d, h, min, 0, 0);
    onChange(dt.toISOString());
  }, [onChange]);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length < totalCells) calendarDays.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (d: number) => {
    setSelDay(d);
    setSelMonth(viewMonth);
    setSelYear(viewYear);
    emit(viewYear, viewMonth, d, hour, minute);
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  const selectedDateTime = new Date(selYear, selMonth, selDay, hour, minute, 0, 0);
  const isDateTimePast = selectedDateTime <= new Date();

  const isSelected = (d: number) => selDay === d && selMonth === viewMonth && selYear === viewYear;
  const isPast = (d: number) => {
    const cd = new Date(viewYear, viewMonth, d);
    cd.setHours(23, 59, 59, 999);
    return cd < minDate;
  };

  const btnBase: React.CSSProperties = {
    border: '1px solid var(--color-border)',
    background: 'rgba(255,255,255,0.10)',
    color: 'var(--color-foreground)',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    WebkitAppearance: 'none',
    appearance: 'none',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="absolute z-10 mt-1 rounded-2xl p-4 w-72"
      style={{
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'var(--color-surface-raised)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-palette)',
      }}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 rounded-md hover:bg-white/[0.04] transition-colors"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 rounded-md hover:bg-white/[0.04] transition-colors"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map(dh => (
          <div key={dh} className="text-center text-xs py-1" style={{ color: 'var(--color-muted-foreground)' }}>
            {dh}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} />;
          const selected = isSelected(d);
          const past = isPast(d);
          return (
            <button
              key={d}
              type="button"
              disabled={past}
              onClick={() => selectDay(d)}
              className="w-full aspect-square rounded-md text-sm transition-colors"
              style={{
                border: 'none',
                background: selected ? 'var(--color-accent)' : 'transparent',
                color: selected ? 'var(--color-accent-foreground)' : past ? 'var(--color-border)' : 'var(--color-foreground)',
                cursor: past ? 'default' : 'pointer',
                opacity: past ? 0.4 : 1,
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Time selects */}
      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <select
          value={hour}
          onChange={(e) => {
            const h = Number(e.target.value);
            setHour(h);
            emit(selYear, selMonth, selDay, h, minute);
          }}
          className="flex-1 rounded-lg px-2 py-2 text-sm"
          style={btnBase}
        >
          {hourOptions.map(h => (
            <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
          ))}
        </select>
        <span style={{ color: 'var(--color-muted-foreground)' }}>:</span>
        <select
          value={minute}
          onChange={(e) => {
            const m = Number(e.target.value);
            setMinute(m);
            emit(selYear, selMonth, selDay, hour, m);
          }}
          className="flex-1 rounded-lg px-2 py-2 text-sm"
          style={btnBase}
        >
          {minuteOptions.map(m => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={isDateTimePast}
          onClick={onClose}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: isDateTimePast ? 'var(--color-border)' : 'var(--color-accent)',
            color: isDateTimePast ? 'var(--color-muted-foreground)' : 'var(--color-accent-foreground)',
            border: 'none',
            cursor: isDateTimePast ? 'default' : 'pointer',
            opacity: isDateTimePast ? 0.5 : 1,
          }}
        >
          OK
        </button>
      </div>
      {isDateTimePast && (
        <p className="text-xs mt-2" style={{ color: 'var(--color-warning)' }}>
          Selected time is in the past
        </p>
      )}
    </motion.div>
  );
}

function formatCCBalance(raw: string): string {
  const n = Number(raw);
  if (n === 0) return '0';
  if (n < 0.001) return '<0.001';
  return n.toFixed(n < 1 ? 6 : 3);
}

export function TransferForm() {
  const { holdings, isConnected, ccBalance, estimatedGas, isEstimatingGas, transfer, estimateTransferGas, clearGasEstimate } = useLoop();

  const [selectedInstrumentKey, setSelectedInstrumentKey] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(1440);
  const [isCustomExpiry, setIsCustomExpiry] = useState(false);
  const [customExpiryDate, setCustomExpiryDate] = useState(() => new Date(Date.now() + 1440 * 60 * 1000).toISOString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const nonCcHoldings = [...holdings]
    .filter(h => h.symbol !== 'CC')
    .sort((a, b) => {
      const keyA = `${a.instrument_id.admin}-${a.instrument_id.id}`;
      const keyB = `${b.instrument_id.admin}-${b.instrument_id.id}`;
      return keyA.localeCompare(keyB);
    });
  const selectedHolding = nonCcHoldings.find(
    h => `${h.instrument_id.admin}::${h.instrument_id.id}` === selectedInstrumentKey,
  ) ?? null;

  const handleMax = useCallback(() => {
    if (selectedHolding) {
      setAmount(selectedHolding.total_unlocked_coin);
    }
  }, [selectedHolding]);

  const getExecuteBefore = useCallback((): Date => {
    if (isCustomExpiry && customExpiryDate) {
      return new Date(customExpiryDate);
    }
    return new Date(Date.now() + expiryMinutes * 60 * 1000);
  }, [isCustomExpiry, customExpiryDate, expiryMinutes]);

  const handleSubmit = useCallback(async () => {
    if (!selectedHolding || !recipient || !amount) return;

    // If no estimate yet or estimate says can't execute, block
    if (!estimatedGas) {
      setToast({ message: 'Gas estimation pending. Please wait a moment.', type: 'error' });
      return;
    }
    if (!estimatedGas.can_execute) {
      setToast({ message: `Cannot execute: estimated gas ${estimatedGas.estimated_gas_amount || 'N/A'} CC`, type: 'error' });
      return;
    }

    if (isCustomExpiry && new Date(customExpiryDate) <= new Date()) {
      setToast({ message: 'Expiration time is in the past', type: 'error' });
      return;
    }

    setIsSending(true);
    try {
      const executeBefore = getExecuteBefore();
      const instrument = { instrument_id: selectedHolding.instrument_id.id, instrument_admin: selectedHolding.instrument_id.admin };
      const options = { memo, executeBefore };

      await transfer(recipient, amount, instrument, options);
      setToast({ message: 'Transfer submitted successfully', type: 'success' });
      setRecipient('');
      setAmount('');
      setMemo('');
      clearGasEstimate();
    } catch (e: any) {
      setToast({ message: `Transfer failed: ${e.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsSending(false);
    }
  }, [selectedHolding, recipient, amount, memo, getExecuteBefore, estimatedGas, transfer, clearGasEstimate, isCustomExpiry, customExpiryDate]);

  const canSubmit = selectedHolding && recipient.trim() && amount && Number(amount) > 0 && !isSending;

  // Debounced gas estimation on form field changes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!selectedHolding || !recipient.trim() || !amount || Number(amount) <= 0) {
      clearGasEstimate();
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const executeBefore = getExecuteBefore();
      const instrument = { instrument_id: selectedHolding.instrument_id.id, instrument_admin: selectedHolding.instrument_id.admin };
      const opts = { memo, executeBefore };
      estimateTransferGas(recipient, amount, instrument, opts);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedInstrumentKey, recipient, amount, memo, getExecuteBefore, selectedHolding, estimateTransferGas, clearGasEstimate]);

  const inputBaseStyle: React.CSSProperties = {
    border: '1px solid var(--color-border)',
    background: 'rgba(255,255,255,0.10)',
    color: 'var(--color-foreground)',
    transition: 'border-color var(--duration-normal) var(--ease-out)',
    outline: 'none',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  };

  if (!isConnected) {
    return (
      <section
        className="rounded-2xl p-6 border"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(10,10,28,0.55)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 8px 32px rgba(0,0,0,0.28)' }}
      >
        <div className="text-center py-12" style={{ color: 'var(--color-muted-foreground)' }}>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <Send className="w-5 h-5" style={{ color: 'var(--color-muted-foreground)' }} />
          </div>
          <p className="text-sm">Connect your wallet to transfer tokens</p>
        </div>
      </section>
    );
  }

  if (nonCcHoldings.length === 0) {
    return (
      <section
        className="rounded-2xl p-6 border"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(10,10,28,0.55)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 8px 32px rgba(0,0,0,0.28)' }}
      >
        <div className="text-center py-12" style={{ color: 'var(--color-muted-foreground)' }}>
          <p className="text-sm">No transferable tokens found</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        className="rounded-2xl border p-6 relative"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(10,10,28,0.55)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 8px 32px rgba(0,0,0,0.28)', zIndex: 10 }}
      >
        <h2
          className="text-lg font-semibold mb-6 flex items-center gap-2 tracking-tight"
          style={{ color: 'var(--color-foreground-dim)', fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif" }}
        >
          <Send className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          Transfer Tokens
        </h2>

        <div className="flex flex-col gap-5">
          {/* Token picker */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Token
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm"
                style={inputBaseStyle}
                onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.borderColor = 'var(--color-border-hover)'; }}
                onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              >
                {selectedHolding ? (
                  <span className="flex items-center gap-2">
                    <Coins className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                    <span className="font-medium">{selectedHolding.symbol}</span>
                    <span style={{ color: 'var(--color-muted-foreground)' }}>
                      &mdash; Balance: {formatCCBalance(selectedHolding.total_unlocked_coin)}
                    </span>
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-muted-foreground)' }}>Select a token</span>
                )}
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
                </motion.span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute z-10 mt-1 w-full rounded-xl max-h-52 overflow-y-auto"
                    style={{
                      border: '1px solid rgba(0,0,0,0.10)',
                      background: 'var(--color-surface-raised)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      boxShadow: 'var(--shadow-palette)',
                    }}
                  >
                    {nonCcHoldings.map((h) => {
                      const key = `${h.instrument_id.admin}::${h.instrument_id.id}`;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setSelectedInstrumentKey(key); setIsOpen(false); }}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/[0.04] transition-colors"
                          style={key === selectedInstrumentKey ? { background: 'var(--color-accent-muted)' } : {}}
                        >
                          <span className="flex items-center gap-2">
                            <Coins className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                            <span className="font-medium">{h.symbol}</span>
                            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{h.org_name}</span>
                          </span>
                          <span className="text-xs tabular-nums" style={{ color: 'var(--color-muted-foreground)' }}>
                            {formatCCBalance(h.total_unlocked_coin)}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label
              htmlFor="recipient"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <User className="w-3.5 h-3.5 inline mr-1.5" />
              Recipient
            </label>
            <input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Recipient party ID"
              className="w-full rounded-xl px-4 py-3 text-sm placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-accent)]"
              style={inputBaseStyle}
            />
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <Coins className="w-3.5 h-3.5 inline mr-1.5" />
              Amount
            </label>
            <div className="flex gap-2">
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="flex-1 rounded-lg px-4 py-3 text-sm placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-accent)]"
                style={inputBaseStyle}
              />
              <SmoothButton variant="outline" size="sm" className="h-11" onClick={handleMax} disabled={!selectedHolding}>
                Max
              </SmoothButton>
            </div>
            {selectedHolding && (
              <div className="text-xs mt-1.5" style={{ color: 'var(--color-muted-foreground)' }}>
                Available: {formatCCBalance(selectedHolding.total_unlocked_coin)} {selectedHolding.symbol}
              </div>
            )}
          </div>

          {/* Memo */}
          <div>
            <label
              htmlFor="memo"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1.5" />
              Memo <span className="text-xs">(optional)</span>
            </label>
            <input
              id="memo"
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Add a note..."
              className="w-full rounded-xl px-4 py-3 text-sm placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-accent)]"
              style={inputBaseStyle}
            />
          </div>

          {/* Expiration */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <Clock className="w-3.5 h-3.5 inline mr-1.5" />
              Expiration
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPIRY_PRESETS.map((preset) => {
                const active = !isCustomExpiry && expiryMinutes === preset.minutes;
                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => { setIsCustomExpiry(false); setShowDatePicker(false); setExpiryMinutes(preset.minutes); }}
                    className="rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200"
                    style={{
                      border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                      background: active ? 'var(--color-accent-muted)' : 'rgba(255,255,255,0.10)',
                      color: active ? 'var(--color-accent-soft)' : 'var(--color-muted-foreground)',
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (!isCustomExpiry) { setIsCustomExpiry(true); setShowDatePicker(true); }
                    else setShowDatePicker(!showDatePicker);
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200"
                  style={{
                    border: isCustomExpiry ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                    background: isCustomExpiry ? 'var(--color-accent-muted)' : 'rgba(255,255,255,0.10)',
                    color: isCustomExpiry ? 'var(--color-accent-soft)' : 'var(--color-muted-foreground)',
                  }}
                >
                  {isCustomExpiry
                    ? new Date(customExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Custom'}
                </button>
                <AnimatePresence>
                  {showDatePicker && (
                    <DateTimePicker
                      value={customExpiryDate}
                      onChange={(iso) => setCustomExpiryDate(iso)}
                      onClose={() => setShowDatePicker(false)}
                      minDate={new Date()}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* CC Balance */}
          <div
            className="rounded-xl border p-3.5 flex items-center gap-3"
            style={{
              borderColor: 'var(--color-border)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <Coins className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-muted-foreground)' }} />
            <div className="text-sm">
              <span style={{ color: 'var(--color-muted-foreground)' }}>CC Balance: </span>
              <span className="font-medium tabular-nums" style={{ color: 'var(--color-foreground)' }}>
                {formatCCBalance(ccBalance)} CC
              </span>
            </div>
          </div>

          {/* Gas Estimate */}
          <div
            className="rounded-xl border p-3.5 flex items-center gap-3"
            style={{
              borderColor: estimatedGas
                ? (estimatedGas.can_execute ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)')
                : 'var(--color-border)',
              background: estimatedGas
                ? (estimatedGas.can_execute ? 'var(--color-success-muted)' : 'var(--color-warning-muted)')
                : 'rgba(255,255,255,0.04)',
            }}
          >
            {estimatedGas
              ? (estimatedGas.can_execute
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                : <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
              )
              : <Send className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-muted-foreground)' }} />
            }
            <div className="text-sm">
              <span style={{ color: 'var(--color-muted-foreground)' }}>Estimated Gas: </span>
              {isEstimatingGas && !estimatedGas ? (
                <span className="font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Estimating...</span>
              ) : estimatedGas ? (
                <>
                  {estimatedGas.requires_gas === false ? (
                    <span className="font-medium" style={{ color: 'var(--color-success)' }}>Free</span>
                  ) : (
                    <span
                      className="font-medium tabular-nums"
                      style={{ color: estimatedGas.can_execute ? 'var(--color-success)' : 'var(--color-warning)' }}
                    >
                      {estimatedGas.estimated_gas_amount ?? '...'}
                      {estimatedGas.estimated_gas_asset ? ` ${estimatedGas.estimated_gas_asset}` : ' CC'}
                    </span>
                  )}
                  {!estimatedGas.can_execute && (
                    <span className="text-xs ml-2" style={{ color: 'var(--color-warning)' }}>
                      Insufficient gas
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: 'var(--color-muted-foreground)' }}>Fill form to estimate</span>
              )}
            </div>
          </div>

          {/* Submit */}
          <SmoothButton
            variant="candy"
            size="default"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full mt-2"
          >
            <Send className="w-4 h-4" />
            {isSending ? 'Sending...' : 'Send Transfer'}
          </SmoothButton>
        </div>
      </section>

      {/* Click-outside handler for token picker */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[5]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Click-outside handler for date picker */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[5]"
            onClick={() => setShowDatePicker(false)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
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
