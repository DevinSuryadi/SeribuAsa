import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Home,
  ShoppingCart,
  Loader2,
  QrCode,
  Store,
  ReceiptText,
  Clock3,
  Info,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductAvatar } from "@/components/product/ProductAvatar";
import { getOrder } from "@/services/orders";
import { formatIDR } from "@/lib/format";
import type { OrderItem } from "@/types/orders";

type OrderRecord = Record<string, unknown>;
type OrderItemRecord = Partial<OrderItem> & Record<string, any>;

type CheckoutSuccessPayload = {
  orderIds?: string[];
  orderSummary?: unknown;
  cartItems?: unknown[];
  walletBalance?: number;
};

type VendorGroup = {
  vendorKey: string;
  vendorName: string;
  items: OrderItemRecord[];
  subtotal: number;
};

const ITEM_ARRAY_KEYS = [
  "items",
  "order_items",
  "orderItems",
  "cart_items",
  "cartItems",
  "products",
  "order_products",
  "orderProducts",
  "vendor_items",
  "vendorItems",
];

const ORDER_COLLECTION_KEYS = [
  "orders",
  "order_list",
  "orderList",
  "vendor_orders",
  "vendorOrders",
  "child_orders",
  "childOrders",
  "sub_orders",
  "subOrders",
  "vendor_groups",
  "vendorGroups",
  "order_groups",
  "orderGroups",
  "vendors",
  "stores",
  "merchant_orders",
  "merchantOrders",
  "transactions",
  "grouped_items",
  "groupedItems",
  "items_by_vendor",
  "itemsByVendor",
  "cart_by_vendor",
  "cartByVendor",
];

const WRAPPER_RECORD_KEYS = [
  "data",
  "result",
  "payload",
  "checkout",
  "checkout_order",
  "checkoutOrder",
  "order",
  "summary",
];

const TOTAL_KEYS = [
  "cart_total",
  "cartTotal",
  "original_total",
  "originalTotal",
  "subtotal",
  "sub_total",
  "subTotal",
  "total_before_discount",
  "totalBeforeDiscount",
  "gross_amount",
  "grossAmount",
  "total_amount",
  "totalAmount",
  "total_price",
  "totalPrice",
  "amount",
];

const VOUCHER_KEYS = [
  "voucher_discount",
  "voucherDiscount",
  "discount_amount",
  "discountAmount",
  "voucher_amount",
  "voucherAmount",
  "applied_amount",
  "appliedAmount",
];

const CASH_KEYS = [
  "cash_amount",
  "cashAmount",
  "cash_paid",
  "cashPaid",
  "paid_cash",
  "paidCash",
];

const WALLET_KEYS = [
  "wallet_amount",
  "walletAmount",
  "wallet_paid",
  "walletPaid",
  "dompet_amount",
  "dompetAmount",
  "nutrition_wallet_amount",
  "nutritionWalletAmount",
  "dompet_nutrisi_amount",
  "dompetNutrisiAmount",
];

const isRecord = (value: unknown): value is OrderRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const pickPositiveNumber = (...values: unknown[]): number => {
  for (const value of values) {
    const numberValue = toNumber(value);
    if (numberValue > 0) return numberValue;
  }

  return 0;
};

