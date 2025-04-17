<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'nomComplet', 'nom', 'prenom', 'email', 'password', 'role',
        'numero_de_telephone', 'gender', 'specialty', 'company_name',
        'industry', 'points', 'image', 'ville', 'target_audience',
        'is_student', 'logo', 'software_technologies', 'address',
        'cef', 'creation_date', 'required_skills', 'programming_language',
        'age_range', 'required_diplomas',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'deleted_at' => 'datetime',
        'points' => 'integer',
        'creation_date' => 'date',
        'is_first_time' => 'boolean',
        'is_student' => 'boolean',
        'programming_languages' => 'array',
    ];

    public function getImageAttribute($value)
    {
        return $value ? ($value[0] === '/' ? $value : "/storage/{$value}") : null;
    }

    public function getLogoAttribute($value)
    {
        return $value ? ($value[0] === '/' ? $value : "/storage/{$value}") : null;
    }

    public function setImageAttribute($value)
    {
        $this->attributes['image'] = $value ? ltrim(str_replace('/storage/', '', $value), '/') : null;
    }

    public function setLogoAttribute($value)
    {
        $this->attributes['logo'] = $value ? ltrim(str_replace('/storage/', '', $value), '/') : null;
    }

    public function payments()
    {
        return $this->hasMany(UserPayment::class);
    }

    public function formations()
    {
        return $this->belongsToMany(Formation::class, 'formation_user')
                    ->withPivot('completed_at')
                    ->withTimestamps();
    }

    public function interviews()
    {
        return $this->belongsToMany(Interview::class, 'interview_user', 'user_id', 'interview_id');
    }

    public function hasAccessToFormation($formationId)
    {
        return $this->payments()->where(function ($query) use ($formationId) {
            $query->where('formation_id', $formationId)
                  ->orWhere('is_global_subscription', true);
        })->exists();
    }

    public function addPoints($points)
    {
        $this->points = ($this->points ?? 0) + $points;
        $this->save();
    }

    public function capsules()
    {
        return $this->hasMany(Capsule::class);
    }
    
    public function jobOffers()
    {
        return $this->hasMany(JobOffer::class);
    }

    public function jobApplications()
    {
        return $this->hasMany(JobApplication::class);
    }

    public function appliedJobs()
    {
        return $this->belongsToMany(JobOffer::class, 'job_applications')
                    ->withPivot('cover_letter', 'cv_path', 'status')
                    ->withTimestamps();
    }

    public function diffusionWorkshops()
    {
        return $this->hasMany(DiffusionWorkshop::class);
    }
    
}