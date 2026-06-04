import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Coupon = {
    id: number;
    serial_number: string;
    prize_amount: number;
    description: string;
    status: 'belum_terpakai' | 'terpakai';
};

type ReportCoupon = Coupon & {
    box_number: number;
};

type CouponBox = {
    id: number;
    box_number: number;
    serial_start: string;
    serial_end: string;
    total_coupons: number;
    total_winning_coupons: number;
    total_prize_amount: number;
    coupons: Coupon[];
};

type ProductionBatch = {
    id: number;
    batch_number: number;
    operator_name: string;
    location: string;
    produced_at: string;
    box_start: number;
    box_end: number;
    total_coupons: number;
    total_winning_coupons: number;
    total_prize_amount: number;
    report_coupons: ReportCoupon[];
    boxes: CouponBox[];
};

type Requirements = {
    total_coupons: number;
    box_count: number;
    coupons_per_box: number;
    prize_distribution: Record<string, number>;
    prize_distribution_per_box: Record<string, number>;
};

type PageProps = {
    batches: ProductionBatch[];
    requirements: Requirements;
    flash?: {
        success?: string;
    };
};

type ProductionForm = {
    batch_1_operator: string;
    batch_1_location: string;
    batch_1_produced_at: string;
    batch_2_operator: string;
    batch_2_location: string;
    batch_2_produced_at: string;
};

const defaultForm: ProductionForm = {
    batch_1_operator: 'Amir',
    batch_1_location: 'Surabaya',
    batch_1_produced_at: '1901-01-01T14:00',
    batch_2_operator: 'Nando',
    batch_2_location: 'Surabaya',
    batch_2_produced_at: '1901-01-02T10:00',
};

const currencyFormatter = new Intl.NumberFormat('id-ID');

function formatCurrency(value: number) {
    return value > 0 ? currencyFormatter.format(value) : '0';
}

