/**
 * VoucherQRDisplay
 * Shows a real QR code for a voucher code, with a copy button and metadata.
 * Used by beneficiary in DompetNutrisi to show to vendor for scanning.
 */
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatIDR } from '@/lib/format';
import { toast } from 'sonner';

interface VoucherQRDisplayProps {
  code: string;
  balance: number;
  expiryDate?: string | null;
  compact?: boolean; // Smaller version for list view
}

const VoucherQRDisplay = ({ code, balance, expiryDate, compact = false }: VoucherQRDisplayProps) => {
  const [copied, setCopied] = useState(false);

  // QR payload: vendor scanner will read this and pre-fill the code field
  const qrPayload = `VOUCHER:${code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Kode voucher disalin!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${code}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = compact ? 120 : 200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `voucher-${code}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Small QR */}
        <div className="flex-shrink-0 rounded-lg border border-green-200 bg-white p-1.5 shadow-sm">
          <QRCodeSVG
            id={`qr-${code}`}
            value={qrPayload}
            size={56}
            level="M"
            fgColor="#15803d"
            bgColor="#ffffff"
          />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-mono text-xs font-bold text-green-700 truncate">{code}</span>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 text-green-500 hover:text-green-700 transition-colors"
              title="Salin kode"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <p className="text-sm font-bold text-green-600">{formatIDR(balance)}</p>
          {expiryDate && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              s/d {new Date(expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <Badge className="text-[9px] bg-green-200 text-green-800 border-0 flex-shrink-0">Aktif</Badge>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-green-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 text-center border-b border-green-100 bg-green-50">
        <div className="flex items-center justify-center gap-2 mb-1">
          <QrCode className="h-4 w-4 text-green-600" />
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Tunjukkan ke Vendor</span>
        </div>
        <p className="text-xs text-green-600">Vendor akan scan QR ini untuk memproses penukaran</p>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center py-6 px-5">
        <div className="rounded-2xl border-4 border-green-600 bg-white p-3 shadow-lg mb-4">
          <QRCodeSVG
            id={`qr-${code}`}
            value={qrPayload}
            size={160}
            level="H"
            fgColor="#15803d"
            bgColor="#ffffff"
            imageSettings={{
              src: '',
              height: 0,
              width: 0,
              excavate: false,
            }}
          />
        </div>

        {/* Code display */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-lg font-extrabold text-green-700 tracking-widest">{code}</span>
          <button
            onClick={handleCopy}
            className="text-green-500 hover:text-green-700 transition-colors"
            title="Salin kode"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <p className="text-2xl font-extrabold text-green-600 mb-1">{formatIDR(balance)}</p>

        {expiryDate && (
          <p className="text-xs text-muted-foreground">
            Berlaku hingga {new Date(expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Tersalin!' : 'Salin Kode'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
          onClick={handleDownload}
        >
          <Download className="h-3.5 w-3.5" /> Simpan QR
        </Button>
      </div>
    </div>
  );
};

export default VoucherQRDisplay;
