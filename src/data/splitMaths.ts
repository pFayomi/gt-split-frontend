const KOBO_PER_NAIRA = 100;

export type EqualSplit = {
  totalAmount: number;
  peopleCount: number;
  participantShare: number;
  hostShare: number;
  absorbedByHost: number;
};

function toKobo(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * KOBO_PER_NAIRA);
}

function fromKobo(kobo: number): number {
  return kobo / KOBO_PER_NAIRA;
}

/**
 * Splits an amount evenly across participants + the host, rounding every
 * person's share down to a whole naira and letting the host absorb the
 * leftover so the shares always add back up to the total exactly.
 *
 * All arithmetic runs in integer kobo to avoid floating point drift.
 */
export function computeEqualSplit(totalAmount: number, participantCount: number): EqualSplit {
  const totalKobo = Math.max(0, toKobo(totalAmount));
  const people = Math.max(0, Math.floor(participantCount));

  if (people === 0) {
    return {
      totalAmount: fromKobo(totalKobo),
      peopleCount: 1,
      participantShare: 0,
      hostShare: fromKobo(totalKobo),
      absorbedByHost: fromKobo(totalKobo),
    };
  }

  const peopleCount = people + 1;
  const evenKobo = Math.floor(totalKobo / peopleCount);
  const participantKobo = Math.floor(evenKobo / KOBO_PER_NAIRA) * KOBO_PER_NAIRA;
  const hostKobo = totalKobo - participantKobo * people;

  return {
    totalAmount: fromKobo(totalKobo),
    peopleCount,
    participantShare: fromKobo(participantKobo),
    hostShare: fromKobo(hostKobo),
    absorbedByHost: fromKobo(hostKobo - participantKobo),
  };
}