export default function CouponProduction() {
    const { batches, requirements, flash } = usePage<PageProps>().props;
    const [form, setForm] = useState<ProductionForm>(defaultForm);
    const [selectedBoxNumber, setSelectedBoxNumber] = useState<number>(1);
    const [viewMode, setViewMode] = useState<'batch' | 'box'>('batch');
    const [processing, setProcessing] = useState(false);

    const boxes = useMemo(
        () => batches.flatMap((batch) => batch.boxes),
        [batches],
    );
    const selectedBox =
        boxes.find((box) => box.box_number === selectedBoxNumber) ?? boxes[0];

    const totals = useMemo(() => {
        const coupons = boxes.flatMap((box) => box.coupons);
        const winningCoupons = coupons.filter(
            (coupon) => coupon.prize_amount > 0,
        );

        return {
            coupons: coupons.length,
            winningCoupons: winningCoupons.length,
            prizeAmount: winningCoupons.reduce(
                (total, coupon) => total + coupon.prize_amount,
                0,
            ),
        };
    }, [boxes]);

    function updateField(field: keyof ProductionForm, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setProcessing(true);

        router.post('/coupon-production', form, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => setSelectedBoxNumber(1),
        });
    }

    return (
        <>
            <Head title="JIP Software Engineer - Coupon Production" />
            <div className="min-h-screen bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 lg:p-8">
                    <section className="overflow-hidden rounded-2xl border border-[#19140020] bg-white shadow-sm dark:border-[#3E3E3A] dark:bg-[#161615]">
                        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="p-6 lg:p-10">
                                <Badge className="mb-4 bg-[#f53003] text-white hover:bg-[#f53003]">
                                    Software Engineer Test
                                </Badge>
                                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight lg:text-5xl">
                                    Generate Kupon Berhadiah Langsung
                                </h1>
                                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#706f6c] dark:text-[#A1A09A]">
                                    Aplikasi Laravel + React untuk membuat
                                    10.000 nomor kupon, membagi output ke 10 box
                                    dan 2 batch produksi, serta menampilkan
                                    laporan detail produksi per batch sesuai
                                    soal JIP.
                                </p>
                                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                    <StatCard
                                        label="Total Kupon"
                                        value={currencyFormatter.format(
                                            requirements.total_coupons,
                                        )}
                                    />
                                    <StatCard
                                        label="Total Hadiah"
                                        value="Rp 25.000.000"
                                    />
                                    <StatCard
                                        label="Kupon Berhadiah"
                                        value="1.900"
                                    />
                                </div>
                            </div>
                            <div className="border-t border-[#19140020] bg-[#fff2f2] p-6 lg:border-t-0 lg:border-l dark:border-[#3E3E3A] dark:bg-[#1D0002]">
                                <h2 className="font-medium">Struktur Data</h2>
                                <dl className="mt-4 space-y-3 text-sm">
                                    <SchemaLine
                                        name="production_batches"
                                        value="operator, lokasi, waktu, box 1-5 / 6-10"
                                    />
                                    <SchemaLine
                                        name="coupon_boxes"
                                        value="box, serial awal-akhir, ringkasan hadiah"
                                    />
                                    <SchemaLine
                                        name="coupons"
                                        value="no kupon, nominal, keterangan"
                                    />
                                </dl>
                            </div>
                        </div>
                    </section>

                    {flash?.success ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                            {flash.success}
                        </div>
                    ) : null}

                    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                        <Card>
                            <CardHeader>
                                <CardTitle>Generate Produksi</CardTitle>
                                <CardDescription>
                                    Dua batch produksi, masing-masing
                                    menghasilkan 5 box berisi 1.000 kupon.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submit} className="space-y-6">
                                    <BatchForm
                                        title="Batch 1"
                                        boxLabel="Box 1 - 5"
                                        operator={form.batch_1_operator}
                                        location={form.batch_1_location}
                                        producedAt={form.batch_1_produced_at}
                                        onOperatorChange={(value) =>
                                            updateField(
                                                'batch_1_operator',
                                                value,
                                            )
                                        }
                                        onLocationChange={(value) =>
                                            updateField(
                                                'batch_1_location',
                                                value,
                                            )
                                        }
                                        onProducedAtChange={(value) =>
                                            updateField(
                                                'batch_1_produced_at',
                                                value,
                                            )
                                        }
                                    />
                                    <BatchForm
                                        title="Batch 2"
                                        boxLabel="Box 6 - 10"
                                        operator={form.batch_2_operator}
                                        location={form.batch_2_location}
                                        producedAt={form.batch_2_produced_at}
                                        onOperatorChange={(value) =>
                                            updateField(
                                                'batch_2_operator',
                                                value,
                                            )
                                        }
                                        onLocationChange={(value) =>
                                            updateField(
                                                'batch_2_location',
                                                value,
                                            )
                                        }
                                        onProducedAtChange={(value) =>
                                            updateField(
                                                'batch_2_produced_at',
                                                value,
                                            )
                                        }
                                    />
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? 'Generate...'
                                            : 'Generate Ulang Kupon'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Komposisi Hadiah</CardTitle>
                                <CardDescription>
                                    Komposisi per box dibuat sama; hadiah yang
                                    sama tidak ditempatkan pada nomor kupon
                                    berurutan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {Object.entries(
                                        requirements.prize_distribution,
                                    ).map(([prize, count]) => (
                                        <div
                                            key={prize}
                                            className="rounded-xl border bg-muted/30 p-4"
                                        >
                                            <div className="text-sm text-muted-foreground">
                                                Rp{' '}
                                                {formatCurrency(Number(prize))}
                                            </div>
                                            <div className="mt-1 text-2xl font-semibold">
                                                {count} kupon
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {
                                                    requirements
                                                        .prize_distribution_per_box[
                                                        prize
                                                    ]
                                                }{' '}
                                                kupon / box
                                            </div>
                                        </div>
                                    ))}
                                    <div className="rounded-xl border bg-muted/30 p-4">
                                        <div className="text-sm text-muted-foreground">
                                            Anda Belum Beruntung
                                        </div>
                                        <div className="mt-1 text-2xl font-semibold">
                                            8.100 kupon
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            810 kupon / box
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <section className="grid gap-6 md:grid-cols-3">
                        <StatCard
                            label="Data Tersimpan"
                            value={currencyFormatter.format(totals.coupons)}
                        />
                        <StatCard
                            label="Kupon Berhadiah"
                            value={currencyFormatter.format(
                                totals.winningCoupons,
                            )}
                        />
                        <StatCard
                            label="Total Nominal"
                            value={`Rp ${formatCurrency(totals.prizeAmount)}`}
                        />
                    </section>

                    <section className="space-y-4">
                        <div className="flex flex-col gap-3 rounded-2xl border border-[#19140020] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#3E3E3A] dark:bg-[#161615]">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Tampilan Data Generated
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Pilih laporan keseluruhan per batch atau
                                    detail per box yang sudah ada.
                                </p>
                            </div>
                            <div className="inline-flex rounded-xl border bg-muted/40 p-1">
                                <Button
                                    type="button"
                                    variant={
                                        viewMode === 'batch'
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    onClick={() => setViewMode('batch')}
                                >
                                    View Per Batch
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        viewMode === 'box' ? 'default' : 'ghost'
                                    }
                                    onClick={() => setViewMode('box')}
                                >
                                    View Per Box
                                </Button>
                            </div>
                        </div>

                        {batches.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                    Belum ada data produksi. Klik tombol
                                    generate untuk membuat kupon dan laporan
                                    batch.
                                </CardContent>
                            </Card>
                        ) : viewMode === 'batch' ? (
                            <BatchOverallReport batches={batches} />
                        ) : (
                            <>
                                <section className="space-y-6">
                                    {batches.map((batch) => (
                                        <BatchReport
                                            key={batch.id}
                                            batch={batch}
                                            selectedBoxNumber={
                                                selectedBoxNumber
                                            }
                                            onSelectBox={setSelectedBoxNumber}
                                        />
                                    ))}
                                </section>

                                {selectedBox ? (
                                    <BoxCouponDetail box={selectedBox} />
                                ) : null}
                            </>
                        )}
                    </section>
                </main>
            </div>
        </>
    );
}

