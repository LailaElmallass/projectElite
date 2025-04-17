<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    
    public function index(Request $request)
    {
        if (!auth()->check() || auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $query = User::query()->select([
                'id', 'nomComplet', 'nom', 'prenom', 'email', 'role', 'numero_de_telephone',
                'gender', 'specialty', 'company_name', 'industry', 'points', 'image',
                'ville', 'target_audience', 'is_student', 'logo', 'software_technologies',
                'address', 'cef', 'creation_date', 'required_skills', 'programming_language',
                'age_range', 'required_diplomas'
            ]);

            $roles = $request->query('role');
            if ($roles) {
                $rolesArray = explode(',', $roles);
                $query->whereIn('role', $rolesArray);
            }

            $users = $query->get();
            return response()->json($users);
        } catch (\Exception $e) {
            \Log::error('Erreur dans UserController::index: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Erreur serveur interne', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            \Log::info('Données reçues dans UserController::store:', $request->all());
            $data = $request->validate([
                'nomComplet' => 'required|string|max:255',
                'nom' => 'nullable|string|max:255',
                'prenom' => 'nullable|string|max:255',
                'email' => [
                    'required',
                    'string',
                    'email',
                    'max:255',
                    \Illuminate\Validation\Rule::unique('users')->whereNull('deleted_at'),
                ],
                'password' => 'required|string|min:8',
                'role' => 'required|string|in:utilisateur,coach,entreprise,admin',
                'numero_de_telephone' => 'required|string|max:255',
                'gender' => 'nullable|string|in:male,female,other',
                'specialty' => 'nullable|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'industry' => 'nullable|string|max:255',
                'image' => 'nullable|file|image|max:2048',
                'logo' => 'nullable|file|image|max:2048',
                'software_technologies' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:255',
                'cef' => 'nullable|string|max:50',
                'creation_date' => 'nullable|date',
                'required_skills' => 'nullable|string|max:255',
                'programming_language' => 'nullable|string|max:50',
                'age_range' => 'nullable|string|max:50',
                'required_diplomas' => 'nullable|string|max:500',
            ]);

            // Recompute nomComplet if nom and prenom are provided
            if (!empty($data['nom']) && !empty($data['prenom'])) {
                $data['nomComplet'] = trim($data['nom'] . ' ' . $data['prenom']);
            }

            $data['password'] = Hash::make($request->password);
            $data['points'] = 0;
            $data['is_first_time'] = true;
            $data['is_student'] = false; // Set to false (0) instead of null
            $data['target_audience'] = null;

            if ($request->hasFile('image')) {
                \Log::info('Image file detected:', ['name' => $request->file('image')->getClientOriginalName()]);
                $data['image'] = $request->file('image')->store('images', 'public');
            }
            if ($request->hasFile('logo')) {
                \Log::info('Logo file detected:', ['name' => $request->file('logo')->getClientOriginalName()]);
                $data['logo'] = $request->file('logo')->store('logos', 'public');
            }

            \Log::info('Données préparées pour User::create:', $data);
            $user = User::create($data);
            \Log::info('Utilisateur créé:', $user->toArray());
            return response()->json($user, 201);
        } catch (ValidationException $e) {
            \Log::error('Erreur de validation dans UserController::store: ', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Erreur de base de données dans UserController::store: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Erreur de base de données', 'error' => $e->getMessage()], 500);
        } catch (\Exception $e) {
            \Log::error('Erreur dans UserController::store: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if (!auth()->check() || (auth()->user()->role !== 'admin' && auth()->id() !== $user->id)) {
            \Log::warning('Accès non autorisé pour l\'utilisateur ID ' . $id);
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            \Log::info('Requête reçue pour mise à jour de l\'utilisateur ID ' . $id, $request->all());
            $rules = [
                'nom' => ['sometimes', 'string', 'max:255'],
                'prenom' => ['sometimes', 'string', 'max:255'],
                'nomComplet' => ['sometimes', 'string', 'max:255'],
                'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,' . $id],
                'role' => ['sometimes', 'string', 'in:utilisateur,coach,entreprise,admin'],
                'numero_de_telephone' => ['sometimes', 'string', 'max:20'],
                'gender' => ['sometimes', 'string', 'in:male,female,other'],
                'specialty' => ['sometimes', 'string', 'max:255'],
                'company_name' => ['sometimes', 'string', 'max:255'],
                'industry' => ['sometimes', 'string', 'max:255'],
                'software_technologies' => ['sometimes', 'string', 'max:255'],
                'address' => ['sometimes', 'string', 'max:255'],
                'cef' => ['sometimes', 'string', 'max:50'],
                'creation_date' => ['sometimes', 'date'],
                'required_skills' => ['sometimes', 'string', 'max:255'],
                'programming_language' => ['sometimes', 'string', 'max:255'],
                'age_range' => ['sometimes', 'string', 'max:50'],
                'required_diplomas' => ['sometimes', 'string', 'max:500'],
                'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
                'is_student' => ['sometimes', 'boolean'],
                'target_audience' => ['sometimes', 'string', 'in:etudiant_maroc,etudiant_etranger,entrepreneur,salarie_etat,salarie_prive'],
                'is_first_time' => ['sometimes', 'boolean'],
            ];

            $validated = $request->validate($rules);
            $data = $request->only(array_keys($rules));

            if (!empty($data['nom']) || !empty($data['prenom'])) {
                $nom = $data['nom'] ?? $user->nom ?? '';
                $prenom = $data['prenom'] ?? $user->prenom ?? '';
                $data['nomComplet'] = trim($nom . ' ' . $prenom);
            }

            if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
                \Log::info('Fichier logo détecté, traitement en cours...');
                if ($user->logo) {
                    Storage::disk('public')->delete($user->logo);
                    \Log::info('Ancien logo supprimé : ' . $user->logo);
                }
                $path = $request->file('logo')->store('logos', 'public');
                $data['logo'] = $path;
                \Log::info('Nouveau logo enregistré : ' . $path);
            }

            if (!empty($data)) {
                $user->update($data);
                \Log::info('Utilisateur mis à jour avec succès', ['user_id' => $id, 'updated_data' => $data]);
            }

            $user->refresh();
            return response()->json([
                'message' => 'Utilisateur mis à jour avec succès',
                'user' => $user,
            ], 200);
        } catch (ValidationException $e) {
            \Log::error('Erreur de validation dans UserController::update: ', ['errors' => $e->errors()]);
            return response()->json(['message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Erreur dans UserController::update: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        if (!auth()->check() || auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $user = User::findOrFail($id);

            if ($user->image) {
                Storage::disk('public')->delete($user->image);
            }
            if ($user->logo) {
                Storage::disk('public')->delete($user->logo);
            }

            $user->delete();
            return response()->json(['message' => 'Utilisateur supprimé'], 200);
        } catch (\Exception $e) {
            \Log::error('Erreur dans UserController::destroy: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Erreur lors de la suppression', 'error' => $e->getMessage()], 500);
        }
    }
}