<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->string('target_audience')->nullable()->change();
            $table->boolean('is_for_students')->nullable()->change();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->softDeletes();
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            $table->string('target_audience')->change();
            $table->boolean('is_for_students')->default(false)->change();
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
            $table->dropSoftDeletes();
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};