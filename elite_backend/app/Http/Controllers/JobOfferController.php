<?php

namespace App\Http\Controllers;

use App\Models\JobOffer;
use App\Models\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;

class JobOfferController extends Controller
{
    public function index()
    {
        try {
            $user = Auth::user();
            Log::info('JobOffer index called', ['user_id' => $user?->id]);

            $query = JobOffer::with('user');

            if ($user && $user->role === 'entreprise') {
                $query->where('user_id', $user->id);
            }

            $jobOffers = $query->get();

            if ($user && $user->role === 'utilisateur') {
                $jobOffers->each(function ($offer) use ($user) {
                    $offer->has_applied = $offer->appliedBy()->where('user_id', $user->id)->exists();
                });
            }

            return response()->json($jobOffers);
        } catch (\Exception $e) {
            Log::error('Error in JobOffer index', ['error' => $e->getMessage()]);
            return response()->json(['error' => __('errors.server_error')], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || !in_array($user->role, ['admin', 'entreprise'])) {
                Log::warning('Unauthorized store attempt', ['user_id' => $user?->id]);
                return response()->json(['error' => __('errors.unauthorized')], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'requirements' => 'required|string',
                'location' => 'required|string|max:255',
                'salary_range' => 'nullable|string|max:255',
                'contract_type' => 'nullable|string|max:255',
                'closing_date' => 'nullable|date|after:today',
            ], [
                'closing_date.after' => __('errors.closing_date_future'),
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

            Log::info('JobOffer created', ['id' => $jobOffer->id, 'title' => $jobOffer->title]);
            return response()->json($jobOffer, 201);
        } catch (\Exception $e) {
            Log::error('Error in JobOffer store', ['error' => $e->getMessage()]);
            return response()->json(['error' => __('errors.server_error')], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $jobOffer = JobOffer::findOrFail($id);
            $user = Auth::user();

            if (!$user || ($user->role !== 'admin' && $jobOffer->user_id !== $user->id)) {
                Log::warning('Unauthorized update attempt', ['user_id' => $user?->id, 'job_offer_id' => $id]);
                return response()->json(['error' => __('errors.unauthorized')], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'requirements' => 'required|string',
                'location' => 'required|string|max:255',
                'salary_range' => 'nullable|string|max:255',
                'contract_type' => 'nullable|string|max:255',
                'closing_date' => 'nullable|date|after:today',
            ], [
                'closing_date.after' => __('errors.closing_date_future'),
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $jobOffer->update([
                'title' => $request->title,
                'description' => $request->description,
                'requirements' => $request->requirements,
                'location' => $request->location,
                'salary_range' => $request->salary_range,
                'contract_type' => $request->contract_type,
                'closing_date' => $request->closing_date,
            ]);

            Log::info('JobOffer updated', ['id' => $jobOffer->id, 'title' => $jobOffer->title]);
            return response()->json($jobOffer);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('JobOffer not found', ['id' => $id]);
            return response()->json(['error' => __('errors.job_offer_not_found')], 404);
        } catch (\Exception $e) {
            Log::error('Error in JobOffer update', ['error' => $e->getMessage()]);
            return response()->json(['error' => __('errors.server_error')], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $jobOffer = JobOffer::findOrFail($id);
            $user = Auth::user();

            if (!$user || ($user->role !== 'admin' && $jobOffer->user_id !== $user->id)) {
                Log::warning('Unauthorized delete attempt', ['user_id' => $user?->id, 'job_offer_id' => $id]);
                return response()->json(['error' => __('errors.unauthorized')], 403);
            }

            $jobOffer->delete();
            Log::info('JobOffer deleted', ['id' => $id]);
            return response()->json(['message' => __('job_offer.deleted')]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('JobOffer not found', ['id' => $id]);
            return response()->json(['error' => __('errors.job_offer_not_found')], 404);
        } catch (\Exception $e) {
            Log::error('Error in JobOffer destroy', ['error' => $e->getMessage()]);
            return response()->json(['error' => __('errors.server_error')], 500);
        }
    }

    public function apply(Request $request, $id)
    {
        try {
            $jobOffer = JobOffer::findOrFail($id);
            $user = Auth::user();

            if (!$user || $user->role !== 'utilisateur') {
                Log::warning('Tentative de candidature non autorisée', ['user_id' => $user?->id, 'job_offer_id' => $id]);
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            if ($jobOffer->applications()->where('user_id', $user->id)->exists()) {
                return response()->json(['error' => 'Vous avez déjà postulé à cette offre'], 400);
            }

            $validator = Validator::make($request->all(), [
                'cover_letter' => 'nullable|string|max:5000',
                'cv' => 'required|file|mimes:pdf|max:2048',
            ], [
                'cv.required' => 'Un CV est requis.',
                'cv.file' => 'Le CV doit être un fichier valide.',
                'cv.mimes' => 'Le CV doit être un fichier PDF.',
                'cv.max' => 'Le CV ne doit pas dépasser 2 Mo.',
            ]);

            if ($validator->fails()) {
                Log::info('Échec de la validation du CV', ['errors' => $validator->errors()->toArray()]);
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $cvPath = $request->file('cv')->store('cvs', 'public');
            Log::info('CV stocké', ['path' => $cvPath, 'user_id' => $user->id, 'job_offer_id' => $id]);

            $application = $jobOffer->applications()->create([
                'user_id' => $user->id,
                'cover_letter' => $request->cover_letter,
                'cv_path' => $cvPath,
                'status' => 'pending',
            ]);

            return response()->json(['message' => 'Candidature soumise avec succès', 'application_id' => $application->id], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Offre d\'emploi non trouvée', ['id' => $id]);
            return response()->json(['error' => 'Offre d\'emploi non trouvée'], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la soumission de la candidature', [
                'job_offer_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    public function applications($id)
    {
        try {
            $jobOffer = JobOffer::findOrFail($id);
            $user = Auth::user();

            if (!$user || ($user->role !== 'admin' && $jobOffer->user_id !== $user->id)) {
                Log::warning('Tentative d\'accès non autorisée aux candidatures', ['user_id' => $user?->id, 'job_offer_id' => $id]);
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            $applications = $jobOffer->applications()
                ->with(['user' => function ($query) {
                    $query->select('id', 'nom', 'prenom', 'email', 'numero_de_telephone');
                }])
                ->get()
                ->map(function ($application) {
                    $cvUrl = $application->cv_path && Storage::disk('public')->exists($application->cv_path)
                        ? Storage::url($application->cv_path)
                        : null;
                    if (!$cvUrl && $application->cv_path) {
                        Log::warning('Fichier CV introuvable', ['cv_path' => $application->cv_path]);
                    }
                    return [
                        'id' => $application->id,
                        'user' => [
                            'id' => $application->user->id,
                            'nom_complet' => $application->user->nom . ' ' . $application->user->prenom,
                            'email' => $application->user->email,
                            'telephone' => $application->user->numero_de_telephone,
                        ],
                        'cover_letter' => $application->cover_letter,
                        'cv_url' => $cvUrl,
                        'status' => $application->status,
                        'created_at' => $application->created_at->format('d/m/Y H:i'),
                    ];
                });

            return response()->json($applications);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Offre d\'emploi non trouvée', ['id' => $id]);
            return response()->json(['error' => 'Offre d\'emploi non trouvée'], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des candidatures', [
                'job_offer_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    public function updateStatus(Request $request, $applicationId)
    {
        try {
            $application = JobApplication::findOrFail($applicationId);
            $jobOffer = $application->jobOffer;
            $user = Auth::user();

            if (!$user || ($user->role !== 'admin' && $jobOffer->user_id !== $user->id)) {
                Log::warning('Tentative d\'accès non autorisée pour mise à jour du statut', [
                    'user_id' => $user?->id,
                    'application_id' => $applicationId,
                ]);
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:pending,accepted,rejected',
            ], [
                'status.required' => 'Le statut est requis.',
                'status.in' => 'Le statut doit être en attente, accepté ou rejeté.',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $application->update(['status' => $request->status]);
            Log::info('Statut de la candidature mis à jour', [
                'application_id' => $applicationId,
                'new_status' => $request->status,
            ]);

            return response()->json(['message' => 'Statut mis à jour avec succès']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Candidature non trouvée', ['application_id' => $applicationId]);
            return response()->json(['error' => 'Candidature non trouvée'], 404);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour du statut', [
                'application_id' => $applicationId,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    
}