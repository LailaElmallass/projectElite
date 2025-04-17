<?php

namespace App\Http\Controllers;

use App\Models\JobOffer;
use App\Models\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class JobOfferController extends Controller
{
    public function index()
    {
        try {
            $user = Auth::user();
            Log::info("JobOffer index called: user_id=" . ($user ? $user->id : 'none'));

            if ($user && $user->role === 'admin') {
                $jobOffers = JobOffer::with('user')->get();
            } elseif ($user && $user->role === 'entreprise') {
                $jobOffers = JobOffer::where('user_id', $user->id)->with('user')->get();
            } else {
                $jobOffers = JobOffer::with('user')->get();
                if ($user) {
                    $jobOffers->each(function ($offer) use ($user) {
                        $offer->has_applied = $offer->appliedBy()->where('user_id', $user->id)->exists();
                    });
                }
            }

            return response()->json($jobOffers);
        } catch (\Exception $e) {
            Log::error("Error in JobOffer index: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || !in_array($user->role, ['admin', 'entreprise'])) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'requirements' => 'required|string',
                'location' => 'required|string|max:255',
                'salary_range' => 'nullable|string|max:255',
                'contract_type' => 'nullable|string|max:255',
                'closing_date' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $jobOffer = JobOffer::create([
                'user_id' => $user->id,
                'title' => $request->title,
                'description' => $request->description,
                'requirements' => $request->requirements,
                'location' => $request->location,
                'salary_range' => $request->salary_range,
                'contract_type' => $request->contract_type,
                'closing_date' => $request->closing_date,
            ]);

            Log::info("JobOffer created: id={$jobOffer->id}, title={$jobOffer->title}");
            return response()->json($jobOffer, 201);
        } catch (\Exception $e) {
            Log::error("Error in JobOffer store: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function update(Request $request, JobOffer $jobOffer)
    {
        try {
            $user = Auth::user();
            if (!$user || ($user->role !== 'admin' && $jobOffer->user_id !== $user->id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'requirements' => 'required|string',
                'location' => 'required|string|max:255',
                'salary_range' => 'nullable|string|max:255',
                'contract_type' => 'nullable|string|max:255',
                'closing_date' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $jobOffer->update($request->only([
                'title', 'description', 'requirements', 'location',
                'salary_range', 'contract_type', 'closing_date',
            ]));

            Log::info("JobOffer updated: id={$jobOffer->id}, title={$jobOffer->title}");
            return response()->json($jobOffer);
        } catch (\Exception $e) {
            Log::error("Error in JobOffer update: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function destroy(JobOffer $jobOffer)
    {
        try {
            $user = Auth::user();
            if (!$user || ($user->role !== 'admin' && $jobOffer->user_id !== $user->id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $jobOffer->delete();
            Log::info("JobOffer deleted: id={$jobOffer->id}");
            return response()->json(['message' => 'Job offer deleted successfully']);
        } catch (\Exception $e) {
            Log::error("Error in JobOffer destroy: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function apply(Request $request, JobOffer $jobOffer)
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role !== 'utilisateur') {
                Log::warning("Tentative non autorisée : user_id=" . ($user ? $user->id : 'aucun') . ", role=" . ($user ? $user->role : 'aucun'));
                return response()->json(['error' => 'Non autorisé'], 403);
            }

            $validator = Validator::make($request->all(), [
                'cover_letter' => 'nullable|string',
                'cv' => 'required|file|mimes:pdf,doc,docx|max:2048',
            ]);

            if ($validator->fails()) {
                Log::error("Échec de la validation pour la candidature : job_offer_id={$jobOffer->id}, user_id={$user->id}, erreurs=" . json_encode($validator->errors()));
                return response()->json(['errors' => $validator->errors()], 422);
            }

            if ($jobOffer->appliedBy()->where('user_id', $user->id)->exists()) {
                Log::info("Tentative de candidature en doublon : job_offer_id={$jobOffer->id}, user_id={$user->id}");
                return response()->json(['error' => 'Vous avez déjà postulé à cette offre'], 400);
            }

            $storagePath = storage_path('app/public/cvs');
            if (!is_dir($storagePath)) {
                Log::warning("Répertoire de stockage manquant, création : {$storagePath}");
                mkdir($storagePath, 0755, true);
            }

            try {
                $cvPath = $request->file('cv')->store('cvs', 'public');
                Log::info("CV stocké : chemin={$cvPath}");
            } catch (\Exception $e) {
                Log::error("Échec du stockage du CV : job_offer_id={$jobOffer->id}, user_id={$user->id}, erreur=" . $e->getMessage());
                return response()->json(['error' => 'Échec de l\'enregistrement du CV'], 500);
            }

            $application = JobApplication::create([
                'user_id' => $user->id,
                'job_offer_id' => $jobOffer->id,
                'cover_letter' => $request->input('cover_letter'),
                'cv_path' => $cvPath,
                'status' => 'pending',
            ]);

            Log::info("Candidature créée : id={$application->id}, job_offer_id={$jobOffer->id}, user_id={$user->id}");
            return response()->json(['message' => 'Candidature envoyée avec succès'], 201);
        } catch (\Exception $e) {
            Log::error("Erreur dans JobOffer apply : job_offer_id={$jobOffer->id}, user_id=" . ($user ? $user->id : 'aucun') . ", erreur=" . $e->getMessage());
            return response()->json(['error' => 'Erreur interne du serveur'], 500);
        }
    }

    public function applications(JobOffer $jobOffer)
    {
        try {
            $user = Auth::user();
            if (!$user || ($user->role !== 'admin' && $jobOffer->user_id !== $user->id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $applications = $jobOffer->applications()->with('user')->get();
            return response()->json($applications);
        } catch (\Exception $e) {
            Log::error("Error in JobOffer applications: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }
}