const toText = (value: unknown, fallback = ""): string => {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const getNestedRecord = (
  record: OrderRecord,
  key: string
): OrderRecord | undefined => {
  return isRecord(record[key]) ? (record[key] as OrderRecord) : undefined;
};

const safeParseStoredPayload = (
  orderId: string | undefined
): CheckoutSuccessPayload | null => {
  if (!orderId) return null;

  try {
    const raw = sessionStorage.getItem(`checkout_success_${orderId}`);
    if (!raw) return null;

    return JSON.parse(raw) as CheckoutSuccessPayload;
  } catch {
    return null;
  }
};

const getCheckoutOrderIds = (
  routeOrderId: string | undefined,
  search: string,
  state: unknown
): string[] => {
  const locationState = state as CheckoutSuccessPayload | null;

  const stateOrderIds = Array.isArray(locationState?.orderIds)
    ? locationState.orderIds
    : [];

  const params = new URLSearchParams(search);

  const queryOrderIds = params.get("orderIds")
    ? params
        .get("orderIds")!
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  const ids = [...stateOrderIds, ...queryOrderIds, routeOrderId].filter(
    (id): id is string => Boolean(id)
  );

  return Array.from(new Set(ids));
};

const getStatusConfig = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  const config: Record<
    string,
    {
      label: string;
      className: string;
      iconClassName: string;
    }
  > = {
    pending: {
      label: "Menunggu Pickup",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      iconClassName: "text-amber-600",
    },
    confirmed: {
      label: "Dikonfirmasi",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      iconClassName: "text-emerald-600",
    },
    processing: {
      label: "Diproses",
      className: "border-sky-200 bg-sky-50 text-sky-700",
      iconClassName: "text-sky-600",
    },
    shipped: {
      label: "Dikirim",
      className: "border-indigo-200 bg-indigo-50 text-indigo-700",
      iconClassName: "text-indigo-600",
    },
    delivered: {
      label: "Selesai",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      iconClassName: "text-emerald-600",
    },
    cancelled: {
      label: "Dibatalkan",
      className: "border-red-200 bg-red-50 text-red-700",
      iconClassName: "text-red-600",
    },
  };

  return (
    config[normalizedStatus] ?? {
      label: status || "Pending",
      className: "border-slate-200 bg-slate-50 text-slate-600",
      iconClassName: "text-slate-500",
    }
  );
};

const getVendorNameFromSource = (
  source: OrderRecord,
  fallbackVendorName: string
) => {
  const vendor = getNestedRecord(source, "vendor");
  const store = getNestedRecord(source, "store");
  const merchant = getNestedRecord(source, "merchant");
  const seller = getNestedRecord(source, "seller");

  return toText(
    source.vendor_store_name ??
      source.vendorStoreName ??
      source.store_name ??
      source.storeName ??
      source.vendor_name ??
      source.vendorName ??
      source.merchant_name ??
      source.merchantName ??
      source.seller_name ??
      source.sellerName ??
      source.name ??
      (typeof source.vendor === "string" ? source.vendor : undefined) ??
      (typeof source.store === "string" ? source.store : undefined) ??
      (typeof source.merchant === "string" ? source.merchant : undefined) ??
      (typeof source.seller === "string" ? source.seller : undefined) ??
      vendor?.store_name ??
      vendor?.storeName ??
      vendor?.name ??
      store?.store_name ??
      store?.storeName ??
      store?.name ??
      merchant?.store_name ??
      merchant?.storeName ??
      merchant?.name ??
      seller?.store_name ??
      seller?.storeName ??
      seller?.name,
    fallbackVendorName
  );
};

const getVendorIdFromSource = (source: OrderRecord) => {
  const vendor = getNestedRecord(source, "vendor");
  const store = getNestedRecord(source, "store");
  const merchant = getNestedRecord(source, "merchant");
  const seller = getNestedRecord(source, "seller");

  return (
    source.vendor_id ??
    source.vendorId ??
    source.store_id ??
    source.storeId ??
    source.merchant_id ??
    source.merchantId ??
    source.seller_id ??
    source.sellerId ??
    vendor?.id ??
    store?.id ??
    merchant?.id ??
    seller?.id
  );
};

const getProductName = (item: OrderItemRecord) => {
  const product = isRecord(item.product) ? item.product : undefined;

  return toText(
    item.product_name ??
      item.productName ??
      item.name ??
      item.title ??
      product?.product_name ??
      product?.productName ??
      product?.name ??
      product?.title,
    "Produk"
  );
};

const getProductId = (item: OrderItemRecord) => {
  const product = isRecord(item.product) ? item.product : undefined;

  return (
    item.product_id ??
    item.productId ??
    item.product_uuid ??
    item.productUuid ??
    product?.id ??
    product?.product_id ??
    product?.productId
  );
};

const getQuantity = (item: OrderItemRecord) => {
  const quantity = pickPositiveNumber(
    item.quantity,
    item.qty,
    item.amount,
    item.count
  );

  return quantity > 0 ? quantity : 1;
};

const getUnitPrice = (item: OrderItemRecord) => {
  const product = isRecord(item.product) ? item.product : undefined;

  return pickPositiveNumber(
    item.unit_price,
    item.unitPrice,
    item.price,
    item.product_price,
    item.productPrice,
    item.base_price,
    item.basePrice,
    product?.price,
    product?.product_price,
    product?.productPrice
  );
};

