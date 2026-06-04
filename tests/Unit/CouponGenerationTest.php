<?php

use App\Services\CouponGenerator;

it('generates 10000 sequential coupons with the required prize distribution', function () {
    $generator = new CouponGenerator;

    $coupons = $generator->generateCoupons();
    $validation = $generator->validateGeneratedCoupons($coupons);

    expect($validation)
        ->total_coupons->toBe(10000)
        ->total_winning_coupons->toBe(1900)
        ->total_prize_amount->toBe(25000000)
        ->per_box_valid->toBeTrue()
        ->adjacent_prizes_valid->toBeTrue()
        ->serials_valid->toBeTrue();

    expect($coupons[0]['serial_number'])->toBe('00001')
        ->and($coupons[9999]['serial_number'])->toBe('10000')
        ->and($coupons[0]['status'])->toBe('belum_terpakai');
});

it('splits each prize type evenly across all ten boxes', function () {
    $generator = new CouponGenerator;
    $couponsByBox = collect($generator->generateCoupons())->groupBy('box_number');

    expect($couponsByBox)->toHaveCount(10);

    $couponsByBox->each(function ($boxCoupons) {
        expect($boxCoupons)->toHaveCount(1000)
            ->and($boxCoupons->where('prize_amount', 100000))->toHaveCount(5)
            ->and($boxCoupons->where('prize_amount', 50000))->toHaveCount(10)
            ->and($boxCoupons->where('prize_amount', 20000))->toHaveCount(25)
            ->and($boxCoupons->where('prize_amount', 10000))->toHaveCount(50)
            ->and($boxCoupons->where('prize_amount', 5000))->toHaveCount(100)
            ->and($boxCoupons->where('prize_amount', 0))->toHaveCount(810);
    });
});

it('randomly spreads winning coupons across each box instead of concentrating them at the beginning', function () {
    $generator = new CouponGenerator;
    $couponsByBox = collect($generator->generateCoupons())->groupBy('box_number');

    $couponsByBox->each(function ($boxCoupons) {
        $winningOffsets = $boxCoupons
            ->values()
            ->filter(fn (array $coupon): bool => $coupon['prize_amount'] > 0)
            ->keys();

        expect($winningOffsets->min())->toBeLessThan(200)
            ->and($winningOffsets->max())->toBeGreaterThan(800)
            ->and($winningOffsets->filter(fn (int $offset): bool => $offset < 500))->not->toHaveCount($winningOffsets->count());
    });
});
