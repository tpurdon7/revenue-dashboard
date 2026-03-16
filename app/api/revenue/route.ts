import { NextRequest, NextResponse } from 'next/server';
import { fetchClosedWonRevenue, fetchOpenDealsCurrentValue } from '@/lib/hubspot';

export const runtime = 'nodejs';

const DEFAULT_GOAL = 10_000_000;

function parseGoal(input: string | undefined): number {
  const parsed = Number.parseFloat(input ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GOAL;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const startDate = request.nextUrl.searchParams.get('startDate') ?? undefined;
    const endDate = request.nextUrl.searchParams.get('endDate') ?? undefined;

    const [closedWonData, openDealsData] = await Promise.all([
      fetchClosedWonRevenue({ startDate, endDate }),
      fetchOpenDealsCurrentValue({ startDate, endDate })
    ]);
    const goal = parseGoal(process.env.REVENUE_GOAL);
    const progress = clampProgress(closedWonData.totalRevenue / goal);
    const openProgress = clampProgress(openDealsData.openDealValue / goal);

    return NextResponse.json({
      ...closedWonData,
      ...openDealsData,
      goal,
      progress,
      openProgress
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';

    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}
