<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDurationToCapsulesTable extends Migration
{
    public function up()
    {
        Schema::table('capsules', function (Blueprint $table) {
            $table->string('duration')->after('description'); // Ajoute la colonne duration
        });
    }

    public function down()
    {
        Schema::table('capsules', function (Blueprint $table) {
            $table->dropColumn('duration');
        });
    }
}