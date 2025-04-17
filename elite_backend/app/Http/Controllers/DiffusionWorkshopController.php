<?php

namespace App\Http\Controllers;

use App\Models\DiffusionWorkshop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class DiffusionWorkshopController extends Controller
{
    public function index()
    {
        try {
            Log::info("DiffusionWorkshop index started");
            $user = Auth::user();
            Log::info("User: " . ($user ? "ID {$user->id}, Role {$user->role}" : 'Guest'));

            $query = DiffusionWorkshop::query();
            if ($user && $user->role === 'admin') {
                Log::info("Fetching all events for admin");
                $events = $query->with('user')->get();
            } elseif ($user && $user->role === 'entreprise') {
                Log::info("Fetching events for enterprise user ID {$user->id}");
                $events = $query->where('user_id', $user->id)->with('user')->get();
            } else {
                Log::info("Fetching all events for guest or other user");
                $events = $query->with('user')->get();
            }

            Log::info("Retrieved " . count($events) . " events");
            return response()->json($events);
        } catch (\Exception $e) {
            Log::error("Error in DiffusionWorkshop index: " . $e->getMessage() . "\nFile: " . $e->getFile() . "\nLine: " . $e->getLine() . "\nStack trace: " . $e->getTraceAsString());
            return response()->json([
                'error' => 'Internal server error',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || !in_array($user->role, ['admin', 'entreprise'])) {
                Log::warning("Unauthorized store attempt by user: " . ($user ? "ID {$user->id}, Role {$user->role}" : 'Guest'));
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'location' => 'required|string|max:255',
                'event_date' => 'required|date',
                'event_type' => 'nullable|string|max:255',
                'registration_link' => 'nullable|url',
            ]);

            if ($validator->fails()) {
                Log::info("Validation failed for store: " . json_encode($validator->errors()));
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $event = DiffusionWorkshop::create([
                'user_id' => $user->id,
                'title' => $request->title,
                'description' => $request->description,
                'location' => $request->location,
                'event_date' => $request->event_date,
                'event_type' => $request->event_type,
                'registration_link' => $request->registration_link,
            ]);

            Log::info("DiffusionWorkshop created: id={$event->id}, title={$event->title}");
            return response()->json($event, 201);
        } catch (\Exception $e) {
            Log::error("Error in DiffusionWorkshop store: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error', 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            Log::info("Update attempt: Event ID {$id}, Payload: " . json_encode($request->all()));
            $user = Auth::user();
            $diffusionWorkshop = DiffusionWorkshop::findOrFail($id);
            Log::info("Event found: ID {$diffusionWorkshop->id}, Title {$diffusionWorkshop->title}, Owner ID {$diffusionWorkshop->user_id}");
            Log::info("User: ID " . ($user ? $user->id : 'Guest') . ", Role " . ($user ? $user->role : 'None'));

            if (!$user || ($user->role !== 'admin' && $diffusionWorkshop->user_id !== $user->id)) {
                Log::warning("Unauthorized update attempt by user: " . ($user ? "ID {$user->id}, Role {$user->role}" : 'Guest'));
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'location' => 'required|string|max:255',
                'event_date' => 'required|date',
                'event_type' => 'nullable|string|max:255',
                'registration_link' => 'nullable|url',
            ]);

            if ($validator->fails()) {
                Log::info("Validation failed for update: " . json_encode($validator->errors()));
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $updated = $diffusionWorkshop->update($request->only([
                'title', 'description', 'location', 'event_date', 'event_type', 'registration_link',
            ]));

            if ($updated) {
                $diffusionWorkshop->refresh();
                Log::info("DiffusionWorkshop updated: id={$diffusionWorkshop->id}, title={$diffusionWorkshop->title}");
                return response()->json($diffusionWorkshop);
            } else {
                Log::error("Failed to update DiffusionWorkshop: id={$diffusionWorkshop->id}");
                return response()->json(['error' => 'Failed to update event'], 500);
            }
        } catch (\Exception $e) {
            Log::error("Error in DiffusionWorkshop update: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            Log::info("Delete attempt: Event ID {$id}");
            $user = Auth::user();
            $diffusionWorkshop = DiffusionWorkshop::findOrFail($id);
            Log::info("Event found: ID {$diffusionWorkshop->id}, Title {$diffusionWorkshop->title}, Owner ID {$diffusionWorkshop->user_id}");
            Log::info("User: ID " . ($user ? $user->id : 'Guest') . ", Role " . ($user ? $user->role : 'None'));

            if (!$user || ($user->role !== 'admin' && $diffusionWorkshop->user_id !== $user->id)) {
                Log::warning("Unauthorized delete attempt by user: " . ($user ? "ID {$user->id}, Role {$user->role}" : 'Guest'));
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $deleted = $diffusionWorkshop->delete();
            if ($deleted) {
                Log::info("DiffusionWorkshop deleted: id={$id}");
                return response()->json(['message' => 'Event deleted successfully']);
            } else {
                Log::error("Failed to delete DiffusionWorkshop: id={$id}");
                return response()->json(['error' => 'Failed to delete event'], 500);
            }
        } catch (\Exception $e) {
            Log::error("Error in DiffusionWorkshop destroy: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error', 'message' => $e->getMessage()], 500);
        }
    }
}