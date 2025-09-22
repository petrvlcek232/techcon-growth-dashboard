# Multi-data Views & Routes

Tento dokument popisuje nové multi-data pohledy implementované v dashboardu.

## Přehled

Dashboard nyní obsahuje 5 specializovaných pohledů pro analýzu dat:

1. **Top-X** (`/top`) - Nejlepší zákazníci podle metriky
2. **Compare** (`/compare`) - Porovnání vybraných zákazníků
3. **Contribution** (`/contribution`) - Příspěvky k celkové změně
4. **Matrix** (`/matrix`) - Matice ziskovosti (scatter plot)
5. **Heatmap** (`/heatmap`) - Teplotní mapa dat

## Navigace

### URL parametry

Všechny pohledy sdílejí společné URL parametry pro konzistentní stav:

- `start` - Počáteční měsíc (YYYY-MM)
- `end` - Koncový měsíc (YYYY-MM)
- `metric` - Metrika (revenue/profit/margin)
- `gran` - Granularita (month/quarter/year)
- `norm` - Normalizace (absolute/index100)
- `mode` - Mód pro Top-X (pct/abs)
- `trend` - Trend filtr (up/down/flat/all)
- `limit` - Limit pro Top-X (číslo)
- `ids` - Vybraní zákazníci pro Compare (CSV)
- `pareto` - Pareto threshold (0-100)
- `level` - Úroveň pro Heatmap (customer-month/monthly)
- `anomaly` - Detekce anomálií (none/2sigma)

### Klávesové zkratky

- `1-5` - Navigace mezi pohledy
- `G` - Toggle normalizace (jen na /compare)
- `,` - Posun období o měsíc zpět
- `.` - Posun období o měsíc vpřed

## Pohledy

### 1. Top-X (`/top`)

Zobrazuje nejlepší zákazníky podle vybrané metriky a kritérií.

**Funkce:**
- Filtrování podle trendu (rostoucí/klesající/stabilní)
- Mód procentuálního růstu vs. absolutních hodnot
- Sparkline grafy pro každého zákazníka
- Klik na zákazníka otevře detail v nové záložce

**Příklad URL:**
```
/top?metric=revenue&mode=pct&trend=up&limit=10&start=2024-01&end=2024-12
```

### 2. Compare (`/compare`)

Porovnává vybrané zákazníky v časové řadě.

**Funkce:**
- Multi-line graf pro porovnání
- Slope chart pro mnoho zákazníků (>10)
- Normalizace (absolutní vs. index 100)
- Automatické přepnutí na slope chart při mnoha zákaznících

**Příklad URL:**
```
/compare?ids=customer1,customer2,customer3&metric=revenue&norm=index100&gran=month
```

### 3. Contribution (`/contribution`)

Analyzuje příspěvky zákazníků k celkové změně.

**Funkce:**
- Bar chart s příspěvky zákazníků
- Pareto křivka s kumulativním pokrytím
- Konfigurovatelný Pareto threshold
- Detailní tabulka s procenty

**Příklad URL:**
```
/contribution?metric=revenue&pareto=80&start=2024-01&end=2024-12
```

### 4. Matrix (`/matrix`)

Scatter plot matice ziskovosti s kvadranty.

**Funkce:**
- X: Celkové tržby, Y: Průměrná marže, Velikost: Zisk
- Filtrování podle kvadrantů
- Klik na bod otevře detail zákazníka
- Statistiky a top zákazníci podle kvadrantů

**Příklad URL:**
```
/matrix?metric=revenue&start=2024-01&end=2024-12
```

### 5. Heatmap (`/heatmap`)

Teplotní mapa dat v matici zákazník × měsíc.

**Funkce:**
- Dva módy: customer-month a agregované měsíce
- Detekce anomálií (2-sigma)
- Klik na buňku otevře detail zákazníka v daném měsíci
- Horizontální scroll pro velké množství dat

**Příklad URL:**
```
/heatmap?metric=revenue&level=customer-month&anomaly=2sigma&start=2024-01&end=2024-12
```

## Sdílení odkazů

Všechny pohledy podporují sdílení odkazů s vyplněnými parametry. Stačí zkopírovat URL z prohlížeče - obsahuje všechny aktuální nastavení.

**Příklad sdíleného odkazu:**
```
https://your-domain.com/compare?ids=customer1,customer2&metric=revenue&start=2024-01&end=2024-12&norm=index100
```

## Sidebar

Levá strana obsahuje:

1. **Výběr zákazníků** - Full-text search, checkboxy, rychlé presety
2. **Rychlé filtry** - Trend, aktivní měsíce, Top-X limit
3. **Uložené pohledy** - Uložení a načtení konfigurací

## Top Bar

Horní lišta obsahuje:

1. **Výběr období** - Od-Do měsíců
2. **Metrika** - Revenue/Profit/Margin
3. **Granularita** - Měsíc/Čtvrtletí/Rok
4. **Normalizace** - Absolutní/Index100 (jen na /compare)
5. **Refresh** - Aktualizace dat

## Technické detaily

### Architektura

- **URL jako state** - Všechny důležité parametry v query stringu
- **Reaktivní aktualizace** - Změny se okamžitě projeví ve všech komponentách
- **Persistentní nastavení** - localStorage pro uživatelské preference
- **Klávesové zkratky** - Globální navigace bez reloadu stránky

### Výkon

- **Memoizace** - Všechny selektory jsou memoizované
- **Lazy loading** - Komponenty se načítají podle potřeby
- **Efektivní filtry** - Filtrování na úrovni dat, ne UI

### Formátování

- **České formáty** - Měny, procenta, čísla
- **Responzivní design** - Adaptivní layout pro různé velikosti
- **Accessibility** - Klávesové zkratky, screen reader podpora

