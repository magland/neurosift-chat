import { NextResponse } from 'next/server';
import { UsageService } from '../../../lib/usageService';

export async function GET() {
  try {
    const usageStatus = await UsageService.getAllUsageStatus();
    return NextResponse.json(usageStatus);
  } catch (error) {
    console.error('Error fetching usage status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage status' },
      { status: 500 }
    );
  }
}
