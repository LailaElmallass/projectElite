<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    public function handle(Request $request, Closure $next, $role = 'admin')
    {
        $user = Auth::user();
        if (!$user || $user->role !== $role) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }
        return $next($request);
    }
}