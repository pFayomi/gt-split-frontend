export type ParticipantStatus = "paid" | "pending" | "declined";

export type Participant = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  isGTUser: boolean;
  share: number;
  status: ParticipantStatus;
};

export type SplitType = "equal" | "custom";

export type Split = {
  id: string;
  title: string;
  totalAmount: number;
  createdAt: string;
  hostId: string;
  splitType: SplitType;
  sourceAccountLabel: string;
  participants: Participant[];
  status: "active" | "settled" | "cancelled";
};

export type Contact = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  isGTUser: boolean;
};

export type TransactionKind = "transfer" | "charge" | "airtime" | "billsplit";

/** A GT World account holder the signed-in user can send money to. */
export type Beneficiary = {
  id: string;
  accountNumber: string;
  fullName: string;
  phone?: string | null;
};

export type Transaction = {
  id: string;
  kind: TransactionKind;
  title: string;
  subtitle: string;
  amount: number;
  direction: "in" | "out";
  date: string;
  splitId?: string;
  /** Free-text note the sender typed on the transfer, shown in the details screen. */
  narration?: string | null;
  sessionId?: string;
  meta?: {
    senderName?: string;
    beneficiaryName?: string;
    receiverBank?: string;
    receiverAccount?: string;
    transactionType?: string;
    remark?: string;
  };
};