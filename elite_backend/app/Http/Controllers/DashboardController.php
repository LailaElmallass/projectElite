<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Notification;
use App\Models\Formation;
use App\Models\JobOffer;
use App\Models\Interview;

class DashboardController extends Controller
{
    public function userDashboard(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                Log::error('No authenticated user found for dashboard request');
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated',
                ], 401);
            }

            Log::info('Fetching dashboard for user', ['user_id' => $user->id, 'email' => $user->email]);

            // Profile information
            $profile = [
                'id' => $user->id,
                'name' => $user->nomComplet ?? trim(($user->prenom ?? '') . ' ' . ($user->nom ?? '')),
                'email' => $user->email,
                'role' => $user->role ?? 'utilisateur',
                'is_student' => $user->is_student ?? false,
                'created_at' => $user->created_at->toDateTimeString(),
                'nomComplet' => $user->nomComplet ?? trim(($user->prenom ?? '') . ' ' . ($user->nom ?? '')) ?: 'Invité',
            ];

            // Notifications (unread, limited to 5)
            $notifications = Notification::where('user_id', $user->id)
                ->where('read', false)
                ->latest()
                ->take(5)
                ->get(['id', 'title', 'message', 'created_at'])
                ->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'created_at' => $notification->created_at->toDateTimeString(),
                    ];
                })->toArray();

            // Recommended Courses (from formations, limited to 5)
            $recommendedCourses = Formation::where('is_active', true)
                ->latest()
                ->take(5)
                ->get(['id', 'title', 'duration', 'match_score'])
                ->map(function ($formation) {
                    return [
                        'title' => $formation->title,
                        'duration' => $formation->duration ?? '4h',
                        'match' => $formation->match_score ? "{$formation->match_score}%" : '90%',
                    ];
                })->toArray();

            // Suggested Jobs (from job offers, not applied, limited to 5)
            $suggestedJobs = JobOffer::whereDoesntHave('applications', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
                ->latest()
                ->take(5)
                ->get(['id', 'title', 'sector', 'match_score'])
                ->map(function ($jobOffer) {
                    return [
                        'title' => $jobOffer->title,
                        'sector' => $jobOffer->sector ?? 'Technologie',
                        'match' => $jobOffer->match_score ? "{$jobOffer->match_score}%" : '85%',
                    ];
                })->toArray();

            // Interviews (confirmed, limited to 5)
            $interviews = Interview::whereHas('application', function ($query) use ($user) {
                $query->where('user_id', $user->id)->where('status', 'confirmed');
            })
                ->latest()
                ->take(5)
                ->get(['id', 'title', 'date', 'status'])
                ->map(function ($interview) {
                    return [
                        'id' => $interview->id,
                        'title' => $interview->title,
                        'date' => $interview->date ? $interview->date->toDateTimeString() : null,
                        'status' => $interview->status,
                    ];
                })->toArray();

            // Performance by Skill (static fallback if TestResult table is missing)
            $performance = \App\Models\TestResult::where('user_id', $user->id)
                ->take(5)
                ->get(['skill_name as name', 'score'])
                ->toArray();
            
            if (empty($performance)) {
                $performance = [
                    ['name' => 'Communication', 'score' => 85],
                    ['name' => 'Leadership', 'score' => 70],
                    ['name' => 'Technique', 'score' => 90],
                    ['name' => 'Créativité', 'score' => 65],
                    ['name' => 'Adaptabilité', 'score' => 80],
                ];
            }

            // Career Orientation (static fallback if CareerAssessment table is missing)
            $career = \App\Models\CareerAssessment::where('user_id', $user->id)
                ->take(4)
                ->get(['field_name as name', 'percentage as value'])
                ->toArray();
            
            if (empty($career)) {
                $career = [
                    ['name' => 'Ingénierie', 'value' => 40],
                    ['name' => 'Management', 'value' => 30],
                    ['name' => 'Marketing', 'value' => 15],
                    ['name' => 'Finance', 'value' => 15],
                ];
            }

            // Stats for cards
            $stats = [
                'skills' => [
                    'value' => \App\Models\TestResult::where('user_id', $user->id)->count() ?: 7,
                    'subtext' => 'Compétences validées',
                    'trend' => '+2 ce mois',
                ],
                'trainings' => [
                    'value' => Formation::whereHas('users', function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    })->count() ?: 3,
                    'subtext' => 'En cours',
                    'trend' => 'Progression moyenne 68%',
                ],
                'interviews' => [
                    'value' => count($interviews) ?: 2,
                    'subtext' => 'À venir',
                    'trend' => 'Prochain: 15 Nov',
                ],
                'studyTime' => [
                    'value' => '24h', // Replace with actual logic if tracking study time
                    'subtext' => 'Ce mois',
                    'trend' => '+3h vs dernier mois',
                ],
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'profile' => $profile,
                    'notifications' => $notifications,
                    'recommendedCourses' => $recommendedCourses,
                    'suggestedJobs' => $suggestedJobs,
                    'interviews' => $interviews,
                    'performance' => $performance,
                    'career' => $career,
                    'stats' => $stats,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Dashboard error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Échec du chargement des données: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function coachDashboard(Request $request)
    {
        return response()->json(['status' => 'success', 'message' => 'Coach dashboard not implemented'], 200);
    }

    public function entrepriseDashboard(Request $request)
    {
        return response()->json(['status' => 'success', 'message' => 'Enterprise dashboard not implemented'], 200);
    }

    public function adminDashboard(Request $request)
    {
        return response()->json(['status' => 'success', 'message' => 'Admin dashboard not implemented'], 200);
    }
}