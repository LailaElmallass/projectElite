<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Formation extends Model
{
    protected $fillable = [
        'title', 'description', 'duration', 'level', 'students', 'rating', 'image',
        'category', 'instructor', 'price', 'target_audience', 'video', 'link', 'points'
    ];

    protected $casts = [
        'students' => 'integer',
        'rating' => 'float',
        'price' => 'float',
        'points' => 'integer',
    ];

    public function completedBy()
    {
        return $this->belongsToMany(User::class, 'formation_user')
                    ->withPivot('completed_at')
                    ->withTimestamps();
    }
}