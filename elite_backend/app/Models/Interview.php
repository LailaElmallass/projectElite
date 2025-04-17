<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'title', 'description', 'date', 'target_audience', 'status'];

    protected $attributes = [
        'status' => 'pending',
    ];

    public function user()
    {
        return $this->belongsTo(User::class); 
    }

    public function candidates()
    {
        return $this->belongsToMany(User::class, 'interview_user', 'interview_id', 'user_id')
                    ->withPivot('applied_at')
                    ->select(['users.id', 'users.nomComplet', 'users.email']);
    }
}