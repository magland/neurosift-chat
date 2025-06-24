import { NextResponse } from 'next/server';
import { UsageService } from '../../../lib/usageService';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const usageStatus = await UsageService.getAllUsageStatus();

    // Create response with no-cache headers to prevent Vercel caching
    const response = NextResponse.json(usageStatus);

    // Set cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Error fetching usage status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage status' },
      { status: 500 }
    );
  }
}
