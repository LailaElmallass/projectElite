<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->in('utilisateur', 'coach', 'entreprise');
            $table->string('gender')->nullable(); // Pour utilisateur et coach
            $table->string('goal')->nullable(); // Pour utilisateur
            $table->string('specialty')->nullable(); // Pour coach
            $table->string('company_name')->nullable(); // Pour entreprise
            $table->string('industry')->nullable(); // Pour entreprise
            $table->boolean('is_first_time')->default(true); // Pour redirection vers test
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};