const getItemSubtotal = (item: OrderItemRecord) => {
  const explicitSubtotal = pickPositiveNumber(
    item.subtotal,
    item.total_price,
    item.totalPrice,
    item.total,
    item.line_total,
    item.lineTotal,
    item.price_total,
    item.priceTotal,
    item.amount_total,
    item.amountTotal
  );

  if (explicitSubtotal > 0) return explicitSubtotal;

  const unitPrice = getUnitPrice(item);
  const quantity = getQuantity(item);

  return unitPrice * quantity;
};

const normalizeItem = (
  value: unknown,
  source: OrderRecord,
  fallbackVendorName: string
): OrderItemRecord | null => {
  if (!isRecord(value)) return null;
  const itemValue = value as OrderItemRecord;

  const product = getNestedRecord(itemValue, "product");
  const itemVendor = getNestedRecord(itemValue, "vendor");
  const itemStore = getNestedRecord(itemValue, "store");
  const itemMerchant = getNestedRecord(itemValue, "merchant");
  const sourceVendor = getNestedRecord(source, "vendor");

  const vendorName = toText(
    itemValue.vendor_store_name ??
      itemValue.vendorStoreName ??
      itemValue.store_name ??
      itemValue.storeName ??
      itemValue.vendor_name ??
      itemValue.vendorName ??
      itemValue.merchant_name ??
      itemValue.merchantName ??
      itemVendor?.store_name ??
      itemVendor?.storeName ??
      itemVendor?.name ??
      itemStore?.store_name ??
      itemStore?.storeName ??
      itemStore?.name ??
      itemMerchant?.store_name ??
      itemMerchant?.storeName ??
      itemMerchant?.name ??
      source.vendor_store_name ??
      source.vendorStoreName ??
      source.store_name ??
      source.storeName ??
      source.vendor_name ??
      source.vendorName ??
      source.merchant_name ??
      source.merchantName ??
      source.name ??
      (typeof source.vendor === "string" ? source.vendor : undefined) ??
      (typeof source.store === "string" ? source.store : undefined) ??
      (typeof source.merchant === "string" ? source.merchant : undefined) ??
      (typeof source.seller === "string" ? source.seller : undefined) ??
      sourceVendor?.store_name ??
      sourceVendor?.storeName ??
      sourceVendor?.name,
    getVendorNameFromSource(source, fallbackVendorName)
  );

  return {
    ...itemValue,
    product_name:
      itemValue.product_name ??
      itemValue.productName ??
      itemValue.name ??
      itemValue.title ??
      product?.product_name ??
      product?.productName ??
      product?.name ??
      product?.title,
    product_images:
      itemValue.product_images ??
      itemValue.productImages ??
      itemValue.images ??
      itemValue.image ??
      product?.product_images ??
      product?.productImages ??
      product?.images ??
      product?.image,
    category_name:
      itemValue.category_name ??
      itemValue.categoryName ??
      product?.category_name ??
      product?.categoryName ??
      product?.category,
    quantity:
      itemValue.quantity ?? itemValue.qty ?? itemValue.amount ?? itemValue.count ?? 1,
    subtotal:
      itemValue.subtotal ??
      itemValue.total_price ??
      itemValue.totalPrice ??
      itemValue.total ??
      itemValue.line_total ??
      itemValue.lineTotal ??
      itemValue.price_total ??
      itemValue.priceTotal,
    vendor_id:
      itemValue.vendor_id ?? itemValue.vendorId ?? getVendorIdFromSource(source),
    vendor_store_name: vendorName,
    vendor: itemValue.vendor ?? source.vendor,
    store: itemValue.store ?? source.store,
    merchant: itemValue.merchant ?? source.merchant,
  };
};

const isLikelyItemRecord = (value: OrderRecord) => {
  return Boolean(
    value.product_name ??
      value.productName ??
      value.product_id ??
      value.productId ??
      value.product ??
      value.quantity ??
      value.qty
  );
};

const collectItemsFromArray = (
  value: unknown,
  source: OrderRecord,
  fallbackVendorName: string
): OrderItemRecord[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => normalizeItem(item, source, fallbackVendorName))
    .filter((item): item is OrderItemRecord => Boolean(item));
};

const collectItemsFromContainer = (
  container: OrderRecord,
  source: OrderRecord,
  fallbackVendorName: string
): OrderItemRecord[] => {
  return ITEM_ARRAY_KEYS.flatMap((key) =>
    collectItemsFromArray(container[key], source, fallbackVendorName)
  );
};

