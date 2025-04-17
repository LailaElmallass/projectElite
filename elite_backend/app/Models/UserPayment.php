<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPayment extends Model
{
    protected $fillable = ['user_id', 'formation_id', 'amount', 'is_global_subscription', 'paid_at'];

    protected $dates = ['paid_at'];
}