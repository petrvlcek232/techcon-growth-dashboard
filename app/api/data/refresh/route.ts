import { NextRequest, NextResponse } from 'next/server';
import { ingestDirectory } from '@/lib/ingest';
import { writeProcessed } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    console.log('Spouštím refresh dat...');
    
    // Spustí ingest
    const aggregatedData = await ingestDirectory();
    
    // Uloží data
    await writeProcessed(aggregatedData);
    
    const stats = {
      months: aggregatedData.monthsAvailable.length,
      customers: aggregatedData.customers.length,
      generatedAt: aggregatedData.generatedAt,
    };
    
    console.log('Refresh dokončen:', stats);
    
    return NextResponse.json({
      ok: true,
      stats,
    });
    
  } catch (error) {
    console.error('Chyba při refresh dat:', error);
    
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Neznámá chyba',
      },
      { status: 500 }
    );
  }
}
