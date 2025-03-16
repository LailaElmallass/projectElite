<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $fillable = ['test_id', 'question', 'options'];

    protected $casts = [
        'options' => 'array',
    ];

    public function test()
    {
        return $this->belongsTo(Test::class);
    }
}