<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Table: users
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nomComplet');
            $table->string('nom')->nullable();
            $table->string('prenom')->nullable();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('utilisateur');
            $table->string('numero_de_telephone');
            $table->string('gender')->nullable();
            $table->string('goal')->nullable();
            $table->string('specialty')->nullable();
            $table->string('company_name')->nullable();
            $table->string('industry')->nullable();
            $table->boolean('is_first_time')->default(true);
            $table->string('ville')->nullable();
            $table->string('image')->nullable();
            $table->string('logo')->nullable();
            $table->string('software_technologies')->nullable();
            $table->string('address')->nullable();
            $table->string('cef')->nullable();
            $table->date('creation_date')->nullable();
            $table->string('required_skills')->nullable();
            $table->string('programming_language')->nullable();
            $table->string('age_range')->nullable();
            $table->string('required_diplomas')->nullable();
            $table->integer('points')->default(0);
            $table->string('target_audience')->nullable();
            $table->boolean('is_student')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // Table: notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        // Table: tests
        Schema::create('tests', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('duration');
            $table->integer('questions_count')->default(0);
            $table->text('description');
            $table->string('target_audience');
            $table->boolean('is_general')->default(false);
            $table->boolean('is_for_students')->default(false);
            $table->timestamps();
        });

        // Table: questions
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_id')->constrained()->onDelete('cascade');
            $table->text('question');
            $table->json('options');
            $table->integer('correct_answer_index')->nullable();
            $table->timestamps();
        });

        // Table: formations
        Schema::create('formations', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->text('description');
            $table->string('duration', 50);
            $table->string('level', 50);
            $table->integer('students')->default(0);
            $table->float('rating')->default(0);
            $table->string('image')->nullable();
            $table->string('category', 100);
            $table->string('instructor', 100);
            $table->decimal('price', 8, 2);
            $table->string('target_audience', 100);
            $table->string('video')->nullable();
            $table->string('link')->nullable();
            $table->integer('points')->default(0);
            $table->timestamps();
        });

        // Table: formation_user
        Schema::create('formation_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('formation_id')->constrained()->onDelete('cascade');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // Table: user_payments
        Schema::create('user_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('formation_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('amount', 8, 2);
            $table->boolean('is_global_subscription')->default(false);
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // Table: capsules
        Schema::create('capsules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Créateur (ex. entreprise ou coach)
            $table->string('title');
            $table->text('description');
            $table->string('video')->nullable(); // URL ou chemin vers la vidéo
            $table->string('target_audience');
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->timestamps();
        });

        // Table: interviews
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Créateur (ex. entreprise)
            $table->string('title');
            $table->text('description');
            $table->dateTime('date'); // Date et heure de l'entretien
            $table->string('target_audience');
            $table->string('status')->default('pending'); // pending, scheduled, completed, cancelled
            $table->timestamps();
        });

        // Table Pivot: interview_user (participants aux interviews)
        Schema::create('interview_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Participant
            $table->foreignId('interview_id')->constrained()->onDelete('cascade'); // Entretien
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_user');
        Schema::dropIfExists('interviews');
        Schema::dropIfExists('capsules');
        Schema::dropIfExists('user_payments');
        Schema::dropIfExists('formation_user');
        Schema::dropIfExists('formations');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('tests');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('users');
    }
};