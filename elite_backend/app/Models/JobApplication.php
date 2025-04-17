<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobOffer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'description', 'requirements', 'location',
        'salary_range', 'contract_type', 'closing_date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function applications()
    {
        return $this->hasMany(JobApplication::class);
    }

    public function appliedBy()
    {
        return $this->belongsToMany(User::class, 'job_applications')
                    ->withPivot('cover_letter', 'cv_path', 'status')
                    ->withTimestamps();
    }
}