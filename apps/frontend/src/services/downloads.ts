import { apiFetch } from "./api";

/**
 * Download receipt for a donation as PDF
 * @param donationId - The donation ID
 * @returns Blob of the PDF file
 */
export async function downloadDonationReceipt(donationId: string): Promise<Blob> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/donations/${donationId}/receipt`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Gagal mengunduh kwitansi");
  }

  return response.blob();
}

/**
 * Export donation history as CSV or PDF
 * @param format - 'csv' or 'pdf'
 * @param filters - Optional filters (date range, status)
 * @returns Blob of the exported file
 */
export async function exportDonationHistory(
  format: "csv" | "pdf" = "csv",
  filters?: {
    date_from?: string;
    date_to?: string;
    status?: string;
  }
): Promise<Blob> {
  const params = new URLSearchParams();
  params.append("format", format);

  if (filters?.date_from) params.append("date_from", filters.date_from);
  if (filters?.date_to) params.append("date_to", filters.date_to);
  if (filters?.status) params.append("status", filters.status);

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/donations/export?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Gagal mengekspor riwayat");
  }

  return response.blob();
}

/**
 * Trigger file download from blob
 * @param blob - The file blob
 * @param filename - The filename for download
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
