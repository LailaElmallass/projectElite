<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    // Afficher toutes les notifications
    public function index()
    {
        // Retourner uniquement les notifications de l'utilisateur connecté si nécessaire
        return response()->json(Notification::all());
    }

    // Ajouter une nouvelle notification (réservé aux admins)
    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $notification = Notification::create([
            'title' => $request->title,
            'message' => $request->message,
            'user_id' => Auth::id(),
        ]);

        return response()->json($notification, 201);
    }

    // Marquer une notification comme lue
    public function markAsRead($id)
    {
        $notification = Notification::findOrFail($id);
        
        // Optionnel : Vérifier si l'utilisateur a le droit de marquer cette notification (par exemple, si elle lui appartient)
        // if ($notification->user_id !== Auth::id()) {
        //     return response()->json(['error' => 'Unauthorized'], 403);
        // }

        $notification->is_read = true;
        $notification->save();

        return response()->json(['message' => 'Notification marquée comme lue', 'notification' => $notification]);
    }
}