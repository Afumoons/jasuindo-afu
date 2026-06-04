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
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_box_id')->constrained()->cascadeOnDelete();
            $table->string('serial_number', 5)->unique();
            $table->unsignedTinyInteger('box_number');
            $table->unsignedInteger('prize_amount')->default(0);
            $table->string('description')->default('Anda Belum Beruntung');
            $table->string('status')->default('belum_terpakai');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->index(['box_number', 'serial_number']);
            $table->index('prize_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
