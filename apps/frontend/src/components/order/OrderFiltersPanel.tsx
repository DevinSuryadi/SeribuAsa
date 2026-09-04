import type { OrderStatus, OrderFilters } from "@/types/orders";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { useState } from "react";

interface OrderFiltersProps {
  onFiltersChange: (filters: OrderFilters) => void;
  isLoading: boolean;
}

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "processing", label: "Diproses" },
  { value: "shipped", label: "Dikirim" },
  { value: "delivered", label: "Terkirim" },
  { value: "cancelled", label: "Dibatalkan" },
];

/**
 * OrderFilters component
 * Filters for order history (status, date range)
 */
export function OrderFiltersPanel({ onFiltersChange, isLoading }: OrderFiltersProps) {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleFilterChange = () => {
    onFiltersChange({
      status: status || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: 1,
      page_size: 10,
    });
  };

  const handleReset = () => {
    setStatus("");
    setDateFrom("");
    setDateTo("");
    onFiltersChange({
      page: 1,
      page_size: 10,
    });
  };

  const hasActiveFilters = status || dateFrom || dateTo;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={18} className="text-gray-600" />
        <h3 className="font-bold text-gray-900">Filter Pesanan</h3>
      </div>

      {/* Status Filter */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "")}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Filter */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-2">
            Dari Tanggal
          </label>
          <input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
            Sampai Tanggal
          </label>
          <input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <Button onClick={handleFilterChange} disabled={isLoading} className="flex-1">
          Terapkan Filter
        </Button>
        {hasActiveFilters && (
          <Button onClick={handleReset} variant="outline" disabled={isLoading} className="flex-1">
            <X size={16} className="mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
