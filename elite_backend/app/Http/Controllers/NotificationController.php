<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    // Notifications générales pour Navbar (exclut candidatures)
    public function index()
    {
        $user = Auth::user();
        return response()->json(
            Notification::where('recipient_id', $user->id)
                ->where('title', '!=', 'Nouvelle candidature')
                ->orderBy('created_at', 'desc')
                ->get()
        );
    }

    // Notifications pour entreprise (inclut candidatures)
    public function enterpriseNotifications()
    {
        $user = Auth::user();
        if ($user->role !== 'entreprise') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        return response()->json(
            Notification::where('recipient_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get()
        );
    }

    // Créer une notification (admin)
    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'recipient_id' => 'required|exists:users,id',
        ]);

        $notification = Notification::create([
            'title' => $validated['title'],
            'message' => $validated['message'],
            'user_id' => Auth::id(),
            'recipient_id' => $validated['recipient_id'],
        ]);

        return response()->json($notification, 201);
    }

    // Marquer une notification comme lue
    public function markAsRead($id)
    {
        $notification = Notification::where('recipient_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();
        $notification->is_read = true;
        $notification->save();

        return response()->json(['message' => 'Notification marquée comme lue', 'notification' => $notification]);
    }

    public function getEnterpriseNotifications()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'entreprise') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notifications = Notification::where('recipient_id', $user->id)->get();
        return response()->json($notifications);
    }

    public function assignUsers(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'entreprise') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification = Notification::findOrFail($id);
        if ($notification->recipient_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        // Sync users to the notification
        $notification->users()->sync($request->user_ids);

        return response()->json(['message' => 'Users assigned successfully']);
    }
}