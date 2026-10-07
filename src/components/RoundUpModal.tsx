import React from "react";
import { formatNaira } from "../data/format";
import SuccessSheet from "./SuccessSheet";

/**
 * Confirmation dialog for the round-up offer. Thin wrapper over the shared
 * success sheet so it matches every other dialog in the app.
 */
export default function RoundUpModal({
  visible,
  amount,
  onAccept,
  onDecline,
}: {
  visible: boolean;
  amount: number;
  onAccept: (roundedAmount: number) => void;
  onDecline: () => void;
}) {
  const roundedAmount = Math.ceil(amount / 100) * 100;
  const extra = roundedAmount - amount;

  if (extra <= 0) return null;

  return (
    <SuccessSheet
      visible={visible}
      onClose={onDecline}
      icon={{ name: "wallet-outline", tone: "accent" }}
      amount={roundedAmount}
      title="Round up to save?"
      body={`Round your ${formatNaira(amount)} payment up to ${formatNaira(
        roundedAmount
      )}. The extra ${formatNaira(extra)} goes into your Savings Box.`}
      secondary={{ label: `Pay ${formatNaira(amount)}`, onPress: onDecline }}
      primary={{ label: "Round up", onPress: () => onAccept(roundedAmount) }}
    />
  );
}
