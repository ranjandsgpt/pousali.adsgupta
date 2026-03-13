'use client';

import { useMemo, useState } from 'react';

type LeakageRateKey = 'conservative' | 'typical' | 'high';
type CurrencyCode = 'GBP' | 'USD' | 'EUR';

const LEAKAGE_RATE_MAP: Record<LeakageRateKey, number> = {
  conservative: 0.01,
  typical: 0.02,
  high: 0.03,
};

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

function formatCurrency(value: number, currency: CurrencyCode): string {
  if (!Number.isFinite(value)) return '0.00';
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface ToggleButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function ToggleButton({ label, active, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors border',
        active
          ? 'bg-cyan-500 text-black border-cyan-400'
          : 'bg-transparent text-[var(--color-text-muted)] border-white/10 hover:border-cyan-500/60 hover:text-[var(--color-text)]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export default function ProfitLeakageCalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [leakageRate, setLeakageRate] = useState<LeakageRateKey>('typical');
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');

  const symbol = CURRENCY_SYMBOLS[currency];

  const {
    totalLeakage,
    annualLeakage,
    wastedAdSpend,
    fbaFees,
    shipmentErrors,
    refundAdminFees,
  } = useMemo(() => {
    const rate = LEAKAGE_RATE_MAP[leakageRate];
    const total = monthlyRevenue * rate;
    return {
      totalLeakage: total,
      annualLeakage: total * 12,
      wastedAdSpend: total * 0.4,
      fbaFees: total * 0.25,
      shipmentErrors: total * 0.2,
      refundAdminFees: total * 0.15,
    };
  }, [monthlyRevenue, leakageRate]);

  const handleMonthlyRevenueChange = (value: string) => {
    const numeric = Number(value.replace(/,/g, ''));
    if (Number.isNaN(numeric)) {
      setMonthlyRevenue(0);
    } else {
      setMonthlyRevenue(Math.max(0, numeric));
    }
  };

  const showOutput = monthlyRevenue > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 md:p-6 space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-text)]">
          Profit Leakage Calculator
        </h2>
        <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-2xl">
          Estimate how much revenue you&apos;re likely losing every month to wasted ad spend, FBA fee
          overcharges, shipment errors, and refund administration fees.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            Your monthly Amazon revenue
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[var(--color-surface)] px-3 py-2.5 focus-within:border-cyan-500/70">
              <span className="text-sm text-[var(--color-text-muted)]">{symbol}</span>
              <input
                type="number"
                inputMode="decimal"
                className="w-full bg-transparent outline-none border-0 text-sm md:text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                placeholder="e.g. 75,000"
                value={monthlyRevenue ? monthlyRevenue : ''}
                onChange={(e) => handleMonthlyRevenueChange(e.target.value)}
                min={0}
              />
            </div>
          </label>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Leakage assumption
            </p>
            <div className="flex flex-wrap gap-2">
              <ToggleButton
                label="Conservative (1%)"
                active={leakageRate === 'conservative'}
                onClick={() => setLeakageRate('conservative')}
              />
              <ToggleButton
                label="Typical (2%)"
                active={leakageRate === 'typical'}
                onClick={() => setLeakageRate('typical')}
              />
              <ToggleButton
                label="High Risk (3%)"
                active={leakageRate === 'high'}
                onClick={() => setLeakageRate('high')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Currency
            </p>
            <div className="flex flex-wrap gap-2">
              {(['GBP', 'USD', 'EUR'] as CurrencyCode[]).map((code) => (
                <ToggleButton
                  key={code}
                  label={code}
                  active={currency === code}
                  onClick={() => setCurrency(code)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {showOutput && (
            <div className="rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-3 transition-all duration-300">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300 mb-1">
                Estimated hidden leakage
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-1 transition-all duration-300">
                You are likely losing {symbol}
                {formatCurrency(totalLeakage, currency)} per month
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                That&apos;s {symbol}
                {formatCurrency(annualLeakage, currency)} per year.
              </p>
            </div>
          )}

          {showOutput && (
            <div className="rounded-xl border border-white/10 bg-[var(--color-surface)] p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Approximate breakdown
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text)]">Wasted ad spend</span>
                <span className="text-[var(--color-text-muted)]">
                  {symbol}
                  {formatCurrency(wastedAdSpend, currency)} <span className="text-xs">(≈40%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text)]">FBA fee overcharges</span>
                <span className="text-[var(--color-text-muted)]">
                  {symbol}
                  {formatCurrency(fbaFees, currency)} <span className="text-xs">(≈25%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text)]">Shipment errors</span>
                <span className="text-[var(--color-text-muted)]">
                  {symbol}
                  {formatCurrency(shipmentErrors, currency)} <span className="text-xs">(≈20%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text)]">Refund admin fees</span>
                <span className="text-[var(--color-text-muted)]">
                  {symbol}
                  {formatCurrency(refundAdminFees, currency)} <span className="text-xs">(≈15%)</span>
                </span>
              </div>
            </div>
          )}

          <div className="pt-1">
            <a
              href="/audit"
              className="inline-flex items-center justify-center rounded-full bg-cyan-500 text-black text-sm font-semibold px-4 py-2 hover:bg-cyan-400 transition-colors"
            >
              Want the exact number? Upload your report now →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

