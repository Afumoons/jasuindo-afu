<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coupon_boxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_batch_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('box_number')->unique();
            $table->string('serial_start', 5);
            $table->string('serial_end', 5);
            $table->unsignedInteger('total_coupons')->default(1000);
            $table->unsignedInteger('total_winning_coupons')->default(190);
            $table->unsignedBigInteger('total_prize_amount')->default(2500000);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupon_boxes');
    }
};
