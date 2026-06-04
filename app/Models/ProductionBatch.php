<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_number',
        'operator_name',
        'location',
        'produced_at',
        'box_start',
        'box_end',
        'total_coupons',
        'total_winning_coupons',
        'total_prize_amount',
    ];

    protected function casts(): array
    {
        return [
            'produced_at' => 'datetime',
        ];
    }

    public function boxes(): HasMany
    {
        return $this->hasMany(CouponBox::class);
    }
}
