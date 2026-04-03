import { apiFetch } from "./api";

export async function getVoucherBalance(beneficiaryId: string) {
  return apiFetch(`/vouchers/balance/${beneficiaryId}`);
}

export async function getVoucherHistory(beneficiaryId: string) {
  return apiFetch(`/vouchers/history?beneficiary_id=${beneficiaryId}`);
}
