import { Contact, Transaction } from "./types";

export const CURRENT_USER = {
  id: "user-eo",
  name: "Erioluwa",
  fullName: "Erioluwa Olateju",
  initials: "EO",
  accountNumber: "3005335181",
  accountLabel: "From GTCreaB eSavers",
  balance: 182450.75,
};

export const CONTACTS: Contact[] = [
  { id: "c-be", name: "Bibian", initials: "BE", phone: "+234 903 322 1999", isGTUser: true },
  { id: "c-ce", name: "Chidi", initials: "CE", phone: "+234 903 322 1999", isGTUser: true },
  { id: "c-of", name: "Oluwapelumi", initials: "OF", phone: "+234 903 322 1999", isGTUser: true },
  { id: "c-sarah", name: "Sarah", initials: "SA", phone: "+234 810 244 7712", isGTUser: false },
  { id: "c-tobi", name: "Tobi", initials: "TB", phone: "+234 802 991 4420", isGTUser: false },
];

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    kind: "transfer",
    title: "0000132608261746570004845...",
    subtitle: "Transfer",
    amount: 24500,
    direction: "out",
    date: "Yesterday",
    meta: {
      senderName: "Olateju, Erioluwa",
      beneficiaryName: "Ireoluwa Adeoluwa",
      receiverBank: "GUARANTY TRUST BANK",
      receiverAccount: "3007218717",
      transactionType: "INWARD TRANSFER",
      remark: "0000132608261746570004845 Inward Transfer to GUARANTY TRUST Bank - Ireoluwa Adeoluwa Peace",
    },
  },
  { id: "t2", kind: "charge", title: "Stamp Duty Charge", subtitle: "Charges", amount: 50, direction: "out", date: "September 6, 2026" },
  { id: "t3", kind: "airtime", title: "Via Airtime Via", subtitle: "Airtime", amount: 1000, direction: "out", date: "September 6, 2026" },
  { id: "t4", kind: "airtime", title: "Via Airtime Via", subtitle: "Airtime", amount: 500, direction: "out", date: "September 6, 2026" },
  { id: "t5", kind: "charge", title: "Vatcharges", subtitle: "Charges", amount: 7.5, direction: "out", date: "September 5, 2026" },
  { id: "t6", kind: "charge", title: "Commission On Nip", subtitle: "Charges", amount: 26.88, direction: "out", date: "September 5, 2026" },
  { id: "t7", kind: "transfer", title: "0001326090520221340000737...", subtitle: "Transfer", amount: 15000, direction: "out", date: "September 5, 2026" },
];