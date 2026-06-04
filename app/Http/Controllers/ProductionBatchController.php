<?php

namespace App\Http\Controllers;

use App\Models\ProductionBatch;
use App\Services\CouponGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductionBatchController extends Controller
{
    public function index(CouponGenerator $couponGenerator): Response
    {
        $batches = ProductionBatch::query()
            ->with(['boxes' => fn ($query) => $query
                ->with(['coupons' => fn ($couponQuery) => $couponQuery->orderBy('serial_number')])
                ->orderBy('box_number')])
            ->orderBy('batch_number')
            ->get()
            ->map(fn (ProductionBatch $batch): array => [
                'id' => $batch->id,
                'batch_number' => $batch->batch_number,
                'operator_name' => $batch->operator_name,
                'location' => $batch->location,
                'produced_at' => $batch->produced_at->format('d-M-Y / H:i'),
                'box_start' => $batch->box_start,
                'box_end' => $batch->box_end,
                'total_coupons' => $batch->total_coupons,
                'total_winning_coupons' => $batch->total_winning_coupons,
                'total_prize_amount' => $batch->total_prize_amount,
                'report_coupons' => $batch->boxes
                    ->flatMap(fn ($box) => $box->coupons->map(fn ($coupon): array => [
                        'id' => $coupon->id,
                        'box_number' => $box->box_number,
                        'serial_number' => $coupon->serial_number,
                        'prize_amount' => $coupon->prize_amount,
                        'description' => $coupon->description,
                        'status' => $coupon->status,
                    ]))
                    ->values()
                    ->all(),
                'boxes' => $batch->boxes->map(fn ($box): array => [
                    'id' => $box->id,
                    'box_number' => $box->box_number,
                    'serial_start' => $box->serial_start,
                    'serial_end' => $box->serial_end,
                    'total_coupons' => $box->total_coupons,
                    'total_winning_coupons' => $box->total_winning_coupons,
                    'total_prize_amount' => $box->total_prize_amount,
                    'coupons' => $box->coupons->map(fn ($coupon): array => [
                        'id' => $coupon->id,
                        'serial_number' => $coupon->serial_number,
                        'prize_amount' => $coupon->prize_amount,
                        'description' => $coupon->description,
                        'status' => $coupon->status,
                    ])->all(),
                ])->all(),
            ])
            ->all();

        return Inertia::render('coupon-production', [
            'batches' => $batches,
            'requirements' => [
                'total_coupons' => CouponGenerator::TOTAL_COUPONS,
                'box_count' => CouponGenerator::BOX_COUNT,
                'coupons_per_box' => CouponGenerator::COUPONS_PER_BOX,
                'prize_distribution' => CouponGenerator::PRIZE_DISTRIBUTION,
                'prize_distribution_per_box' => $couponGenerator->prizeDistributionPerBox(),
            ],
        ]);
    }

    public function store(Request $request, CouponGenerator $couponGenerator): RedirectResponse
    {
        $validated = $request->validate([
            'batch_1_operator' => ['required', 'string', 'max:100'],
            'batch_1_location' => ['required', 'string', 'max:100'],
            'batch_1_produced_at' => ['required', 'date'],
            'batch_2_operator' => ['required', 'string', 'max:100'],
            'batch_2_location' => ['required', 'string', 'max:100'],
            'batch_2_produced_at' => ['required', 'date'],
        ]);

        $couponGenerator->regenerateProduction($validated);

        return to_route('coupon-production.index')->with('success', 'Data kupon dan laporan produksi berhasil digenerate ulang.');
    }
}
