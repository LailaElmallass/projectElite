<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\NotificationController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'getUser']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/complete-first-test', [AuthController::class, 'completeFirstTest']);


    // Test Routes
    Route::get('/tests', [TestController::class, 'index']);
    Route::get('/tests/{testId}/questions', [TestController::class, 'getQuestions']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/tests/submit', [TestController::class, 'submit']);
    });
    Route::post('/tests', [TestController::class, 'storeTest']);
    Route::post('/tests/questions', [TestController::class, 'storeQuestion']);
    Route::put('/tests/questions/{id}', [TestController::class, 'updateQuestion']);
    Route::delete('/tests/questions/{id}', [TestController::class, 'deleteQuestion']);
    Route::delete('/tests/{id}', [TestController::class, 'deleteTest']);

    // Dashboard Routes
    Route::get('/dashboard', fn() => response()->json(['message' => 'Dashboard']));
    Route::get('/coach_dashboard', fn() => response()->json(['message' => 'Coach Dashboard']));
    Route::get('/entreprise_dashboard', fn() => response()->json(['message' => 'Entreprise Dashboard']));
    Route::get('/admin_dashboard', fn() => response()->json(['message' => 'Admin Dashboard']));
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
});