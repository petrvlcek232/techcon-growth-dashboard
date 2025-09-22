#!/usr/bin/env python3
"""
Skript pro analýzu dat dodavatelů z Excel souborů
"""

import pandas as pd
import os
import json
from pathlib import Path

def analyze_supplier_files():
    """Analyzuje strukturu Excel souborů s daty dodavatelů"""
    
    data_dir = Path("/Users/petrvlcek/Documents/denni objednávky/Data/Dodavatele")
    
    if not data_dir.exists():
        print(f"Adresář {data_dir} neexistuje")
        return
    
    # Najdi všechny Excel soubory
    excel_files = list(data_dir.glob("*.xls"))
    excel_files.sort()
    
    print(f"Nalezeno {len(excel_files)} Excel souborů")
    
    # Analyzuj první soubor pro strukturu
    if excel_files:
        first_file = excel_files[0]
        print(f"\nAnalyzuji strukturu souboru: {first_file.name}")
        
        try:
            # Načti Excel soubor
            df = pd.read_excel(first_file)
            
            print(f"Počet řádků: {len(df)}")
            print(f"Sloupce: {list(df.columns)}")
            print("\nPrvních 5 řádků:")
            print(df.head())
            
            # Zkus najít sloupce s dodavateli, obratem a položkami
            print("\nHledám relevantní sloupce...")
            
            # Možné názvy sloupců
            supplier_cols = [col for col in df.columns if any(word in str(col).lower() for word in ['dodavatel', 'supplier', 'firma', 'název'])]
            turnover_cols = [col for col in df.columns if any(word in str(col).lower() for word in ['obrat', 'turnover', 'tržby', 'revenue', 'částka'])]
            items_cols = [col for col in df.columns if any(word in str(col).lower() for word in ['položky', 'items', 'ks', 'počet'])]
            
            print(f"Možné sloupce dodavatelů: {supplier_cols}")
            print(f"Možné sloupce obratu: {turnover_cols}")
            print(f"Možné sloupce položek: {items_cols}")
            
            # Zkus najít data v různých sloupcích
            for col in df.columns:
                print(f"\nSloupec '{col}':")
                print(f"  Typ: {df[col].dtype}")
                print(f"  Prvních 3 hodnoty: {df[col].head(3).tolist()}")
                
        except Exception as e:
            print(f"Chyba při čtení souboru {first_file}: {e}")
    
    # Analyzuj několik souborů pro časové rozmezí
    print(f"\nAnalyzuji časové rozmezí...")
    months = []
    
    for file in excel_files[:5]:  # Analyzuj prvních 5 souborů
        try:
            # Extrahuj měsíc a rok z názvu souboru
            filename = file.stem  # bez přípony
            if '_' in filename:
                month_str, year_str = filename.split('_')
                months.append(f"{month_str}_{year_str}")
        except:
            pass
    
    print(f"Nalezené měsíce: {months}")

if __name__ == "__main__":
    analyze_supplier_files()
