<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class ProfileController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function show(Request $request)
    {
        $user = $request->user();
        $data = [
            'id' => $user->id,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'nomComplet' => $user->nomComplet,
            'email' => $user->email,
            'numero_de_telephone' => $user->numero_de_telephone,
            'ville' => $user->ville,
            'image' => $user->image,
            'role' => $user->role,
            'is_first_time' => $user->is_first_time,
            'is_student' => $user->is_student,
            'target_audience' => $user->target_audience,
        ];

        if ($user->role === 'entreprise') {
            $data = array_merge($data, [
                'company_name' => $user->company_name,
                'industry' => $user->industry,
                'logo' => $user->logo,
                'software_technologies' => $user->software_technologies,
                'address' => $user->address,
                'cef' => $user->cef,
                'creation_date' => $user->creation_date ? $user->creation_date->format('Y-m-d') : null,
                'required_skills' => $user->required_skills,
                'programming_language' => $user->programming_language,
                'age_range' => $user->age_range,
                'required_diplomas' => $user->required_diplomas,
            ]);
        }

        return response()->json($data);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        // Valider les données
        $validated = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'address' => 'sometimes|string|max:255',
            'numero_de_telephone' => 'sometimes|string|max:20',
            'cef' => 'nullable|string|max:50',
            'creation_date' => 'nullable|date',
            'software_technologies' => 'nullable|string|max:255',
            'required_skills' => 'nullable|string|max:255',
            'programming_languages' => 'nullable|array',
            'programming_languages.*' => 'string|in:PHP,JavaScript,Python,Java,C#',
            'age_range' => 'nullable|string|max:50',
            'required_diplomas' => 'nullable|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        // Gérer le fichier logo
        if ($request->hasFile('logo')) {
            if ($user->logo) {
                Storage::disk('public')->delete($user->logo);
            }
            $path = $request->file('logo')->store('logos', 'public');
            $validated['logo'] = $path;
        }

        // Convertir programming_languages en JSON pour programming_language
        if (isset($validated['programming_languages'])) {
            $validated['programming_language'] = json_encode($validated['programming_languages']);
            unset($validated['programming_languages']); // Supprimer pour éviter une erreur
        }

        // Mettre à jour l'utilisateur
        $user->update($validated);

        Log::info('Profile updated successfully', [
            'user_id' => $user->id,
            'updated_data' => $validated,
        ]);

        return response()->json(['user' => $user], 200);
    }

    public function updatePassword(Request $request)
    {
        try {
            $request->validate([
                'current_password' => ['required', 'current_password'],
                'new_password' => ['required', 'min:8', 'confirmed'],
            ]);

            $user = $request->user();
            $user->password = Hash::make($request->new_password);
            $user->save();

            Log::info('Password updated successfully', ['user_id' => $user->id]);

            return response()->json(['message' => 'Mot de passe mis à jour avec succès'], 200);
        } catch (ValidationException $e) {
            Log::error('Password update validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Password update failed', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur serveur lors de la mise à jour du mot de passe',
            ], 500);
        }
    }

    public function destroy(Request $request)
    {
        try {
            $request->validate([
                'password' => ['required', 'current_password'],
            ]);

            $user = $request->user();

            Auth::logout();
            $user->delete();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            Log::info('User account soft-deleted', ['user_id' => $user->id]);

            return response()->json(['message' => 'Compte marqué comme supprimé avec succès'], 200);
        } catch (ValidationException $e) {
            Log::error('Account deletion validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Account deletion failed', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur serveur lors de la suppression du compte',
            ], 500);
        }
    }
}