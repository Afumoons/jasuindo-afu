<?php

use App\Models\Coupon;
use App\Models\CouponBox;
use App\Models\ProductionBatch;

it('renders the coupon production page', function () {
    $this->get('/coupon-production')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('coupon-production')
            ->has('requirements')
            ->where('requirements.total_coupons', 10000)
            ->where('requirements.box_count', 10)
        );
});

it('generates production batches, boxes, coupons, and usage status', function () {
    $this->post('/coupon-production', [
        'batch_1_operator' => 'Amir',
        'batch_1_location' => 'Surabaya',
        'batch_1_produced_at' => '1901-01-01T14:00',
        'batch_2_operator' => 'Nando',
        'batch_2_location' => 'Surabaya',
        'batch_2_produced_at' => '1901-01-02T10:00',
    ])->assertRedirect('/coupon-production');

    expect(ProductionBatch::query()->count())->toBe(2)
        ->and(CouponBox::query()->count())->toBe(10)
        ->and(Coupon::query()->count())->toBe(10000)
        ->and(Coupon::query()->where('prize_amount', '>', 0)->count())->toBe(1900)
        ->and(Coupon::query()->sum('prize_amount'))->toBe(25000000)
        ->and(Coupon::query()->where('status', 'belum_terpakai')->count())->toBe(10000)
        ->and(Coupon::query()->whereNull('used_at')->count())->toBe(10000);

    expect(ProductionBatch::query()->where('batch_number', 1)->first())
        ->operator_name->toBe('Amir')
        ->box_start->toBe(1)
        ->box_end->toBe(5);

    expect(ProductionBatch::query()->where('batch_number', 2)->first())
        ->operator_name->toBe('Nando')
        ->box_start->toBe(6)
        ->box_end->toBe(10);

    $this->get('/coupon-production')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('coupon-production')
            ->has('batches', 2)
            ->has('batches.0.boxes', 5)
            ->has('batches.0.boxes.0.coupons', 1000)
            ->where('batches.0.boxes.0.coupons.0.status', 'belum_terpakai')
        );
});
