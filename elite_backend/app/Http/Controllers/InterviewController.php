<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class InterviewController extends Controller
{
    /**
     * Récupère les entretiens pour l'utilisateur authentifié.
     * - Admin : tous les entretiens.
     * - Entreprise : uniquement leurs propres entretiens.
     * - Autres : uniquement les entretiens confirmés.
     */
    public function indexForUser()
    {
        $user = Auth::user();
        Log::info("indexForUser called: user_id={$user->id}, role={$user->role}");
        if ($user->role === 'admin') {
            $interviews = Interview::all();
            Log::info("Returning all interviews for admin: count=" . $interviews->count());
            return response()->json($interviews);
        }
        if ($user->role === 'entreprise') {
            $interviews = Interview::where('user_id', $user->id)->get();
            Log::info("Returning owned interviews for entreprise user_id={$user->id}: count=" . $interviews->count());
            return response()->json($interviews);
        }
        // Pour utilisateur ou coach, uniquement les entretiens confirmés
        $interviews = Interview::where('status', 'confirmed')->get();
        Log::info("Returning confirmed interviews for role={$user->role}: count=" . $interviews->count());
        return response()->json($interviews);
    }

    /**
     * Récupère tous les entretiens (pour admin uniquement, utilisé avec /all-interviews).
     */
    public function allInterviews()
    {
        $user = Auth::user();
        Log::info("allInterviews called: user_id={$user->id}, role={$user->role}");
        if ($user->role !== 'admin') {
            Log::warning("Unauthorized access to allInterviews: user_id={$user->id}, role={$user->role}");
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $interviews = Interview::all();
        Log::info("Returning all interviews: count=" . $interviews->count());
        return response()->json($interviews);
    }

    /**
     * Crée un nouvel entretien.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'date' => 'required|date|after:now',
            'target_audience' => 'required|string',
        ]);

        $user = Auth::user();
        Log::info("Creating interview for user_id={$user->id}, role={$user->role}, title={$validated['title']}");

        $interview = Interview::create([
            'user_id' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'date' => $validated['date'],
            'target_audience' => $validated['target_audience'],
            'status' => $user->role === 'admin' ? 'confirmed' : 'pending',
        ]);

        Log::info("Interview created: id={$interview->id}, title={$interview->title}, status={$interview->status}");

        if ($user->role === 'entreprise') {
            $admin = User::where('role', 'admin')->first();
            if ($admin) {
                Notification::create([
                    'title' => 'Nouvel entretien en attente',
                    'message' => "L'entreprise {$user->nomComplet} a créé un entretien intitulé '{$interview->title}' qui attend votre confirmation.",
                    'recipient_id' => $admin->id,
                ]);
                Log::info("Notification created for admin_id={$admin->id}, interview_id={$interview->id}");
            } else {
                Log::warning("No admin found for notification, interview_id={$interview->id}");
            }
        }

        return response()->json($interview, 201);
    }

    /**
     * Permet à un utilisateur de postuler à un entretien.
     */
    public function apply($id)
    {
        $user = Auth::user();
        Log::info("Apply attempt: user_id={$user->id}, role={$user->role}, interview_id={$id}");

        if ($user->role === 'admin' || $user->role === 'entreprise') {
            Log::warning("Apply attempt by unauthorized role: user_id={$user->id}, role={$user->role}");
            return response()->json(['error' => 'Seuls les candidats peuvent postuler'], 403);
        }

        try {
            $interview = Interview::where('status', 'confirmed')->findOrFail($id);
            if ($interview->candidates()->where('user_id', $user->id)->exists()) {
                Log::warning("User already applied: user_id={$user->id}, interview_id={$id}");
                return response()->json(['message' => 'Vous avez déjà postulé à cet entretien'], 400);
            }

            $interview->candidates()->attach($user->id, ['applied_at' => now()]);
            Log::info("Candidate attached: user_id={$user->id}, interview_id={$id}, applied_at=" . now()->toDateTimeString());

            Notification::create([
                'title' => 'Nouvelle candidature',
                'message' => "L'utilisateur {$user->nomComplet} a postulé à votre entretien '{$interview->title}'.",
                'recipient_id' => $interview->user_id,
            ]);
            Log::info("Notification created for owner_id={$interview->user_id}, interview_id={$id}");

            return response()->json(['message' => 'Candidature envoyée avec succès'], 200);
        } catch (\Exception $e) {
            Log::error("Apply failed: interview_id={$id}, error={$e->getMessage()}");
            return response()->json(['message' => 'Entretien non trouvé ou non confirmé'], 404);
        }
    }

    /**
     * Récupère les candidats pour un entretien spécifique.
     */
    public function getCandidates($id)
    {
        $user = Auth::user();
        Log::info("getCandidates called: user_id={$user->id}, role={$user->role}, interview_id={$id}");

        if (!$user) {
            Log::warning("getCandidates: No authenticated user");
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if (!in_array($user->role, ['admin', 'entreprise'])) {
            Log::warning("getCandidates: Unauthorized role={$user->role}");
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        try {
            $interview = Interview::findOrFail($id);
            if ($user->role === 'entreprise' && $interview->user_id !== $user->id) {
                Log::warning("getCandidates: Entreprise user_id={$user->id} does not own interview_id={$id}, owner_id={$interview->user_id}");
                return response()->json(['message' => 'Non autorisé à accéder aux candidats de cet entretien'], 403);
            }

            $candidates = $interview->candidates()->get(['id', 'nomComplet', 'email']);
            Log::info("getCandidates: Returning candidates for interview_id={$id}, count=" . $candidates->count());
            return response()->json($candidates);
        } catch (\Exception $e) {
            Log::error("getCandidates: Interview not found, id={$id}, error={$e->getMessage()}");
            return response()->json(['message' => 'Entretien non trouvé'], 404);
        }
    }

    /**
     * Confirme un entretien (admin uniquement).
     */
    public function confirm($id)
    {
        $user = Auth::user();
        Log::info("Confirm attempt: user_id={$user->id}, role={$user->role}, interview_id={$id}");

        if ($user->role !== 'admin') {
            Log::warning("Confirm attempt by non-admin: user_id={$user->id}, role={$user->role}");
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        try {
            $interview = Interview::findOrFail($id);
            if ($interview->status === 'confirmed') {
                Log::warning("Interview already confirmed: id={$id}, title={$interview->title}");
                return response()->json(['message' => 'Entretien déjà confirmé'], 400);
            }

            $interview->status = 'confirmed';
            $interview->save();
            Log::info("Interview confirmed: id={$id}, title={$interview->title}");

            Notification::create([
                'title' => 'Entretien confirmé',
                'message' => "Votre entretien '{$interview->title}' a été confirmé par l'administrateur.",
                'recipient_id' => $interview->user_id,
            ]);
            Log::info("Notification created for owner_id={$interview->user_id}, interview_id={$id}");

            return response()->json(['message' => 'Entretien confirmé avec succès']);
        } catch (\Exception $e) {
            Log::error("Confirm failed: interview_id={$id}, error={$e->getMessage()}");
            return response()->json(['message' => 'Entretien non trouvé'], 404);
        }
    }
}