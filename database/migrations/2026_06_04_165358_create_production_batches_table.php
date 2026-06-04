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
        Schema::create('production_batches', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('batch_number')->unique();
            $table->string('operator_name');
            $table->string('location');
            $table->dateTime('produced_at');
            $table->unsignedTinyInteger('box_start');
            $table->unsignedTinyInteger('box_end');
            $table->unsignedInteger('total_coupons')->default(5000);
            $table->unsignedInteger('total_winning_coupons')->default(950);
            $table->unsignedBigInteger('total_prize_amount')->default(12500000);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_batches');
    }
};
