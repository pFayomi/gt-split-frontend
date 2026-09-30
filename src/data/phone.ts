export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("234") ? digits : digits.replace(/^0/, "234");
}