<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateJobOffersTable extends Migration
{
    public function up()
    {
        Schema::create('job_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Links to entreprise or admin
            $table->string('title');
            $table->text('description');
            $table->text('requirements');
            $table->string('location');
            $table->string('salary_range')->nullable();
            $table->string('contract_type')->nullable(); // e.g., CDI, CDD, Stage
            $table->date('closing_date')->nullable();
            $table->timestamps();
        });

        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('job_offer_id')->constrained()->onDelete('cascade');
            $table->text('cover_letter')->nullable();
            $table->string('cv_path')->nullable();
            $table->string('status')->default('pending'); // pending, accepted, rejected
            $table->timestamps();
            $table->unique(['user_id', 'job_offer_id']); // Prevent duplicate applications
        });
    }

    public function down()
    {
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('job_offers');
    }
}