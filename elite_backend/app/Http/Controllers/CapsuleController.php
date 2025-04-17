<?php

namespace App\Http\Controllers;

use App\Models\Capsule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CapsuleController extends Controller
{
    /**
     * Liste les capsules pour les utilisateurs non-admin.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        Log::info("index called: user_id={$user->id}, role={$user->role}, target_audience={$user->target_audience}");
        $sortDirection = $request->query('sort', 'desc');
        try {
            $capsules = Capsule::where('target_audience', $user->target_audience)
                ->orderBy('created_at', $sortDirection)
                ->get();
            Log::info("Returning capsules: count=" . $capsules->count());
            return response()->json($capsules);
        } catch (\Exception $e) {
            Log::error("index failed: error={$e->getMessage()}");
            return response()->json(['message' => 'Erreur lors de la récupération des capsules'], 500);
        }
    }

    /**
     * Liste toutes les capsules pour les admins.
     */
    public function adminIndex(Request $request)
    {
        $user = Auth::user();
        Log::info("adminIndex called: user_id={$user->id}, role={$user->role}");
        $sortDirection = $request->query('sort', 'desc');
        try {
            $capsules = Capsule::with('user')
                ->orderBy('created_at', $sortDirection)
                ->get();
            Log::info("Returning all capsules: count=" . $capsules->count());
            return response()->json($capsules);
        } catch (\Exception $e) {
            Log::error("adminIndex failed: error={$e->getMessage()}");
            return response()->json(['message' => 'Erreur lors de la récupération des capsules'], 500);
        }
    }

    /**
     * Crée une nouvelle capsule.
     */
    public function store(Request $request)
    {
        Log::info("store called: user_id=" . Auth::id());
        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'duration' => 'required|string|max:255',
                'target_audience' => 'required|string|in:etudiant_maroc,etudiant_etranger,entrepreneur,salarie_etat,salarie_prive',
                'video' => 'required|file|mimetypes:video/mp4|max:102400',
            ]);

            Log::info('Validated data:', $data);
            Log::info('Files received:', $request->files->all());

            if ($request->hasFile('video') && $request->file('video')->isValid()) {
                $file = $request->file('video');
                $path = $file->store('capsules', 'public');
                $data['video'] = '/storage/' . $path;
                Log::info('Video stored at: ' . $data['video']);
            } else {
                Log::warning('No valid video file provided');
                throw ValidationException::withMessages(['video' => 'Fichier vidéo invalide']);
            }

            $data['user_id'] = Auth::id();
            $capsule = Capsule::create($data);
            Log::info("Capsule created: id={$capsule->id}, title={$capsule->title}");

            return response()->json(['message' => 'Capsule créée avec succès', 'capsule' => $capsule], 201);
        } catch (ValidationException $e) {
            Log::error('Validation error in store: ' . json_encode($e->errors()));
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Unexpected error in store: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur interne', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Met à jour une capsule existante.
     */
    public function update(Request $request, $id)
    {
        Log::info("update called: capsule_id={$id}, user_id=" . Auth::id());
        Log::info('Request headers:', $request->headers->all());
        Log::info('Request data:', ['all' => $request->all(), 'files' => $request->files->all()]);
        Log::info('Raw input:', ['input' => file_get_contents('php://input')]);

        try {
            $capsule = Capsule::findOrFail($id);

            // Log parsed input fields for debugging
            Log::info('Parsed input:', [
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'duration' => $request->input('duration'),
                'target_audience' => $request->input('target_audience'),
                'has_file' => $request->hasFile('video'),
            ]);

            $data = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'duration' => 'required|string|max:255',
                'target_audience' => 'required|string|in:etudiant_maroc,etudiant_etranger,entrepreneur,salarie_etat,salarie_prive',
                'video' => 'nullable|file|mimetypes:video/mp4|max:102400',
            ]);

            Log::info('Validated data:', $data);

            if ($request->hasFile('video') && $request->file('video')->isValid()) {
                if ($capsule->video) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $capsule->video));
                    Log::info('Deleted old video: ' . $capsule->video);
                }
                $file = $request->file('video');
                $path = $file->store('capsules', 'public');
                $data['video'] = '/storage/' . $path;
                Log::info('Video updated at: ' . $data['video']);
            }

            $capsule->update($data);
            Log::info("Capsule updated: id={$capsule->id}, title={$capsule->title}");

            return response()->json(['message' => 'Capsule mise à jour avec succès', 'capsule' => $capsule]);
        } catch (ValidationException $e) {
            Log::error('Validation error in update: ' . json_encode($e->errors()));
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Unexpected error in update: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur interne', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Supprime une capsule.
     */
    public function destroy($id)
    {
        Log::info("destroy called: capsule_id={$id}, user_id=" . Auth::id());
        try {
            $capsule = Capsule::findOrFail($id);
            if ($capsule->video) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $capsule->video));
                Log::info('Deleted video: ' . $capsule->video);
            }
            $capsule->delete();
            Log::info("Capsule deleted: id={$id}");
            return response()->json(['message' => 'Capsule supprimée avec succès']);
        } catch (\Exception $e) {
            Log::error('Error in destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur serveur interne', 'error' => $e->getMessage()], 500);
        }
    }
}