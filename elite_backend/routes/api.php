<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\FormationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CapsuleController;
use App\Http\Controllers\InterviewController;
use App\Http\Controllers\JobOfferController;
use App\Http\Controllers\DiffusionWorkshopController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ContactController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/login', [AuthController::class, 'login'])->name('login');

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Authentication and User
    Route::get('/user', [AuthController::class, 'getUser'])->name('user');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/test-auth', function () {
        return response()->json(['user' => Auth::user()]);
    });

    // User Profile
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/password', [ProfileController::class, 'updatePassword'])->name('profile.update-password');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Dashboards
    Route::get('/dashboard', [DashboardController::class, 'userDashboard'])->name('user-dashboard');
    Route::get('/coach_dashboard', [DashboardController::class, 'coachDashboard'])->name('coach-dashboard');
    Route::get('/entreprise_dashboard', [DashboardController::class, 'entrepriseDashboard'])->name('entreprise-dashboard');
    Route::get('/admin_dashboard', [DashboardController::class, 'adminDashboard'])->name('admin-dashboard');

    // User Management
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::post('/users/student-status', [TestController::class, 'setStudentStatus'])->name('users.student-status'); // Changed to POST
    Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update')->where('id', '[0-9]+');
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');

    // Search
    Route::get('/search', [UserController::class, 'search'])->name('search');

    // Contact
    Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

    // Tests
    Route::get('/tests/general', [TestController::class, 'getGeneralTest'])->name('tests.general');
    Route::post('/tests/general/submit', [TestController::class, 'submitGeneralTest'])->name('tests.general.submit');
    Route::get('/tests', [TestController::class, 'index'])->name('tests.index');
    Route::post('/tests/submit', [TestController::class, 'submit'])->name('tests.submit');
    Route::get('/tests/{testId}/questions', [TestController::class, 'getQuestions'])->name('tests.questions');
    Route::get('/tests/{id}', [TestController::class, 'show'])->name('tests.show');

    // Admin Routes for Tests
    Route::middleware('role:admin')->group(function () {
        Route::post('/tests', [TestController::class, 'storeTest'])->name('tests.store');
        Route::put('/tests/{id}', [TestController::class, 'updateTest'])->name('tests.update');
        Route::delete('/tests/{id}', [TestController::class, 'deleteTest'])->name('tests.destroy');
        Route::post('/questions', [TestController::class, 'storeQuestion'])->name('questions.store');
        Route::put('/questions/{id}', [TestController::class, 'updateQuestion'])->name('questions.update');
        Route::delete('/questions/{id}', [TestController::class, 'deleteQuestion'])->name('questions.destroy');
    });

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications', [NotificationController::class, 'store'])->name('notifications.store');
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::get('/enterprise-notifications', [NotificationController::class, 'enterpriseNotifications'])->name('notifications.enterprise');

    // Formations
    Route::get('/formations', [FormationController::class, 'getFormations'])->name('formations.index');
    Route::post('/formations/payment', [FormationController::class, 'initiatePayment'])->name('formations.payment');
    Route::get('/formations/{formationId}/access', [FormationController::class, 'checkAccess'])->name('formations.access');
    Route::post('/formations/{formationId}/complete', [FormationController::class, 'completeFormation'])->name('formations.complete');

    // Admin Routes for Formations
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/formations', [FormationController::class, 'index'])->name('admin.formations.index');
        Route::post('/admin/formations', [FormationController::class, 'store'])->name('admin.formations.store');
        Route::put('/admin/formations/{id}', [FormationController::class, 'update'])->name('admin.formations.update');
        Route::delete('/admin/formations/{id}', [FormationController::class, 'destroy'])->name('admin.formations.destroy');
    });

    // Capsules
    Route::get('/capsules', [CapsuleController::class, 'index'])->name('capsules.index');
    Route::middleware('role:admin')->group(function () {
        Route::get('/capsules/admin', [CapsuleController::class, 'adminIndex'])->name('capsules.admin');
        Route::post('/capsules', [CapsuleController::class, 'store'])->name('capsules.store');
        Route::put('/capsules/{id}', [CapsuleController::class, 'update'])->name('capsules.update');
        Route::delete('/capsules/{id}', [CapsuleController::class, 'destroy'])->name('capsules.destroy');
    });

    // Interviews
    Route::post('/interviews', [InterviewController::class, 'store'])->name('interviews.store');
    Route::get('/interviews', [InterviewController::class, 'indexForUser'])->name('interviews.index');
    Route::post('/interviews/{id}/apply', [InterviewController::class, 'apply'])->name('interviews.apply');
    Route::get('/user/interviews/applied', [InterviewController::class, 'appliedInterviews'])->name('interviews.applied');
    Route::get('/interviews/{id}/candidates', [InterviewController::class, 'getCandidates'])->name('interviews.candidates');
    Route::middleware('role:admin')->group(function () {
        Route::get('/all-interviews', [InterviewController::class, 'allInterviews'])->name('interviews.admin');
        Route::delete('/interviews/{id}', [InterviewController::class, 'destroy']);
        Route::put('/interviews/{id}/confirm', [InterviewController::class, 'confirm'])->name('interviews.confirm');
    });

    // Job Offers
    Route::get('/job-offers', [JobOfferController::class, 'index'])->name('job-offers.index');
    Route::post('/job-offers/{jobOffer}/apply', [JobOfferController::class, 'apply'])->name('job-offers.apply');
    Route::middleware('role:admin,entreprise')->group(function () {
        Route::post('/job-offers', [JobOfferController::class, 'store'])->name('job-offers.store');
        Route::put('/job-offers/{id}', [JobOfferController::class, 'update'])->name('job-offers.update');
        Route::put('/job-applications/{applicationId}', [JobApplicationController::class, 'updateStatus']);
        Route::delete('/job-offers/{id}', [JobOfferController::class, 'destroy'])->name('job-offers.destroy');
        Route::get('/job-offers/{id}/applications', [JobOfferController::class, 'applications'])->name('job-offers.applications');
    });

    // Diffusion Workshops
    Route::get('/diffusions-workshops', [DiffusionWorkshopController::class, 'index'])->name('diffusions-workshops.index');
    Route::middleware('role:admin,entreprise')->group(function () {
        Route::post('/diffusions-workshops', [DiffusionWorkshopController::class, 'store'])->name('diffusions-workshops.store');
        Route::put('/diffusions-workshops/{id}', [DiffusionWorkshopController::class, 'update'])->name('diffusions-workshops.update');
        Route::delete('/diffusions-workshops/{id}', [DiffusionWorkshopController::class, 'destroy'])->name('diffusions-workshops.destroy');
    });
});