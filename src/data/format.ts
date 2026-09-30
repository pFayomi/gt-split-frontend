export function formatNaira(amount: number): string {
  const parts = amount.toFixed(2).split(".");
  const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `\u20A6${whole}.${parts[1]}`;
}