const getVendorNameFromItem = (
  item: OrderItemRecord,
  fallbackVendorName: string
) => {
  const vendor = isRecord(item.vendor) ? item.vendor : undefined;
  const store = isRecord(item.store) ? item.store : undefined;
  const merchant = isRecord(item.merchant) ? item.merchant : undefined;

  return toText(
    item.vendor_store_name ??
      item.vendorStoreName ??
      item.store_name ??
      item.storeName ??
      item.vendor_name ??
      item.vendorName ??
      item.merchant_name ??
      item.merchantName ??
      (typeof item.vendor === "string" ? item.vendor : undefined) ??
      (typeof item.store === "string" ? item.store : undefined) ??
      (typeof item.merchant === "string" ? item.merchant : undefined) ??
      vendor?.store_name ??
      vendor?.storeName ??
      vendor?.name ??
      store?.store_name ??
      store?.storeName ??
      store?.name ??
      merchant?.store_name ??
      merchant?.storeName ??
      merchant?.name,
    fallbackVendorName
  );
};

const getVendorKeyFromItem = (
  item: OrderItemRecord,
  fallbackVendorName: string
) => {
  const vendor = isRecord(item.vendor) ? item.vendor : undefined;
  const store = isRecord(item.store) ? item.store : undefined;
  const merchant = isRecord(item.merchant) ? item.merchant : undefined;

  return String(
    item.vendor_id ??
      item.vendorId ??
      item.store_id ??
      item.storeId ??
      item.vendor_store_id ??
      item.vendorStoreId ??
      item.merchant_id ??
      item.merchantId ??
      vendor?.id ??
      store?.id ??
      merchant?.id ??
      getVendorNameFromItem(item, fallbackVendorName)
  );
};

const dedupeItems = (items: OrderItemRecord[]) => {
  const seen = new Set<string>();
  const uniqueItems: OrderItemRecord[] = [];

  items.forEach((item) => {
    const vendorKey = getVendorKeyFromItem(item, "Vendor");

    const itemId =
      item.id ??
      item.order_item_id ??
      item.orderItemId ??
      item.order_item_uuid ??
      item.orderItemUuid ??
      item.uuid;

    const productKey = getProductId(item) ?? getProductName(item);
    const quantity = getQuantity(item);
    const subtotal = getItemSubtotal(item);

    const key = itemId
      ? `id:${vendorKey}:${String(itemId)}`
      : `fallback:${vendorKey}:${String(productKey)}:${quantity}:${subtotal}`;

    if (seen.has(key)) return;

    seen.add(key);
    uniqueItems.push(item);
  });

  return uniqueItems;
};

const extractOrderItemsFromPayload = (
  payload: unknown,
  source?: OrderRecord,
  depth = 0
): OrderItemRecord[] => {
  if (depth > 7) return [];

  const currentSource = source ?? (isRecord(payload) ? payload : {});
  const fallbackVendorName = getVendorNameFromSource(currentSource, "Vendor");

  if (Array.isArray(payload)) {
    const items = payload.flatMap((entry) => {
      if (!isRecord(entry)) return [];

      if (isLikelyItemRecord(entry)) {
        const item = normalizeItem(entry, currentSource, fallbackVendorName);
        return item ? [item] : [];
      }

      return extractOrderItemsFromPayload(entry, entry, depth + 1);
    });

    return dedupeItems(items);
  }

  if (!isRecord(payload)) return [];

  const directItems = collectItemsFromContainer(
    payload,
    payload,
    fallbackVendorName
  );

  const collectionItems = ORDER_COLLECTION_KEYS.flatMap((key) => {
    const value = payload[key];

    if (Array.isArray(value)) {
      return value.flatMap((entry) => {
        if (!isRecord(entry)) return [];

        if (isLikelyItemRecord(entry)) {
          const item = normalizeItem(entry, payload, fallbackVendorName);
          return item ? [item] : [];
        }

        return extractOrderItemsFromPayload(entry, entry, depth + 1);
      });
    }

    if (isRecord(value)) {
      return extractOrderItemsFromPayload(value, value, depth + 1);
    }

    return [];
  });

  const wrapperItems = WRAPPER_RECORD_KEYS.flatMap((key) => {
    const value = payload[key];

    if (!isRecord(value) && !Array.isArray(value)) return [];

    return extractOrderItemsFromPayload(
      value,
      isRecord(value) ? value : payload,
      depth + 1
    );
  });

  const looseNestedItems =
    depth <= 2
      ? Object.entries(payload).flatMap(([key, value]) => {
          if (
            ITEM_ARRAY_KEYS.includes(key) ||
            ORDER_COLLECTION_KEYS.includes(key) ||
            WRAPPER_RECORD_KEYS.includes(key)
          ) {
            return [];
          }

          if (Array.isArray(value)) {
            return extractOrderItemsFromPayload(value, payload, depth + 1);
          }

          if (isRecord(value)) {
            return extractOrderItemsFromPayload(value, value, depth + 1);
          }

          return [];
        })
      : [];

  return dedupeItems([
    ...directItems,
    ...collectionItems,
    ...wrapperItems,
    ...looseNestedItems,
  ]);
};

