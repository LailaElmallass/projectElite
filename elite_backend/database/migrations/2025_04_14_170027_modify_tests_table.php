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
        Schema::table('tests', function (Blueprint $table) {
            // Renommer is_for_students en is_student
            if (Schema::hasColumn('tests', 'is_for_students') && !Schema::hasColumn('tests', 'is_student')) {
                // Utiliser CHANGE COLUMN pour compatibilité avec MariaDB
                $table->boolean('is_student')->nullable()->change();
                \DB::statement('ALTER TABLE tests CHANGE is_for_students is_student TINYINT(1) NULL');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tests', function (Blueprint $table) {
            // Restaurer is_for_students
            if (Schema::hasColumn('tests', 'is_student') && !Schema::hasColumn('tests', 'is_for_students')) {
                $table->boolean('is_for_students')->nullable()->change();
                \DB::statement('ALTER TABLE tests CHANGE is_student is_for_students TINYINT(1) NULL');
            }
        });
    }
};