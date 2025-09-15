import { readFile, writeFile, mkdir } from 'fs/promises';
import { AggregatedData } from './types';
import { PROCESSED_DATA_PATH } from './config';

// Čtení zpracovaných dat z JSON souboru
export async function readProcessed(): Promise<AggregatedData | null> {
  try {
    const data = await readFile(PROCESSED_DATA_PATH, 'utf-8');
    return JSON.parse(data) as AggregatedData;
  } catch (error) {
    console.warn(`Nelze načíst zpracovaná data z ${PROCESSED_DATA_PATH}:`, error);
    return null;
  }
}

// Zápis zpracovaných dat do JSON souboru
export async function writeProcessed(data: AggregatedData): Promise<void> {
  try {
    // Zajistí, že adresář existuje
    const dir = PROCESSED_DATA_PATH.split('/').slice(0, -1).join('/');
    await mkdir(dir, { recursive: true });
    
    // Zápis dat
    await writeFile(PROCESSED_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Data uložena do ${PROCESSED_DATA_PATH}`);
  } catch (error) {
    console.error(`Chyba při ukládání dat do ${PROCESSED_DATA_PATH}:`, error);
    throw error;
  }
}
