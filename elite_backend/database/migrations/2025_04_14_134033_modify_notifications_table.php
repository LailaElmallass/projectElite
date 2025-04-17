<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Rendre user_id nullable
            $table->unsignedBigInteger('user_id')->nullable()->change();
            // Ajouter recipient_id
            $table->unsignedBigInteger('recipient_id')->after('user_id');
            $table->foreign('recipient_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['recipient_id']);
            $table->dropColumn('recipient_id');
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};