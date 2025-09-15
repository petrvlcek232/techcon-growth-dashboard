# TechCon Growth Dashboard

Next.js 15 aplikace pro analýzu růstu a poklesu zákazníků napříč měsíci s serverovým ingestionem Excel/CSV souborů.

## Funkce

- 📊 **Dashboard** s přehledem všech zákazníků a trendů
- 📈 **Detailní analýza** jednotlivých zákazníků s grafy
- 📅 **Filtrování** podle časového období
- 🔄 **Automatický ingest** Excel/CSV souborů
- 📱 **Responzivní design** s moderním UI
- 🚀 **Deploy na Vercel** s build-time zpracováním dat

## Tech Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS** + shadcn/ui komponenty
- **Recharts** pro grafy a sparklines
- **xlsx** + papaparse pro parsování souborů
- **zod** pro validaci dat
- **date-fns** + lodash pro práci s daty

## Rychlý start

### 1. Instalace

```bash
npm install
```

### 2. Příprava dat

Zkopírujte své Excel/CSV soubory do adresáře `./data/dvur/`:

```
data/dvur/
├── Dvur_24_01.xls
├── Dvur_24_02.xlsx
├── Dvur_24_03.csv
└── ...
```

**Podporované formáty názvů:**
- `Dvur_24_01.xls` → leden 2024
- `Dvur_25_08.xlsx` → srpen 2025
- `24.01.csv` → leden 2024
- `2024-01.xls` → leden 2024

**Požadované sloupce:**
- **Odběratel** (string) → identifikátor zákazníka
- **Obrat výdej zboží bez DPH** (number) → revenue za měsíc
- **Zisk** (number) → profit za měsíc
- **Marže %** (number 0–100) → marginPct za měsíc

### 3. Zpracování dat

```bash
npm run ingest
```

Tento příkaz vygeneruje `public/data/processed.json` s agregovanými daty.

### 4. Spuštění aplikace

```bash
npm run dev
```

Otevřete [http://localhost:3000](http://localhost:3000) v prohlížeči.

## Git a nasazení

### Git setup

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin git@github.com:PetrVilcek232/techcon-growth-dashboard.git
git push -u origin main
```

### Vercel deploy

1. Importujte repo v [Vercel](https://vercel.com)
2. **Build Command:** `npm run build`
3. **Output Directory:** `.next` (default)
4. Deploy!

**Důležité:** Data musí být v repu v `data/dvur/` nebo alespoň `public/data/processed.json` před buildem.

## Aktualizace dat

### Lokálně

1. Nahrajte nové soubory do `data/dvur/`
2. Spusťte `npm run ingest`
3. Restartujte `npm run dev`

### Pro deploy

1. Commitněte změněný `public/data/processed.json`
2. Pushněte → Vercel se automaticky rebuildne

## Struktura projektu

```
├── app/
│   ├── api/data/refresh/route.ts    # API pro refresh dat
│   ├── customer/[slug]/page.tsx     # Detail zákazníka
│   ├── page.tsx                     # Hlavní dashboard
│   └── layout.tsx
├── components/
│   ├── ui/                          # shadcn/ui komponenty
│   ├── CustomerList.tsx
│   ├── CustomerRow.tsx
│   ├── TrendBadge.tsx
│   ├── Sparkline.tsx
│   ├── MonthRangePicker.tsx
│   ├── SummaryCards.tsx
│   ├── DataTable.tsx
│   └── Header.tsx
├── lib/
│   ├── types.ts                     # TypeScript typy
│   ├── config.ts                    # Konfigurace a mapování
│   ├── format.ts                    # Formátování a parsování
│   ├── ingest.ts                    # Logika parsování souborů
│   ├── compute.ts                   # Výpočty metrik a trendů
│   └── storage.ts                   # Čtení/zápis JSON cache
├── scripts/
│   └── run-ingest.js                # Build-time ingest skript
├── data/
│   └── dvur/                        # Excel/CSV soubory
└── public/
    └── data/
        └── processed.json           # Agregovaná data
```

## Výpočty a metriky

### Trendy zákazníků

- **UP**: růst ≥ +5%
- **DOWN**: pokles ≤ -5%
- **FLAT**: změna v rozsahu -5% až +5%

### Agregované metriky

- **Celkové tržby/zisk** za celé období
- **Průměrná marže** (vážená podle revenue)
- **Počet rostoucích/klesajících** zákazníků
- **Delta absolutní a procentuální** mezi prvním a posledním aktivním měsícem

## API

### POST /api/data/refresh

Spustí re-ingest dat a vrátí statistiky:

```json
{
  "ok": true,
  "stats": {
    "months": 20,
    "customers": 150,
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Skripty

- `npm run dev` - vývojový server
- `npm run build` - build s ingestem dat
- `npm run start` - produkční server
- `npm run ingest` - pouze zpracování dat
- `npm run lint` - ESLint kontrola
- `npm run format` - Prettier formátování

## Troubleshooting

### Chyba při ingest

- Zkontrolujte názvy souborů (musí obsahovat rok a měsíc)
- Ověřte sloupce v Excel/CSV (Odběratel, Obrat, Zisk, Marže %)
- Zkontrolujte formát čísel (čárky/tečky, oddělovače tisíců)

### Chyba při build

- Ujistěte se, že `data/dvur/` obsahuje soubory
- Spusťte `npm run ingest` před `npm run build`
- Zkontrolujte, že `public/data/processed.json` existuje

### Chyba na Vercelu

- Data musí být v repu před buildem
- Build Command musí být `npm run build`
- Zkontrolujte build logy v Vercel dashboardu

## Licence

MIT