<?php

namespace App\Http\Controllers;

use App\Models\Formation;
use App\Models\UserPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class FormationController extends Controller
{
    public function index()
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        $formations = Formation::all();
        Log::info("index called: user_id=" . Auth::id() . ", formations_count=" . $formations->count());
        return response()->json($formations);
    }

    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        Log::info("store called: user_id=" . Auth::id());
        Log::info('Request headers:', $request->headers->all());
        Log::info('Request data:', ['all' => $request->all(), 'files' => $request->files->all()]);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'duration' => 'required|string|max:50',
            'level' => 'required|string|max:50',
            'category' => 'required|string|max:100',
            'instructor' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'target_audience' => 'required|string|max:100',
            'students' => 'nullable|integer|min:0',
            'rating' => 'nullable|numeric|between:0,5',
            'image' => 'nullable|image|max:2048',
            'video' => 'nullable|file|mimetypes:video/mp4,video/avi|max:102400',
            'link' => 'nullable|url',
            'points' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            Log::error('Validation error in store: ' . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();

        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            $path = $request->file('image')->store('formations', 'public');
            $data['image'] = '/storage/' . $path;
            Log::info('Image stored at: ' . $data['image']);
        }

        if ($request->hasFile('video') && $request->file('video')->isValid()) {
            $path = $request->file('video')->store('videos', 'public');
            $data['video'] = '/storage/' . $path;
            Log::info('Video stored at: ' . $data['video']);
        }

        $formation = Formation::create($data);
        Log::info("Formation created: id={$formation->id}, title={$formation->title}");

        return response()->json(['message' => 'Formation créée avec succès', 'formation' => $formation], 201);
    }

    public function update(Request $request, $id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        Log::info("update called: formation_id={$id}, user_id=" . Auth::id());
        Log::info('Request headers:', $request->headers->all());
        Log::info('Request data:', ['all' => $request->all(), 'files' => $request->files->all()]);
        Log::info('Raw input:', ['input' => file_get_contents('php://input')]);

        $formation = Formation::findOrFail($id);

        Log::info('Parsed input:', [
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'duration' => $request->input('duration'),
            'level' => $request->input('level'),
            'category' => $request->input('category'),
            'instructor' => $request->input('instructor'),
            'price' => $request->input('price'),
            'target_audience' => $request->input('target_audience'),
            'students' => $request->input('students'),
            'rating' => $request->input('rating'),
            'link' => $request->input('link'),
            'points' => $request->input('points'),
            'has_image' => $request->hasFile('image'),
            'has_video' => $request->hasFile('video'),
        ]);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'duration' => 'required|string|max:50',
            'level' => 'required|string|max:50',
            'category' => 'required|string|max:100',
            'instructor' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'target_audience' => 'required|string|max:100',
            'students' => 'nullable|integer|min:0',
            'rating' => 'nullable|numeric|between:0,5',
            'image' => 'nullable|image|max:2048',
            'video' => 'nullable|file|mimetypes:video/mp4,video/avi|max:102400',
            'link' => 'nullable|url',
            'points' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            Log::error('Validation error in update: ' . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();

        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            if ($formation->image) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $formation->image));
                Log::info('Deleted old image: ' . $formation->image);
            }
            $path = $request->file('image')->store('formations', 'public');
            $data['image'] = '/storage/' . $path;
            Log::info('Image updated at: ' . $data['image']);
        }

        if ($request->hasFile('video') && $request->file('video')->isValid()) {
            if ($formation->video) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $formation->video));
                Log::info('Deleted old video: ' . $formation->video);
            }
            $path = $request->file('video')->store('videos', 'public');
            $data['video'] = '/storage/' . $path;
            Log::info('Video updated at: ' . $data['video']);
        }

        $formation->update($data);
        Log::info("Formation updated: id={$formation->id}, title={$formation->title}");

        return response()->json(['message' => 'Formation mise à jour avec succès', 'formation' => $formation]);
    }

    public function destroy($id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $formation = Formation::findOrFail($id);
        if ($formation->image) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $formation->image));
            Log::info('Deleted image: ' . $formation->image);
        }
        if ($formation->video) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $formation->video));
            Log::info('Deleted video: ' . $formation->video);
        }
        $formation->delete();
        Log::info("Formation deleted: id={$id}");
        return response()->json(['message' => 'Formation supprimée avec succès']);
    }

    public function getFormations()
    {
        $user = Auth::user();
        Log::info("getFormations called: user_id=" . ($user ? $user->id : 'none'));
        $query = Formation::query();

        if ($user->role !== 'admin') {
            $query->where('target_audience', $user->target_audience);
        }

        $formations = $query->get();

        $formations->each(function ($formation) use ($user) {
            $formation->has_access = $user ? $user->hasAccessToFormation($formation->id) : false;
            $formation->is_completed = $user ? $formation->completedBy()->where('user_id', $user->id)->exists() : false;
        });

        return response()->json($formations);
    }

    public function initiatePayment(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Utilisateur non authentifié'], 401);
        }

        Log::info("initiatePayment called: user_id={$user->id}, input=" . json_encode($request->all()));

        $validator = Validator::make($request->all(), [
            'formation_id' => 'nullable|exists:formations,id',
            'is_global' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            Log::error('Validation error in initiatePayment: ' . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $isGlobal = $request->is_global;
        $formationId = $request->formation_id;

        if ($isGlobal) {
            $amount = 99.99;
        } else {
            $formation = Formation::findOrFail($formationId);
            $amount = $formation->price;
        }

        $payment = UserPayment::create([
            'user_id' => $user->id,
            'formation_id' => $isGlobal ? null : $formationId,
            'amount' => $amount,
            'is_global_subscription' => $isGlobal,
            'paid_at' => now(),
        ]);

        Log::info("Payment created: payment_id={$payment->id}, amount={$amount}, is_global={$isGlobal}");

        return response()->json(['message' => 'Paiement effectué avec succès', 'payment' => $payment]);
    }

    public function checkAccess($formationId)
    {
        $user = Auth::user();
        if (!$user) {
            Log::warning("checkAccess called: no authenticated user, formation_id={$formationId}");
            return response()->json(['access' => false], 401);
        }

        Log::info("checkAccess called: user_id={$user->id}, formation_id={$formationId}");
        $hasAccess = $user->hasAccessToFormation($formationId);
        return response()->json(['access' => $hasAccess]);
    }

    public function completeFormation(Request $request, $formationId)
    {
        $user = Auth::user();
        $formation = Formation::findOrFail($formationId);

        Log::info("completeFormation called: user_id={$user->id}, formation_id={$formationId}");

        if (!$user->hasAccessToFormation($formationId)) {
            Log::warning("completeFormation failed: user_id={$user->id} lacks access to formation_id={$formationId}");
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        if ($formation->completedBy()->where('user_id', $user->id)->exists()) {
            Log::info("completeFormation: formation_id={$formationId} already completed by user_id={$user->id}");
            return response()->json(['message' => 'Formation déjà complétée'], 400);
        }

        $formation->completedBy()->attach($user->id, ['completed_at' => now()]);
        $user->addPoints($formation->points);

        Log::info("Formation completed: formation_id={$formationId}, user_id={$user->id}, points_earned={$formation->points}");

        return response()->json([
            'message' => 'Formation complétée avec succès',
            'points_earned' => $formation->points,
            'total_points' => $user->points,
        ]);
    }
}