function BatchOverallReport({ batches }: { batches: ProductionBatch[] }) {
    const [showNonWinningCoupons, setShowNonWinningCoupons] = useState(false);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <CardTitle>View Per Batch Keseluruhan</CardTitle>
                        <CardDescription>
                            Tampilan generated seperti format laporan cetak:
                            setiap batch menampilkan identitas produksi dan
                            seluruh kupon dari box yang termasuk batch tersebut.
                        </CardDescription>
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3 text-sm">
                        <Checkbox
                            checked={showNonWinningCoupons}
                            onCheckedChange={(checked) =>
                                setShowNonWinningCoupons(checked === true)
                            }
                            aria-label="Tampilkan kupon non-hadiah"
                        />
                        <span>
                            <span className="block font-medium">
                                Tampilkan kupon non-hadiah
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                Mati: hanya kupon berhadiah. Nyala: tampilkan
                                semua kupon termasuk “Anda Belum Beruntung”.
                            </span>
                        </span>
                    </label>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {batches.map((batch) => {
                    const reportCoupons = showNonWinningCoupons
                        ? batch.report_coupons
                        : batch.report_coupons.filter(
                              (coupon) => coupon.prize_amount > 0,
                          );

                    return (
                        <div
                            key={batch.id}
                            className="overflow-hidden rounded-xl border border-[#1b1b18]/40 bg-white text-[#1b1b18] dark:border-[#EDEDEC]/40 dark:bg-[#0f0f0f] dark:text-[#EDEDEC]"
                        >
                            <div className="grid grid-cols-[150px_1fr] border-b border-[#1b1b18]/40 text-sm dark:border-[#EDEDEC]/40">
                                <BatchMeta
                                    label="No Batch"
                                    value={batch.batch_number}
                                />
                                <BatchMeta
                                    label="Nama Operator"
                                    value={batch.operator_name}
                                />
                                <BatchMeta
                                    label="Lokasi"
                                    value={batch.location}
                                />
                                <BatchMeta
                                    label="Tanggal / Jam"
                                    value={batch.produced_at}
                                />
                            </div>

                            <div className="border-b border-[#1b1b18]/25 px-3 py-2 text-xs text-muted-foreground dark:border-[#EDEDEC]/25">
                                Menampilkan{' '}
                                {currencyFormatter.format(reportCoupons.length)}{' '}
                                dari{' '}
                                {currencyFormatter.format(
                                    batch.report_coupons.length,
                                )}{' '}
                                kupon
                                {showNonWinningCoupons
                                    ? ' termasuk non-hadiah.'
                                    : ' berhadiah saja.'}
                            </div>

                            <div className="max-h-[620px] overflow-auto">
                                <table className="w-full border-collapse text-center text-sm">
                                    <thead className="sticky top-0 bg-[#FDFDFC] dark:bg-[#161615]">
                                        <tr>
                                            <th className="border-r border-b border-[#1b1b18]/40 px-3 py-1.5 font-semibold dark:border-[#EDEDEC]/40">
                                                No Box
                                            </th>
                                            <th className="border-r border-b border-[#1b1b18]/40 px-3 py-1.5 font-semibold dark:border-[#EDEDEC]/40">
                                                No Kupon
                                            </th>
                                            <th className="border-r border-b border-[#1b1b18]/40 px-3 py-1.5 font-semibold dark:border-[#EDEDEC]/40">
                                                Nominal
                                            </th>
                                            <th className="border-b border-[#1b1b18]/40 px-3 py-1.5 font-semibold dark:border-[#EDEDEC]/40">
                                                Keterangan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportCoupons.map((coupon) => (
                                            <tr key={coupon.id}>
                                                <td className="border-r border-b border-[#1b1b18]/25 px-3 py-1.5 dark:border-[#EDEDEC]/25">
                                                    {coupon.box_number}
                                                </td>
                                                <td className="border-r border-b border-[#1b1b18]/25 px-3 py-1.5 font-mono dark:border-[#EDEDEC]/25">
                                                    {coupon.serial_number}
                                                </td>
                                                <td className="border-r border-b border-[#1b1b18]/25 px-3 py-1.5 dark:border-[#EDEDEC]/25">
                                                    {formatCurrency(
                                                        coupon.prize_amount,
                                                    )}
                                                </td>
                                                <td className="border-b border-[#1b1b18]/25 px-3 py-1.5 dark:border-[#EDEDEC]/25">
                                                    {coupon.description}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-3 py-1.5 text-center text-sm text-muted-foreground italic"
                                            >
                                                dan seterusnya...
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function BatchMeta({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <>
            <div className="border-r border-[#1b1b18]/40 px-3 py-1 font-semibold dark:border-[#EDEDEC]/40">
                {label}:
            </div>
            <div className="px-3 py-1">{value}</div>
        </>
    );
}

function BoxCouponDetail({ box }: { box: CouponBox }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Detail Kupon Box {box.box_number}</CardTitle>
                <CardDescription>
                    Nomor {box.serial_start} sampai {box.serial_end}.
                    Menampilkan semua {box.total_coupons} kupon dalam box
                    terpilih.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-h-[560px] overflow-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-muted text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    No Kupon
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Nominal
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Keterangan
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {box.coupons.map((coupon) => (
                                <tr key={coupon.id} className="border-t">
                                    <td className="px-4 py-2 font-mono">
                                        {coupon.serial_number}
                                    </td>
                                    <td className="px-4 py-2">
                                        {formatCurrency(coupon.prize_amount)}
                                    </td>
                                    <td className="px-4 py-2 text-muted-foreground">
                                        {coupon.description}
                                    </td>
                                    <td className="px-4 py-2">
                                        <Badge
                                            variant={
                                                coupon.status === 'terpakai'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                        >
                                            {coupon.status === 'terpakai'
                                                ? 'Terpakai'
                                                : 'Belum Terpakai'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-[#19140020] bg-white p-4 shadow-sm dark:border-[#3E3E3A] dark:bg-[#161615]">
            <div className="text-xs tracking-wide text-[#706f6c] uppercase dark:text-[#A1A09A]">
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
    );
}

function SchemaLine({ name, value }: { name: string; value: string }) {
    return (
        <div className="rounded-lg border border-[#19140015] bg-white/70 p-3 dark:border-[#3E3E3A] dark:bg-black/20">
            <dt className="font-mono text-xs text-[#f53003]">{name}</dt>
            <dd className="mt-1 text-[#706f6c] dark:text-[#A1A09A]">{value}</dd>
        </div>
    );
}

function BatchForm({
    title,
    boxLabel,
    operator,
    location,
    producedAt,
    onOperatorChange,
    onLocationChange,
    onProducedAtChange,
}: {
    title: string;
    boxLabel: string;
    operator: string;
    location: string;
    producedAt: string;
    onOperatorChange: (value: string) => void;
    onLocationChange: (value: string) => void;
    onProducedAtChange: (value: string) => void;
}) {
    return (
        <fieldset className="rounded-xl border p-4">
            <legend className="px-2 text-sm font-medium">
                {title} · {boxLabel}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Nama Operator</Label>
                    <Input
                        value={operator}
                        onChange={(event) =>
                            onOperatorChange(event.target.value)
                        }
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Lokasi</Label>
                    <Input
                        value={location}
                        onChange={(event) =>
                            onLocationChange(event.target.value)
                        }
                        required
                    />
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <Label>Tanggal / Jam</Label>
                    <Input
                        type="datetime-local"
                        value={producedAt}
                        onChange={(event) =>
                            onProducedAtChange(event.target.value)
                        }
                        required
                    />
                </div>
            </div>
        </fieldset>
    );
}

function BatchReport({
    batch,
    selectedBoxNumber,
    onSelectBox,
}: {
    batch: ProductionBatch;
    selectedBoxNumber: number;
    onSelectBox: (boxNumber: number) => void;
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <CardTitle>No Batch: {batch.batch_number}</CardTitle>
                        <CardDescription>
                            Nama Operator: {batch.operator_name} · Lokasi:{' '}
                            {batch.location} · Tanggal / Jam:{' '}
                            {batch.produced_at}
                        </CardDescription>
                    </div>
                    <Badge variant="outline">
                        Box {batch.box_start} - {batch.box_end}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                    <StatCard
                        label="Output Batch"
                        value={`${currencyFormatter.format(
                            batch.total_coupons,
                        )} kupon`}
                    />
                    <StatCard
                        label="Kupon Berhadiah"
                        value={`${currencyFormatter.format(
                            batch.total_winning_coupons,
                        )} kupon`}
                    />
                    <StatCard
                        label="Nominal Batch"
                        value={`Rp ${formatCurrency(batch.total_prize_amount)}`}
                    />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {batch.boxes.map((box) => (
                        <Button
                            key={box.id}
                            type="button"
                            variant={
                                selectedBoxNumber === box.box_number
                                    ? 'default'
                                    : 'outline'
                            }
                            onClick={() => onSelectBox(box.box_number)}
                        >
                            Box {box.box_number}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
