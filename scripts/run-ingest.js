#!/usr/bin/env node

import { ingestDirectory } from '../lib/ingest.js';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runIngest() {
  try {
    console.log('Spouštím build-time ingest...');
    
    // Cesta k data/dvur relativně k projektu
    const dataDir = join(__dirname, '..', 'data', 'dvur');
    
    // Spustí ingest
    const aggregatedData = await ingestDirectory(dataDir);
    
    // Uloží data
    const outputPath = join(__dirname, '..', 'public', 'data', 'processed.json');
    await writeFile(outputPath, JSON.stringify(aggregatedData, null, 2));
    
    console.log('Build-time ingest dokončen:');
    console.log(`- Měsíců: ${aggregatedData.monthsAvailable.length}`);
    console.log(`- Zákazníků: ${aggregatedData.customers.length}`);
    console.log(`- Vygenerováno: ${aggregatedData.generatedAt}`);
    
  } catch (error) {
    console.error('Chyba při build-time ingest:', error);
    process.exit(1);
  }
}

runIngest();
