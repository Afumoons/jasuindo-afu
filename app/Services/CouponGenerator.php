<?php

namespace App\Services;

use App\Models\CouponBox;
use App\Models\ProductionBatch;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CouponGenerator
{
    public const TOTAL_COUPONS = 10000;

    public const BOX_COUNT = 10;

    public const COUPONS_PER_BOX = 1000;

    /**
     * @var array<int, int>
     */
    public const PRIZE_DISTRIBUTION = [
        100000 => 50,
        50000 => 100,
        20000 => 250,
        10000 => 500,
        5000 => 1000,
    ];

    /**
     * @return array<int, int>
     */
    public function prizeDistributionPerBox(): array
    {
        $distribution = [];

        foreach (self::PRIZE_DISTRIBUTION as $prize => $count) {
            $distribution[$prize] = intdiv($count, self::BOX_COUNT);
        }

        return $distribution;
    }

    /**
     * @return array<int, array{serial_number: string, box_number: int, prize_amount: int, description: string}>
     */
    public function generateCoupons(): array
    {
        $coupons = [];
        $previousPrize = 0;

        for ($boxNumber = 1; $boxNumber <= self::BOX_COUNT; $boxNumber++) {
            $boxPrizes = $this->generateBoxPrizes($previousPrize);

            foreach ($boxPrizes as $offset => $prizeAmount) {
                $serialNumber = (($boxNumber - 1) * self::COUPONS_PER_BOX) + $offset + 1;

                $coupons[] = [
                    'serial_number' => str_pad((string) $serialNumber, 5, '0', STR_PAD_LEFT),
                    'box_number' => $boxNumber,
                    'prize_amount' => $prizeAmount,
                    'description' => $prizeAmount > 0 ? 'Rp. '.number_format($prizeAmount, 0, ',', '.') : 'Anda Belum Beruntung',
                    'status' => 'belum_terpakai',
                ];
            }

            $previousPrize = $boxPrizes[self::COUPONS_PER_BOX - 1];
        }

        return $coupons;
    }

    /**
     * @param  array{batch_1_operator: string, batch_1_location: string, batch_1_produced_at: string, batch_2_operator: string, batch_2_location: string, batch_2_produced_at: string}  $input
     */
    public function regenerateProduction(array $input): void
    {
        DB::transaction(function () use ($input): void {
            ProductionBatch::query()->delete();

            $batches = [
                1 => [
                    'operator_name' => $input['batch_1_operator'],
                    'location' => $input['batch_1_location'],
                    'produced_at' => $input['batch_1_produced_at'],
                    'box_start' => 1,
                    'box_end' => 5,
                ],
                2 => [
                    'operator_name' => $input['batch_2_operator'],
                    'location' => $input['batch_2_location'],
                    'produced_at' => $input['batch_2_produced_at'],
                    'box_start' => 6,
                    'box_end' => 10,
                ],
            ];

            foreach ($batches as $batchNumber => $batchData) {
                ProductionBatch::query()->create([
                    'batch_number' => $batchNumber,
                    ...$batchData,
                ]);
            }

            $batchIdsByBox = ProductionBatch::query()
                ->get()
                ->mapWithKeys(fn (ProductionBatch $batch): array => array_fill_keys(range($batch->box_start, $batch->box_end), $batch->id))
                ->all();

            $couponsByBox = collect($this->generateCoupons())->groupBy('box_number');

            foreach ($couponsByBox as $boxNumber => $coupons) {
                $box = CouponBox::query()->create([
                    'production_batch_id' => $batchIdsByBox[$boxNumber],
                    'box_number' => $boxNumber,
                    'serial_start' => $coupons->first()['serial_number'],
                    'serial_end' => $coupons->last()['serial_number'],
                ]);

                $now = now();
                $box->coupons()->insert($coupons->map(fn (array $coupon): array => [
                    'coupon_box_id' => $box->id,
                    'serial_number' => $coupon['serial_number'],
                    'box_number' => $coupon['box_number'],
                    'prize_amount' => $coupon['prize_amount'],
                    'description' => $coupon['description'],
                    'status' => $coupon['status'],
                    'used_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])->all());
            }
        });
    }

    /**
     * @return array{total_coupons: int, total_winning_coupons: int, total_prize_amount: int, per_box_valid: bool, adjacent_prizes_valid: bool, serials_valid: bool}
     */
    public function validateGeneratedCoupons(array $coupons): array
    {
        $expectedPerBox = $this->prizeDistributionPerBox();
        $serialsValid = true;
        $adjacentPrizesValid = true;

        foreach ($coupons as $index => $coupon) {
            $expectedSerial = str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT);

            if ($coupon['serial_number'] !== $expectedSerial) {
                $serialsValid = false;
            }

            if ($index > 0 && $coupon['prize_amount'] > 0 && $coupon['prize_amount'] === $coupons[$index - 1]['prize_amount']) {
                $adjacentPrizesValid = false;
            }
        }

        $perBoxValid = collect($coupons)
            ->groupBy('box_number')
            ->every(function ($boxCoupons) use ($expectedPerBox): bool {
                if ($boxCoupons->count() !== self::COUPONS_PER_BOX) {
                    return false;
                }

                foreach ($expectedPerBox as $prize => $count) {
                    if ($boxCoupons->where('prize_amount', $prize)->count() !== $count) {
                        return false;
                    }
                }

                return $boxCoupons->where('prize_amount', 0)->count() === 810;
            });

        return [
            'total_coupons' => count($coupons),
            'total_winning_coupons' => collect($coupons)->where('prize_amount', '>', 0)->count(),
            'total_prize_amount' => collect($coupons)->sum('prize_amount'),
            'per_box_valid' => $perBoxValid,
            'adjacent_prizes_valid' => $adjacentPrizesValid,
            'serials_valid' => $serialsValid,
        ];
    }

    /**
     * @return array<int, int>
     */
    private function generateBoxPrizes(int $previousPrize): array
    {
        $winningCouponCount = array_sum($this->prizeDistributionPerBox());

        if ($winningCouponCount > self::COUPONS_PER_BOX) {
            throw new RuntimeException('Jumlah hadiah melebihi kapasitas kupon per box.');
        }

        for ($attempt = 0; $attempt < 500; $attempt++) {
            $prizes = array_fill(0, self::COUPONS_PER_BOX, 0);

            foreach ($this->prizeDistributionPerBox() as $prize => $count) {
                for ($index = 0; $index < $count; $index++) {
                    $availableOffsets = $this->availableOffsetsForPrize($prizes, $prize, $previousPrize);

                    if ($availableOffsets === []) {
                        continue 3;
                    }

                    $prizes[$availableOffsets[random_int(0, count($availableOffsets) - 1)]] = $prize;
                }
            }

            if ($this->hasValidAdjacentPrizes($prizes, $previousPrize) && $this->isSpreadAcrossBox($prizes)) {
                return $prizes;
            }
        }

        throw new RuntimeException('Gagal generate kupon acak yang memenuhi aturan sebaran hadiah.');
    }

    /**
     * @param  array<int, int>  $prizes
     * @return array<int, int>
     */
    private function availableOffsetsForPrize(array $prizes, int $prize, int $previousPrize): array
    {
        $availableOffsets = [];

        foreach ($prizes as $offset => $currentPrize) {
            if ($currentPrize !== 0) {
                continue;
            }

            $leftPrize = $offset === 0 ? $previousPrize : $prizes[$offset - 1];
            $rightPrize = $prizes[$offset + 1] ?? 0;

            if ($leftPrize === $prize || $rightPrize === $prize) {
                continue;
            }

            $availableOffsets[] = $offset;
        }

        return $availableOffsets;
    }

    /**
     * @param  array<int, int>  $prizes
     */
    private function isSpreadAcrossBox(array $prizes): bool
    {
        $winningOffsets = [];

        foreach ($prizes as $offset => $prize) {
            if ($prize > 0) {
                $winningOffsets[] = $offset;
            }
        }

        if ($winningOffsets === []) {
            return false;
        }

        return min($winningOffsets) < 200 && max($winningOffsets) > 800;
    }

    /**
     * @param  array<int, int>  $prizes
     */
    private function hasValidAdjacentPrizes(array $prizes, int $previousPrize): bool
    {
        foreach ($prizes as $index => $prize) {
            if ($prize === 0) {
                continue;
            }

            $previous = $index === 0 ? $previousPrize : $prizes[$index - 1];

            if ($previous === $prize) {
                return false;
            }
        }

        return true;
    }
}
