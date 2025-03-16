<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function getUser(Request $request)
    {
        return response()->json($request->user());
    }
    
    public function register(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:utilisateur,coach,entreprise,admin', 
        ];

        // Validations conditionnelles selon le rôle
        if ($request->role === 'utilisateur' || $request->role === 'coach') {
            $rules['gender'] = 'required|string|in:male,female';
        }
        if ($request->role === 'utilisateur') {
            $rules['goal'] = 'required|string|in:etat,prive,etudier_ici,etudier_etranger,entrepreneur';
        }
        if ($request->role === 'coach') {
            $rules['specialty'] = 'required|string|max:255';
        }
        if ($request->role === 'entreprise') {
            $rules['company_name'] = 'required|string|max:255';
            $rules['industry'] = 'required|string|max:255';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        \Log::info('Données reçues pour inscription:', $request->all());

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'gender' => $request->gender,
            'goal' => $request->goal,
            'specialty' => $request->specialty,
            'company_name' => $request->company_name,
            'industry' => $request->industry,
            'is_first_time' => true,
        ]);

        $token = $user->createToken('AppToken')->plainTextToken;

        return response()->json([
            'message' => 'Inscription réussie!',
            'token' => $token,
            'user' => $user,
            'redirect' => '/signin',
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['error' => 'Email ou mot de passe incorrect'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('AppToken')->plainTextToken;

        $redirect = $user->is_first_time ? '/tests' : match ($user->role) {
            'coach' => '/coach_dashboard',
            'entreprise' => '/entreprise_dashboard',
            'admin' => '/admin_dashboard',
            default => '/dashboard',
        };

        return response()->json([
            'message' => 'Connexion réussie!',
            'token' => $token,
            'user' => $user,
            'redirect' => $redirect,
        ]);
    }

    public function completeFirstTest(Request $request)
    {
        $user = $request->user();
        $user->is_first_time = false;
        $user->save();
        return response()->json(['message' => 'First test completed']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnexion réussie']);
    }

}