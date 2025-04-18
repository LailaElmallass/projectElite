<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'message' => 'required|string|max:5000',
            ]);

            // Log the submission
            Log::info('Contact form submitted', [
                'user_id' => Auth::id() ?: 'guest',
                'name' => $validated['name'],
                'email' => $validated['email'],
                'message' => $validated['message'],
            ]);

            // Send email (configure mail settings in .env)
            Mail::raw(
                "Nom: {$validated['name']}\nEmail: {$validated['email']}\nMessage: {$validated['message']}",
                function ($message) use ($validated) {
                    $message->to('your_support_email@example.com') // Replace with your email
                            ->subject('Nouveau message de contact');
                    $message->from($validated['email'], $validated['name']);
                }
            );

            return response()->json([
                'message' => 'Message envoyé avec succès',
                'data' => $validated,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in contact form submission', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id() ?: 'guest',
            ]);
            return response()->json([
                'message' => 'Erreur lors de l’envoi du message',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}