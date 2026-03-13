'use client';

import { useMemo, useState } from 'react';

type CurrencyCode = 'GBP' | 'USD' | 'EUR';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '0.00';
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(2)}%`;
}

function formatMultiplier(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(2)}x`;
}

export default function TacosCalculator() {
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');
  const [adSpend, setAdSpend] = useState(0);
  const [adSales, setAdSales] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  const symbol = CURRENCY_SYMBOLS[currency];

  const { acos, tacos, roas, organicSales, organicPct } = useMemo(() => {
    const acosVal = adSales > 0 ? (adSpend / adSales) * 100 : NaN;
    const tacosVal = totalSales > 0 ? (adSpend / totalSales) * 100 : NaN;
    const roasVal = adSpend > 0 ? adSales / adSpend : NaN;
    const organic = totalSales > 0 ? Math.max(totalSales - adSales, 0) : NaN;
    const organicPctVal = totalSales > 0 ? (organic / totalSales) * 100 : NaN;
    return {
      acos: acosVal,
      tacos: tacosVal,
      roas: roasVal,
      organicSales: organic,
      organicPct: organicPctVal,
    };
  }, [adSpend, adSales, totalSales]);

  const handleNumberChange = (raw: string, setter: (v: number) => void) => {
    const numeric = Number(raw.replace(/,/g, ''));
    if (Number.isNaN(numeric)) {
      setter(0);
    } else {
      setter(Math.max(0, numeric));
    }
  };

  const acosDisplay = adSales > 0 ? formatPercent(acos) : '—';
  const tacosDisplay = totalSales > 0 ? formatPercent(tacos) : '—';
  const roasDisplay = adSpend > 0 ? formatMultiplier(roas) : '—';
  const organicSalesDisplay = totalSales > 0 ? `${symbol}${formatCurrency(organicSales)}` : '—';
  const organicPctDisplay = totalSales > 0 ? formatPercent(organicPct) : '—';

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--color-surface-elevated)] p-5 md:p-6 space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-text)]">
          Amazon TACoS Calculator
        </h2>
        <p className="text-sm md:text-base text-[var(--color-text-muted)] max-w-2xl">
          Input your ad spend, ad-attributed sales, and total store sales to understand ACOS, TACoS, ROAS, and
          how much of your revenue is organic.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              Ad Spend
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-[var(--color-surface)] px-3 py-2.5 focus-within:border-cyan-500/70">
                <span className="text-sm text-[var(--color-text-muted)]">{symbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full bg-transparent outline-none border-0 text-sm md:text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  value={adSpend || ''}
                  onChange={(e) => handleNumberChange(e.target.value, setAdSpend)}
                  min={0}
                />
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              Ad Sales
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-[var(--color-surface)] px-3 py-2.5 focus-within:border-cyan-500/70">
                <span className="text-sm text-[var(--color-text-muted)]">{symbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full bg-transparent outline-none border-0 text-sm md:text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  value={adSales || ''}
                  onChange={(e) => handleNumberChange(e.target.value, setAdSales)}
                  min={0}
                />
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              Total Store Sales
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-[var(--color-surface)] px-3 py-2.5 focus-within:border-cyan-500/70">
                <span className="text-sm text-[var(--color-text-muted)]">{symbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full bg-transparent outline-none border-0 text-sm md:text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  value={totalSales || ''}
                  onChange={(e) => handleNumberChange(e.target.value, setTotalSales)}
                  min={0}
                />
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Currency
            </p>
            <div className="flex flex-wrap gap-2">
              {(['GBP', 'USD', 'EUR'] as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={[
                    'px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors border',
                    currency === code
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-transparent text-[var(--color-text-muted)] border-white/10 hover:border-cyan-500/60 hover:text-[var(--color-text)]',
                  ].join(' ')}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-[var(--color-surface)] p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text)]">ACOS</span>
              <span className="text-[var(--color-text-muted)]">{acosDisplay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text)]">TACoS</span>
              <span className="text-[var(--color-text-muted)]">{tacosDisplay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text)]">ROAS</span>
              <span className="text-[var(--color-text-muted)]">{roasDisplay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text)]">Organic Sales</span>
              <span className="text-[var(--color-text-muted)]">{organicSalesDisplay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text)]">Organic %</span>
              <span className="text-[var(--color-text-muted)]">{organicPctDisplay}</span>
            </div>
          </div>

          <div className="pt-1">
            <a
              href="/audit"
              className="inline-flex items-center justify-center rounded-full bg-cyan-500 text-black text-sm font-semibold px-4 py-2 hover:bg-cyan-400 transition-colors"
            >
              Want your full TACoS breakdown by campaign? Run the full audit →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

