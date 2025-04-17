<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAppliedAtToInterviewUserTable extends Migration
{
    public function up()
    {
        Schema::table('interview_user', function (Blueprint $table) {
            $table->timestamp('applied_at')->nullable()->after('interview_id');
        });
    }

    public function down()
    {
        Schema::table('interview_user', function (Blueprint $table) {
            $table->dropColumn('applied_at');
        });
    }
}