const groupItemsByVendor = (
  items: OrderItemRecord[],
  fallbackVendorName: string
): VendorGroup[] => {
  const groups = new Map<string, VendorGroup>();

  items.forEach((item) => {
    const vendorName = getVendorNameFromItem(item, fallbackVendorName);
    const vendorKey = getVendorKeyFromItem(item, vendorName);
    const subtotal = getItemSubtotal(item);

    if (!groups.has(vendorKey)) {
      groups.set(vendorKey, {
        vendorKey,
        vendorName,
        items: [],
        subtotal: 0,
      });
    }

    const group = groups.get(vendorKey);
    if (!group) return;

    group.items.push(item);
    group.subtotal += subtotal;
  });

  return Array.from(groups.values());
};

const getPrimaryRecord = (payload: unknown): OrderRecord => {
  if (Array.isArray(payload)) {
    return payload.length > 0 && isRecord(payload[0]) ? payload[0] : {};
  }

  if (!isRecord(payload)) return {};

  for (const key of WRAPPER_RECORD_KEYS) {
    const nested = payload[key];
    if (isRecord(nested)) return nested;
  }

  return payload;
};

const getDeepPositiveNumber = (
  payload: unknown,
  keys: string[],
  depth = 0
): number => {
  if (depth > 4) return 0;

  if (Array.isArray(payload)) {
    return payload.reduce(
      (total, entry) => total + getDeepPositiveNumber(entry, keys, depth + 1),
      0
    );
  }

  if (!isRecord(payload)) return 0;

  for (const key of keys) {
    const value = pickPositiveNumber(payload[key]);
    if (value > 0) return value;
  }

  for (const key of [
    "data",
    "result",
    "payload",
    "checkout",
    "summary",
    "payment",
    "applied_voucher",
    "appliedVoucher",
  ]) {
    const nested = payload[key];

    if (isRecord(nested)) {
      const value = getDeepPositiveNumber(nested, keys, depth + 1);
      if (value > 0) return value;
    }
  }

  return 0;
};

