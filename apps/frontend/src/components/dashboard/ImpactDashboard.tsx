import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, HeartHandshake, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";
import { useImpactDashboard } from "@/services/impact-dashboard";

const money = (value: number | string) => formatIDR(Number(value));

export default function ImpactDashboard({
  compact = false,
  admin = false,
}: {
  compact?: boolean;
  admin?: boolean;
}) {
  const [range, setRange] = useState({ start: "", end: "" });
  const [draft, setDraft] = useState(range);
  const invalid = !!draft.start && !!draft.end && draft.start > draft.end;
  const { data, error, isLoading, isValidating, mutate } = useImpactDashboard(
    range.start,
    range.end
  );
  const summary = data?.summary;
  const cards = summary
    ? [
        ["Donasi berhasil", money(summary.received), `${summary.donations} transaksi berhasil`],
        [
          "Diserahkan ke keluarga",
          money(summary.distributed),
          "Nilai barang sesuai porsi pendanaan",
        ],
        [
          "Keluarga terjangkau",
          summary.families.toLocaleString("id-ID"),
          "Keluarga unik dengan penyerahan tercatat",
        ],
        [
          "Faskes menyalurkan",
          summary.facilities.toLocaleString("id-ID"),
          `${summary.distributions} penyerahan tercatat`,
        ],
      ]
    : [];

  return (
    <section className="space-y-5" aria-label="Dashboard dampak">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <HeartHandshake className="h-8 w-8 text-emerald-700" />
          <div>
            <h2 className="text-lg font-bold text-emerald-950">
              {admin ? "Dampak bersama SeribuAsa" : "Jejak kebaikan Anda"}
            </h2>
            <p className="text-sm text-emerald-800">
              {compact
                ? "Seluruh periode"
                : "Dari donasi berhasil hingga bantuan diterima keluarga."}
            </p>
          </div>
        </div>
        {compact ? (
          <Link
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 underline"
            to={admin ? "/dashboard/admin/impact" : "/dashboard/dampak"}
          >
            Lihat dampak lengkap <ArrowUpRight size={16} />
          </Link>
        ) : (
          <Button variant="outline" disabled={isValidating} onClick={() => void mutate()}>
            <RefreshCw size={16} className="mr-2" />
            Perbarui
          </Button>
        )}
      </div>
      {!compact && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!invalid) setRange(draft);
          }}
        >
          <label className="text-sm">
            Donasi sejak
            <input
              type="date"
              aria-label="Donasi sejak"
              className="mt-1 block rounded-md border bg-background px-3 py-2"
              value={draft.start}
              onChange={(e) => setDraft({ ...draft, start: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Sampai tanggal
            <input
              type="date"
              aria-label="Sampai tanggal"
              className="mt-1 block rounded-md border bg-background px-3 py-2"
              value={draft.end}
              onChange={(e) => setDraft({ ...draft, end: e.target.value })}
            />
          </label>
          <Button type="submit" disabled={invalid}>
            Terapkan
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setRange({ start: "", end: "" });
              setDraft({ start: "", end: "" });
            }}
          >
            Semua periode
          </Button>
          {invalid && (
            <p role="alert" className="text-sm text-red-700">
              Tanggal mulai harus sebelum atau sama dengan tanggal akhir.
            </p>
          )}
        </form>
      )}
      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p>Gagal memuat data dampak. Silakan coba lagi.</p>
          <Button variant="outline" className="mt-3" onClick={() => void mutate()}>
            Coba lagi
          </Button>
        </div>
      ) : isLoading || !data ? (
        <p role="status" className="animate-pulse rounded-xl bg-secondary p-8">
          Memuat dampak donasi…
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(([label, value, helper]) => (
              <div key={label} className="rounded-2xl border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="my-3 break-words text-2xl font-bold text-emerald-800">{value}</p>
                <p className="text-xs text-muted-foreground">{helper}</p>
              </div>
            ))}
          </div>
          {!compact && (
            <>
              <p className="text-sm text-muted-foreground">
                Periode donasi: {data.period.start_date || "Sejak awal"} sampai{" "}
                {data.period.end_date} (WIB). Status penyaluran terkini, diperbarui{" "}
                {new Date(data.generated_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}{" "}
                WIB.
              </p>
              {summary && Number(summary.received) === 0 && (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <h3 className="font-semibold">Belum ada donasi berhasil pada periode ini</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Pilih periode lain untuk melihat dampak yang sudah tercatat.
                  </p>
                </div>
              )}
              <div className="grid gap-5 lg:grid-cols-2">
                <article className="rounded-2xl border bg-card p-5">
                  <h3 className="font-semibold">Transparansi dana bersama</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Saldo dan penggunaan dari donasi dalam periode yang dipilih.
                  </p>
                  <dl className="mt-4 space-y-3">
                    {summary &&
                      [
                        ["Dana bersama diterima", summary.pooled_received],
                        ["Tersedia untuk dialokasikan", summary.available],
                        ["Dipesankan / dicadangkan", summary.reserved],
                        ["Diterima Faskes", summary.spent],
                        [
                          "Diserahkan ke keluarga (bagian dari dana diterima Faskes)",
                          summary.distributed,
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex justify-between gap-4 border-b pb-3 text-sm"
                        >
                          <dt>{label}</dt>
                          <dd className="shrink-0 font-semibold">{money(value)}</dd>
                        </div>
                      ))}
                  </dl>
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    Dana diterima = tersedia + dicadangkan + diterima Faskes. Penyerahan ke keluarga
                    merupakan tahap lanjutan, sehingga tidak dijumlahkan kembali.
                  </p>
                  {summary && Number(summary.legacy_received) > 0 && (
                    <p className="mt-3 text-sm text-amber-800">
                      Donasi alur lama: {money(summary.legacy_received)}. Termasuk total donasi,
                      tetapi tidak dimasukkan dalam penyaluran dana bersama.
                    </p>
                  )}
                </article>
                <article className="min-w-0 rounded-2xl border bg-card p-5">
                  <h3 className="font-semibold">Tren donasi berhasil</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nominal donasi per bulan (WIB).
                  </p>
                  {data.trend.length ? (
                    <div
                      className="mt-4 h-64"
                      role="img"
                      aria-label="Grafik donasi berhasil per bulan"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.trend.map((r) => ({ ...r, amount: Number(r.amount) }))}
                        >
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis
                            width={70}
                            tickFormatter={(v) =>
                              Intl.NumberFormat("id-ID", { notation: "compact" }).format(Number(v))
                            }
                          />
                          <Tooltip formatter={(v) => money(Number(v))} />
                          <Bar
                            name="Donasi"
                            dataKey="amount"
                            fill="#047857"
                            radius={[5, 5, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      Belum ada data tren donasi.
                    </p>
                  )}
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer">Lihat angka bulanan</summary>
                    <ul className="mt-2 space-y-2">
                      {data.trend.map((r) => (
                        <li key={r.month}>
                          {r.month}: {money(r.amount)} · {r.count} donasi
                        </li>
                      ))}
                    </ul>
                  </details>
                </article>
              </div>
              <article className="rounded-2xl border bg-card p-5">
                <h3 className="font-semibold">Jangkauan penyaluran per kabupaten/kota Faskes</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hanya bantuan dengan rincian barang yang telah diserahkan.
                </p>
                {data.regions.length ? (
                  <div className="mt-4 space-y-4">
                    {data.regions.map((r) => (
                      <div key={r.code}>
                        <div className="flex flex-wrap justify-between gap-2 text-sm">
                          <span className="font-medium">{r.name}</span>
                          <span>
                            {money(r.amount)} · {r.families} keluarga · {r.distributions} penyerahan
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded bg-secondary">
                          <div
                            className="h-full rounded bg-emerald-600"
                            style={{
                              width: `${Number(summary?.distributed) ? (Number(r.amount) / Number(summary?.distributed)) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-sm text-muted-foreground">
                    Belum ada penyerahan ke keluarga yang tercatat.
                  </p>
                )}
              </article>
              <article className="overflow-hidden rounded-2xl border bg-card p-5">
                <h3 className="font-semibold">Jejak penggunaan donasi</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Maksimal 50 donasi berhasil terbaru dalam periode ini. Ringkasan mencakup seluruh
                  donasi.
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Status penggunaan setiap donasi berhasil</caption>
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        {["Donasi / tanggal", "Nominal", "Dicadangkan", "Diterima Faskes"].map(
                          (h) => (
                            <th key={h} className="whitespace-nowrap px-3 py-3">
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_donations.map((d) => (
                        <tr key={d.id} className="border-b">
                          <td className="px-3 py-3">
                            <span className="font-mono" title={d.id}>
                              {d.id.slice(0, 8)}
                            </span>
                            <p className="whitespace-nowrap text-xs text-muted-foreground">
                              {new Date(d.created_at).toLocaleDateString("id-ID", {
                                timeZone: "Asia/Jakarta",
                              })}{" "}
                              · {d.flow === "pooled" ? "Dana bersama" : "Alur lama"}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-3">{money(d.amount)}</td>
                          <td className="whitespace-nowrap px-3">
                            {d.flow === "pooled" ? money(d.reserved) : "—"}
                          </td>
                          <td className="whitespace-nowrap px-3">
                            {d.flow === "pooled" ? money(d.spent) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
              <aside className="rounded-xl bg-secondary/50 p-5 text-sm leading-relaxed text-muted-foreground">
                <h3 className="mb-2 font-semibold text-foreground">Cara membaca dampak</h3>Nilai
                bantuan dihitung dari jumlah barang yang diserahkan × harga saat pesanan, dikalikan
                porsi pendanaan donasi. Keluarga dihitung sekali dalam laporan ini; keluarga yang
                dibiayai bersama dapat muncul pada laporan beberapa donatur. Jangkauan keluarga
                tidak menunjukkan perbaikan status gizi. Perubahan gizi belum diatribusikan ke
                donasi tertentu. Identitas keluarga tidak ditampilkan.
              </aside>
            </>
          )}
        </>
      )}
    </section>
  );
}
