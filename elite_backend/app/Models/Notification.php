<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['title', 'message', 'recipient_id'];

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'notification_user');
    }
}