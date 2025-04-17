<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Capsule extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'duration',
        'target_audience',
        'video',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}