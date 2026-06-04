<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CouponBox extends Model
{
    use HasFactory;

    protected $fillable = [
        'production_batch_id',
        'box_number',
        'serial_start',
        'serial_end',
        'total_coupons',
        'total_winning_coupons',
        'total_prize_amount',
    ];

    public function productionBatch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class);
    }

    public function coupons(): HasMany
    {
        return $this->hasMany(Coupon::class);
    }
}
