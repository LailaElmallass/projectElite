<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiffusionWorkshop extends Model
{
    use HasFactory;

    protected $table = 'diffusions_workshops'; // Explicitly set table name

    protected $fillable = [
        'user_id', 'title', 'description', 'location', 'event_date', 'event_type', 'registration_link',
    ];

    protected $dates = ['event_date'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}