export function CheckoutSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const statePayload = location.state as CheckoutSuccessPayload | null;

  const storedPayload = useMemo(() => safeParseStoredPayload(orderId), [orderId]);

  const checkoutSnapshot = useMemo(() => {
    if (statePayload?.orderSummary || statePayload?.cartItems) return statePayload;
    if (storedPayload?.orderSummary || storedPayload?.cartItems) return storedPayload;
    return null;
  }, [statePayload, storedPayload]);

  const snapshotPayload = useMemo(() => {
    if (!checkoutSnapshot) return null;

    const payloads: unknown[] = [];

    if (checkoutSnapshot.orderSummary) {
      payloads.push(checkoutSnapshot.orderSummary);
    }

    if (checkoutSnapshot.cartItems && checkoutSnapshot.cartItems.length > 0) {
      payloads.push({
        items: checkoutSnapshot.cartItems,
      });
    }

    if (payloads.length === 0) return null;
    if (payloads.length === 1) return payloads[0];

    return payloads;
  }, [checkoutSnapshot]);

  const orderIds = useMemo(
    () => getCheckoutOrderIds(orderId, location.search, location.state),
    [orderId, location.search, location.state]
  );

  const [orderPayload, setOrderPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(!snapshotPayload);
  const [error, setError] = useState<string | null>(null);
  const [expandedVendors, setExpandedVendors] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    const loadOrders = async () => {
      if (snapshotPayload) {
        setLoading(false);
        return;
      }

      try {
        if (orderIds.length === 0) {
          setLoading(false);
          return;
        }

        const responses = await Promise.all(orderIds.map((id) => getOrder(id)));
        setOrderPayload(responses.length === 1 ? responses[0] : responses);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail pesanan");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [snapshotPayload, orderIds.join(",")]);

  const displayPayload = snapshotPayload ?? orderPayload;
  const primaryRecord = getPrimaryRecord(displayPayload);

  const orderItems = useMemo(
    () => extractOrderItemsFromPayload(displayPayload),
    [displayPayload]
  );

  const fallbackVendorName = getVendorNameFromSource(primaryRecord, "Vendor");

  const status = toText(
    primaryRecord.status ??
      primaryRecord.order_status ??
      primaryRecord.orderStatus ??
      primaryRecord.pickup_status ??
      primaryRecord.pickupStatus,
    "pending"
  );

  const statusConfig = getStatusConfig(status);

  const vendorGroups = useMemo(
    () => groupItemsByVendor(orderItems, fallbackVendorName),
    [orderItems, fallbackVendorName]
  );

  const subtotalFromItems = vendorGroups.reduce(
    (total, group) => total + group.subtotal,
    0
  );

  const totalAmountFromPayload = getDeepPositiveNumber(displayPayload, TOTAL_KEYS);
  const voucherUsed = getDeepPositiveNumber(displayPayload, VOUCHER_KEYS);
  const cashPaid = getDeepPositiveNumber(displayPayload, CASH_KEYS);
  const explicitWalletPaid = getDeepPositiveNumber(displayPayload, WALLET_KEYS);

  const totalAmount =
    subtotalFromItems > 0 ? subtotalFromItems : totalAmountFromPayload;

  const walletPaid =
    explicitWalletPaid > 0
      ? explicitWalletPaid
      : Math.max(0, totalAmount - voucherUsed - cashPaid);

  const totalItemCount = orderItems.reduce(
    (total, item) => total + getQuantity(item),
    0
  );

  const toggleVendor = (vendorKey: string) => {
    setExpandedVendors((current) => ({
      ...current,
      [vendorKey]: !(current[vendorKey] ?? true),
    }));
  };

  if (loading) {
    return (
      <DashboardLayout title="Pesanan Berhasil" subtitle="">
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
          <Loader2
            className="h-7 w-7 animate-spin text-emerald-600"
            aria-label="Memuat..."
          />
          <p className="text-sm font-medium text-slate-500">
            Memuat detail pesanan...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Pesanan Berhasil"
      subtitle="Pesanan Anda telah berhasil dibuat dan siap untuk pickup."
    >
      <div className="mx-auto w-full max-w-[1680px] space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <main className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
              <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_280px] md:items-center lg:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                    <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-bold tracking-tight text-slate-950">
                      Pesanan berhasil dibuat
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">
                      Kami telah mencatat pesanan Anda dan menunggu pickup di vendor.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
              <div className="px-5 py-5 lg:px-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                    <ReceiptText className="h-4 w-4" aria-hidden="true" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold tracking-tight text-slate-950">
                      Ringkasan Pesanan
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {vendorGroups.length} vendor • {totalItemCount} item
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 px-5 pb-5 lg:px-6 lg:pb-6">
                {vendorGroups.length > 0 ? (
                  vendorGroups.map((group) => {
                    const isExpanded = expandedVendors[group.vendorKey] ?? true;

                    const groupItemCount = group.items.reduce(
                      (total, item) => total + getQuantity(item),
                      0
                    );

                    return (
                      <div
                        key={group.vendorKey}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => toggleVendor(group.vendorKey)}
                          className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-slate-50/70 px-4 py-3 text-left transition hover:bg-slate-100/60 md:grid-cols-[minmax(0,1fr)_96px_96px_128px_24px] ${
                            isExpanded ? "border-b border-slate-200" : ""
                          }`}
                          aria-expanded={isExpanded}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Store
                              className="h-4 w-4 shrink-0 text-slate-500"
                              aria-hidden="true"
                            />
                            <p className="truncate text-sm font-bold text-slate-950">
                              {group.vendorName}
                            </p>
                          </div>

                          <p className="hidden text-sm font-medium text-slate-500 md:block">
                            {groupItemCount} item
                          </p>

                          <p className="hidden text-sm font-medium text-slate-500 md:block">
                            Subtotal
                          </p>

                          <p className="text-right text-sm font-bold text-slate-950">
                            {formatIDR(group.subtotal)}
                          </p>

                          {isExpanded ? (
                            <ChevronUp
                              className="hidden h-4 w-4 justify-self-end text-slate-500 md:block"
                              aria-hidden="true"
                            />
                          ) : (
                            <ChevronDown
                              className="hidden h-4 w-4 justify-self-end text-slate-500 md:block"
                              aria-hidden="true"
                            />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="divide-y divide-slate-100">
                            {group.items.map((item, index) => (
                              <div
                                key={`${group.vendorKey}-${index}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 transition hover:bg-slate-50/60"
                              >
                                <div className="flex min-w-0 items-center gap-4">
                                  <ProductAvatar
                                    images={item.product_images as any}
                                    categoryName={toText(item.category_name)}
                                    name={getProductName(item)}
                                    className="h-11 w-11 rounded-lg border border-slate-100 bg-slate-50"
                                  />

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-950">
                                      {getProductName(item)}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                      Qty {getQuantity(item)}
                                    </p>
                                  </div>
                                </div>

                                <p className="shrink-0 text-right text-sm font-bold text-slate-950">
                                  {formatIDR(getItemSubtotal(item))}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      Detail item tidak tersedia.
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-600">Total Belanja</span>
                      <span className="font-bold text-slate-950">
                        {formatIDR(totalAmount)}
                      </span>
                    </div>

                    {voucherUsed > 0 && (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-600">Diskon Voucher</span>
                        <span className="font-bold text-emerald-700">
                          - {formatIDR(voucherUsed)}
                        </span>
                      </div>
                    )}

                    {cashPaid > 0 && (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-600">Bayar Tunai</span>
                        <span className="font-bold text-slate-950">
                          {formatIDR(cashPaid)}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-slate-700">
                          Dibayar via Dompet (Dompet Nutrisi)
                        </span>
                        <span className="text-lg font-bold tracking-tight text-slate-950">
                          {formatIDR(walletPaid)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_4px_rgba(15,23,42,0.04)] lg:p-6">
              <h3 className="text-base font-bold tracking-tight text-slate-950">
                Status & Aksi
              </h3>

              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-slate-500">
                  Status Pesanan
                </p>

                <Badge
                  variant="outline"
                  className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${statusConfig.className}`}
                >
                  <Clock3
                    className={`mr-1.5 h-4 w-4 ${statusConfig.iconClassName}`}
                  />
                  {statusConfig.label}
                </Badge>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  className="h-14 w-full rounded-lg bg-emerald-700 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800"
                  onClick={() => navigate("/dashboard/dompet-nutrisi?tab=pesanan")}
                >
                  <QrCode className="mr-2.5 h-5 w-5" aria-hidden="true" />
                  Lihat QR Pickup
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-14 rounded-lg border-slate-200 bg-white text-sm font-bold text-slate-900 hover:bg-slate-50"
                    onClick={() => navigate("/dashboard/katalog")}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
                    Belanja Lagi
                  </Button>

                  <Button
                    variant="outline"
                    className="h-14 rounded-lg border-slate-200 bg-white text-sm font-bold text-slate-900 hover:bg-slate-50"
                    asChild
                  >
                    <Link to="/dashboard/beneficiary">
                      <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                      Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
              <div className="px-5 py-5 lg:px-6">
                <h3 className="text-base font-bold tracking-tight text-slate-950">
                  Langkah Selanjutnya
                </h3>
              </div>

              <div className="space-y-5 px-5 pb-6 lg:px-6">
                {[
                  {
                    title: "Buka QR Pickup",
                    description: "QR tersedia di halaman pesanan Anda.",
                  },
                  {
                    title: "Datang ke vendor",
                    description: "Tunjukkan QR kepada vendor saat pengambilan.",
                  },
                  {
                    title: "Pesanan diserahkan",
                    description:
                      "Vendor akan memindai QR untuk menyelesaikan transaksi.",
                  },
                ].map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700">
                      {index + 1}
                    </div>

                    <div className="pt-0.5">
                      <p className="text-sm font-bold text-slate-950">
                        {step.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 lg:px-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Info className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  <span>
                    Butuh bantuan? Hubungi{" "}
                    <span className="font-bold text-emerald-700">
                      Pusat Bantuan
                    </span>
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CheckoutSuccess;