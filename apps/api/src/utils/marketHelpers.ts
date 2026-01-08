import type { Market, MarketStatus, Platform, MarketCategory } from '@eventhorizon/shared';

export function normalizeWalletAddress(address: string): string {
  return address.toLowerCase();
}

export function calculateKalshiPrice(priceInCents?: number): number {
  return (priceInCents || 50) / 100;
}

export function estimateDailyVolumeFromWeekly(weeklyVolume?: number): number {
  return weeklyVolume ? weeklyVolume / 7 : 0;
}

export function determinePolymarketStatus(
  completedTime: number | null | undefined,
  status?: string,
  closeTime?: number | null
): MarketStatus {
  if (completedTime !== null && completedTime !== undefined) {
    return 'resolved';
  }
  if (status === 'closed' || closeTime !== null) {
    return 'closed';
  }
  return 'active';
}

export function determineKalshiStatus(
  status?: string,
  result?: string | null
): MarketStatus {
  if (status === 'open') {
    return 'active';
  }
  if (result) {
    return 'resolved';
  }
  return 'closed';
}

export function determinePolymarketOutcome(
  winningSide: string | null | undefined,
  sideALabel?: string
): number | undefined {
  if (!winningSide || !sideALabel) {
    return undefined;
  }
  return winningSide === sideALabel ? 1 : 0;
}

export function determineKalshiOutcome(result?: string | null): number | undefined {
  if (result === 'yes') {
    return 1;
  }
  if (result === 'no') {
    return 0;
  }
  return undefined;
}

export function convertTimestampToMs(timestamp?: number): number | undefined {
  return timestamp ? timestamp * 1000 : undefined;
}