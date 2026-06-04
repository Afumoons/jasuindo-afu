<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'coupon_box_id',
        'serial_number',
        'box_number',
        'prize_amount',
        'description',
        'status',
        'used_at',
    ];

    protected function casts(): array
    {
        return [
            'used_at' => 'datetime',
        ];
    }

    public function box(): BelongsTo
    {
        return $this->belongsTo(CouponBox::class, 'coupon_box_id');
    }
}
