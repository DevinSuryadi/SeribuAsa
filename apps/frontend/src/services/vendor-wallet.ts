import { apiFetch } from "./api";

export interface WalletBalance {
  balance: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  pending_withdrawals?: number;
  minimum_withdrawal_amount?: number;
}

export type WithdrawalMethod = "bank" | "qr";

export interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  withdrawal_method: WithdrawalMethod;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  transfer_reference?: string;
  qr_payload?: string;
  qr_expires_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface WithdrawalListResponse {
  items: Withdrawal[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// The API sends money as decimal strings ("151460.00"), which compare alphabetically.
const toMoney = (value?: number) => (value === undefined || value === null ? value : Number(value));

export async function getWalletBalance(): Promise<WalletBalance> {
  const data: WalletBalance = await apiFetch("/vendor-wallet/balance");
  return {
    ...data,
    balance: Number(data.balance),
    pending_withdrawals: toMoney(data.pending_withdrawals),
    minimum_withdrawal_amount: toMoney(data.minimum_withdrawal_amount),
  };
}

export async function requestWithdrawal(
  amount: number
): Promise<Withdrawal> {
  return apiFetch(`/vendor-wallet/withdraw?amount=${amount}`, {
    method: "POST",
  });
}

export async function requestQrWithdrawal(amount: number): Promise<Withdrawal> {
  return apiFetch("/vendor-wallet/withdraw/qr", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function redeemQrWithdrawal(qrPayload: string): Promise<Withdrawal> {
  return apiFetch("/vendor-wallet/withdraw/qr/redeem", {
    method: "POST",
    body: JSON.stringify({ qr_payload: qrPayload }),
  });
}

export async function getWithdrawalHistory(
  page: number = 1,
  pageSize: number = 20
): Promise<WithdrawalListResponse> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("page_size", pageSize.toString());
  const data: WithdrawalListResponse = await apiFetch(`/vendor-wallet/withdrawals?${params.toString()}`);
  return { ...data, items: (data.items || []).map((item) => ({ ...item, amount: Number(item.amount) })) };
}
