<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Test extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'is_general',
        'target_audience',
        'is_student',
        'duration',
        'questions_count',
        'created_by',
    ];

    protected $casts = [
        'is_general' => 'boolean',
        'is_student' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'questions_count' => 'integer',
    ];

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}