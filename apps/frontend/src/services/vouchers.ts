import { apiFetch } from "./api";

export async function getVoucherBalance(beneficiaryId: string) {
  return apiFetch(`/vouchers/balance/${beneficiaryId}`);
}

export async function getVoucherHistory(beneficiaryId: string) {
  return apiFetch(`/vouchers/history?beneficiary_id=${beneficiaryId}`);
}

export async function redeemVoucher(data: {
  voucher_codes: string[];
  amount: number;
  order_id: string;
}) {
  return apiFetch("/vouchers/redeem", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
