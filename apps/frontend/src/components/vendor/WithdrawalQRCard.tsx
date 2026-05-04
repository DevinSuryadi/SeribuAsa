import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download, QrCode, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatIDR, formatDate } from "@/lib/format";

interface WithdrawalQRCardProps {
  amount: number;
  reference: string;
  payload: string;
  expiresAt?: string;
  title?: string;
  subtitle?: string;
}

export default function WithdrawalQRCard({
  amount,
  reference,
  payload,
  expiresAt,
  title = "QR Pencairan Vendor",
  subtitle = "Tunjukkan QR ini ke admin untuk memproses pencairan dana.",
}: WithdrawalQRCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    toast.success("Payload QR pencairan disalin");
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById(`withdrawal-qr-${reference}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `withdrawal-${reference}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden">
      <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-4 text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <QrCode className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            {title}
          </span>
        </div>
        <p className="text-xs text-emerald-700/80">{subtitle}</p>
      </div>

      <div className="flex flex-col items-center px-5 py-6">
        <div className="mb-4 rounded-2xl border-4 border-emerald-600 bg-white p-3 shadow-lg">
          <QRCodeSVG
            id={`withdrawal-qr-${reference}`}
            value={payload}
            size={168}
            level="H"
            fgColor="#047857"
            bgColor="#ffffff"
          />
        </div>

        <div className="mb-1 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-600" />
          <span className="text-2xl font-extrabold text-emerald-700">{formatIDR(amount)}</span>
        </div>

        <p className="font-mono text-xs font-bold tracking-wide text-emerald-700">{reference}</p>
        {expiresAt ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Berlaku sampai {formatDate(expiresAt)}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 px-5 pb-5">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Tersalin" : "Salin Payload"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          onClick={handleDownload}
        >
          <Download className="h-3.5 w-3.5" />
          Simpan QR
        </Button>
      </div>
    </div>
  );
}
