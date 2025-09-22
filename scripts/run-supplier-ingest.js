#!/usr/bin/env node

import { ingestSupplierDirectory } from '../lib/supplier-ingest.js';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runSupplierIngest() {
  try {
    console.log('Spouštím build-time ingest dodavatelů...');
    
    // Cesta k data/dodavatele relativně k projektu
    const dataDir = join(__dirname, '..', 'data', 'dodavatele');
    
    // Spustí ingest
    const supplierData = await ingestSupplierDirectory(dataDir);
    
    // Uloží data
    const outputPath = join(__dirname, '..', 'public', 'data', 'suppliers.json');
    await writeFile(outputPath, JSON.stringify(supplierData, null, 2));
    
    console.log('Build-time ingest dodavatelů dokončen:');
    console.log(`- Měsíců: ${supplierData.monthsAvailable.length}`);
    console.log(`- Dodavatelů: ${supplierData.suppliers.length}`);
    console.log(`- Vygenerováno: ${supplierData.generatedAt}`);
    console.log(`- Uloženo do: ${outputPath}`);
    
  } catch (error) {
    console.error('Chyba při build-time ingest dodavatelů:', error);
    process.exit(1);
  }
}

runSupplierIngest();
