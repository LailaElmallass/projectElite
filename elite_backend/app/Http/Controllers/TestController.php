<?php

namespace App\Http\Controllers;

use App\Models\Test;
use App\Models\Question;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class TestController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    protected function respond($success, $data = [], $message = '', $errors = [], $status = 200)
    {
        return response()->json([
            'success' => $success,
            'data' => $data,
            'message' => $message,
            'errors' => $errors
        ], $status);
    }

    public function index()
    {
        try {
            $user = Auth::user();
            Log::info('Fetching tests for user', ['user_id' => $user->id, 'role' => $user->role]);

            if ($user->role === 'admin') {
                $tests = Test::withCount('questions')->get();
            } else {
                if (!$user->target_audience && is_null($user->is_student) && !$user->is_first_time) {
                    return $this->respond(true, ['tests' => [], 'needs_audience_selection' => true], 'Audience or student status required');
                }
                $tests = Test::where(function ($query) use ($user) {
                    if ($user->target_audience) {
                        $query->where('target_audience', $user->target_audience);
                    }
                    $query->orWhere(function ($query) use ($user) {
                        $query->where('is_general', true)
                              ->where('is_student', $user->is_student ?? false);
                    });
                })->withCount('questions')->get();
            }

            Log::info('Tests fetched', ['count' => $tests->count(), 'user_id' => $user->id]);
            return $this->respond(true, ['tests' => $tests], 'Tests retrieved successfully');
        } catch (\Exception $e) {
            Log::error('Error in index', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->respond(false, [], 'Server error retrieving tests', [$e->getMessage()], 500);
        }
    }

    public function getQuestions($testId)
    {
        try {
            $test = Test::with(['questions' => function ($query) {
                $query->select('id', 'test_id', 'question', 'options', 'correct_answer_index')
                      ->whereNull('deleted_at');
            }])->whereNull('deleted_at')->find($testId);

            if (!$test) {
                Log::warning('Test not found', ['test_id' => $testId, 'user_id' => Auth::id() ?: 'guest']);
                return $this->respond(false, [], 'Test not found', [], 404);
            }

            $questions = $test->questions->map(function ($question) use ($testId) {
                $rawOptions = $question->getRawOriginal('options');
                $options = is_array($question->options) ? $question->options : json_decode($rawOptions, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::error('Failed to parse options JSON', [
                        'test_id' => $testId,
                        'question_id' => $question->id,
                        'raw_options' => $rawOptions,
                        'json_error' => json_last_error_msg(),
                    ]);
                    return null;
                }
                if (!is_array($options) || count($options) < 2) {
                    Log::warning('Invalid options for question', [
                        'test_id' => $testId,
                        'question_id' => $question->id,
                        'raw_options' => $rawOptions,
                        'parsed_options' => $options,
                    ]);
                    return null;
                }
                return [
                    'id' => $question->id,
                    'question' => $question->question,
                    'options' => $options,
                    'correct_answer_index' => (int)$question->correct_answer_index,
                ];
            })->filter()->values();

            Log::info('Questions fetched', [
                'test_id' => $testId,
                'question_count' => $questions->count(),
                'user_id' => Auth::id() ?: 'guest'
            ]);

            return $this->respond(true, ['questions' => $questions], 'Questions retrieved successfully');
        } catch (\Exception $e) {
            Log::error('Error in getQuestions', [
                'test_id' => $testId,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->respond(false, [], 'Server error retrieving questions', [$e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $test = Test::with(['questions' => function ($query) {
                $query->select('id', 'test_id', 'question', 'options', 'correct_answer_index')
                      ->whereNull('deleted_at');
            }])->whereNull('deleted_at')->find($id);

            if (!$test) {
                Log::warning('Test not found', ['test_id' => $id, 'user_id' => Auth::id() ?: 'guest']);
                return $this->respond(false, [], 'Test not found', [], 404);
            }

            $test->questions = $test->questions->map(function ($question) use ($id) {
                $rawOptions = $question->getRawOriginal('options');
                $options = is_array($question->options) ? $question->options : json_decode($rawOptions, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::error('Failed to parse options JSON', [
                        'test_id' => $id,
                        'question_id' => $question->id,
                        'raw_options' => $rawOptions,
                        'json_error' => json_last_error_msg(),
                    ]);
                    return null;
                }
                if (!is_array($options) || count($options) < 2) {
                    Log::warning('Invalid options for question', [
                        'test_id' => $id,
                        'question_id' => $question->id,
                        'raw_options' => $rawOptions,
                        'parsed_options' => $options,
                    ]);
                    return null;
                }
                return [
                    'id' => $question->id,
                    'question' => $question->question,
                    'options' => $options,
                    'correct_answer_index' => (int)$question->correct_answer_index,
                ];
            })->filter()->values();

            Log::info('Test fetched', [
                'test_id' => $id,
                'question_count' => $test->questions->count(),
                'user_id' => Auth::id() ?: 'guest'
            ]);

            return $this->respond(true, ['test' => $test], 'Test retrieved successfully');
        } catch (\Exception $e) {
            Log::error('Error in show', [
                'test_id' => $id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->respond(false, [], 'Server error retrieving test', [$e->getMessage()], 500);
        }
    }

    public function storeTest(Request $request)
    {
        try {
            $user = Auth::user();
            if ($user->role !== 'admin') {
                return $this->respond(false, [], 'Admin access only', [], 403);
            }

            $validator = Validator::make($request->all(), $this->getTestValidationRules());
            if ($validator->fails()) {
                Log::warning('Validation failed for test creation', ['errors' => $validator->errors()->all()]);
                return $this->respond(false, [], 'Validation failed', $validator->errors()->all(), 422);
            }

            DB::beginTransaction();

            $test = Test::create([
                'title' => $request->title,
                'duration' => $request->duration,
                'description' => $request->description,
                'target_audience' => $request->is_general ? 'etudiant_maroc' : $request->target_audience,
                'is_general' => $request->is_general,
                'is_student' => $request->is_general ? $request->is_student : null,
                'created_by' => $user->id,
                'questions_count' => count($request->questions),
            ]);

            foreach ($request->questions as $index => $questionData) {
                $options = array_values(array_filter($questionData['options'], fn($opt) => !empty(trim($opt))));
                if (count($options) < 2) {
                    DB::rollBack();
                    return $this->respond(false, [], "Question at index $index must have at least 2 valid options", [], 422);
                }
                if ($questionData['correct_answer_index'] >= count($options)) {
                    DB::rollBack();
                    return $this->respond(false, [], "Correct answer index for question at index $index is out of bounds", [], 422);
                }
                Question::create([
                    'test_id' => $test->id,
                    'question' => $questionData['question'],
                    'options' => json_encode($options),
                    'correct_answer_index' => (int)$questionData['correct_answer_index'],
                ]);
            }

            DB::commit();
            return $this->respond(true, ['test' => $test->fresh(['questions'])], 'Test created successfully', [], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating test', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->respond(false, [], 'Server error creating test', [$e->getMessage()], 500);
        }
    }

    protected function getTestValidationRules($isUpdate = false)
    {
        $rules = [
            'title' => ['string', 'max:255'],
            'duration' => ['string', 'max:50'],
            'description' => ['string'],
            'is_general' => ['boolean'],
            'target_audience' => ['required_if:is_general,false', 'in:etudiant_maroc,etudiant_etranger,entrepreneur,salarie_etat,salarie_prive'],
            'is_student' => ['required_if:is_general,true', 'boolean'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question' => ['required', 'string'],
            'questions.*.options' => ['required', 'array', 'min:2'],
            'questions.*.options.*' => ['required', 'string'],
            'questions.*.correct_answer_index' => ['required', 'integer', 'min:0'],
        ];

        if ($isUpdate) {
            foreach ($rules as $key => &$rule) {
                if (!str_contains($key, 'questions')) {
                    array_unshift($rule, 'sometimes');
                }
            }
        }

        return $rules;
    }

    public function updateTest(Request $request, $testId)
    {
        Log::info('Updating test', ['test_id' => $testId, 'request_data' => $request->all()]);

        $validator = Validator::make($request->all(), $this->getTestValidationRules(true));
        if ($validator->fails()) {
            Log::warning('Validation failed for test update', [
                'test_id' => $testId,
                'errors' => $validator->errors()->all(),
                'request_data' => $request->all()
            ]);
            return $this->respond(false, [], 'Validation failed', $validator->errors()->all(), 422);
        }

        try {
            DB::beginTransaction();
            $test = Test::findOrFail($testId);
            $test->fill($request->only(['title', 'duration', 'description', 'is_general', 'target_audience', 'is_student']));
            $test->target_audience = $request->is_general ? 'etudiant_maroc' : ($request->target_audience ?? $test->target_audience);
            $test->save();

            if ($request->has('questions')) {
                $existingQuestionIds = $test->questions()->pluck('id')->toArray();
                $requestQuestionIds = array_filter(
                    array_column($request->input('questions', []), 'id'),
                    fn($id) => is_numeric($id) && $id > 0
                );

                $questionsToDelete = array_diff($existingQuestionIds, $requestQuestionIds);
                if (!empty($questionsToDelete)) {
                    Log::info('Deleting questions', ['question_ids' => $questionsToDelete]);
                    Question::whereIn('id', $questionsToDelete)->delete();
                }

                foreach ($request->input('questions', []) as $index => $questionData) {
                    if (empty($questionData['question']) || empty($questionData['options'])) {
                        Log::warning('Skipping invalid question data', ['index' => $index, 'data' => $questionData]);
                        continue;
                    }

                    $question = null;
                    if (!empty($questionData['id']) && is_numeric($questionData['id']) && $questionData['id'] > 0) {
                        $question = Question::find($questionData['id']);
                        if (!$question) {
                            Log::warning('Question not found, creating new', ['question_id' => $questionData['id']]);
                            $question = new Question();
                        }
                    } else {
                        $question = new Question();
                    }

                    $options = array_values(array_filter($questionData['options'], fn($opt) => !empty(trim($opt))));
                    if (count($options) < 2) {
                        DB::rollBack();
                        return $this->respond(false, [], "Question at index $index must have at least 2 valid options", [], 422);
                    }
                    if ($questionData['correct_answer_index'] >= count($options)) {
                        DB::rollBack();
                        return $this->respond(false, [], "Correct answer index for question at index $index is out of bounds", [], 422);
                    }

                    $question->test_id = $test->id;
                    $question->question = $questionData['question'];
                    $question->options = json_encode($options);
                    $question->correct_answer_index = (int)$questionData['correct_answer_index'];
                    $question->save();
                }
            }

            $test->questions_count = $test->questions()->count();
            $test->save();
            DB::commit();

            Log::info('Test updated successfully', ['test_id' => $testId, 'question_count' => $test->questions_count]);
            return $this->respond(true, ['test' => $test->fresh(['questions'])], 'Test updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating test', [
                'test_id' => $testId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return $this->respond(false, [], 'Error updating test: ' . $e->getMessage(), [], 500);
        }
    }

    public function deleteTest($id)
    {
        try {
            $user = Auth::user();
            if ($user->role !== 'admin') {
                return $this->respond(false, [], 'Admin access only', [], 403);
            }

            $test = Test::findOrFail($id);
            $test->questions()->delete();
            $test->delete();

            return $this->respond(true, [], 'Test and questions deleted successfully');
        } catch (\Exception $e) {
            Log::error('Error in deleteTest', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->respond(false, [], 'Server error deleting test', [$e->getMessage()], 500);
        }
    }

    public function storeQuestion(Request $request)
    {
        try {
            $user = Auth::user();
            if ($user->role !== 'admin') {
                return $this->respond(false, [], 'Admin access only', [], 403);
            }

            $validator = Validator::make($request->all(), [
                'test_id' => 'required|exists:tests,id',
                'question' => 'required|string',
                'options' => 'required|array|min:2',
                'options.*' => 'required|string',
                'correct_answer_index' => 'required|integer|min:0',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for question creation', ['errors' => $validator->errors()->all()]);
                return $this->respond(false, [], 'Validation failed', $validator->errors()->all(), 422);
            }

            $options = array_values(array_filter($request->options, fn($opt) => !empty(trim($opt))));
            if (count($options) < 2) {
                return $this->respond(false, [], 'At least 2 valid options are required', [], 422);
            }
            if ($request->correct_answer_index >= count($options)) {
                return $this->respond(false, [], 'Correct answer index is out of bounds', [], 422);
            }

            $question = Question::create([
                'test_id' => $request->test_id,
                'question' => $request->question,
                'options' => json_encode($options),
                'correct_answer_index' => (int)$request->correct_answer_index,
            ]);

            $test = Test::findOrFail($request->test_id);
            $test->increment('questions_count');

            return $this->respond(true, ['question' => $question], 'Question created successfully', [], 201);
        } catch (\Exception $e) {
            Log::error('Error creating question', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->respond(false, [], 'Server error creating question', [$e->getMessage()], 500);
        }
    }

    public function updateQuestion(Request $request, $id)
    {
        try {
            $user = Auth::user();
            if ($user->role !== 'admin') {
                return $this->respond(false, [], 'Admin access only', [], 403);
            }

            $validator = Validator::make($request->all(), [
                'question' => 'sometimes|required|string',
                'options' => 'sometimes|required|array|min:2',
                'options.*' => 'required|string',
                'correct_answer_index' => 'sometimes|required|integer|min:0',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for question update', ['errors' => $validator->errors()->all()]);
                return $this->respond(false, [], 'Validation failed', $validator->errors()->all(), 422);
            }

            $question = Question::findOrFail($id);
            $options = $request->options ? array_values(array_filter($request->options, fn($opt) => !empty(trim($opt)))) : json_decode($question->getRawOriginal('options'), true);
            if (count($options) < 2) {
                return $this->respond(false, [], 'At least 2 valid options are required', [], 422);
            }
            if (($request->correct_answer_index ?? $question->correct_answer_index) >= count($options)) {
                return $this->respond(false, [], 'Correct answer index is out of bounds', [], 422);
            }

            $question->update([
                'question' => $request->question ?? $question->question,
                'options' => json_encode($options),
                'correct_answer_index' => $request->correct_answer_index ?? $question->correct_answer_index,
            ]);

            return $this->respond(true, ['question' => $question], 'Question updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating question', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->respond(false, [], 'Server error updating question', [$e->getMessage()], 500);
        }
    }

    public function deleteQuestion($id)
    {
        try {
            $user = Auth::user();
            if ($user->role !== 'admin') {
                return $this->respond(false, [], 'Admin access only', [], 403);
            }

            $question = Question::findOrFail($id);
            $test = Test::findOrFail($question->test_id);
            $question->delete();
            $test->decrement('questions_count');

            return $this->respond(true, [], 'Question deleted successfully');
        } catch (\Exception $e) {
            Log::error('Error deleting question', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->respond(false, [], 'Server error deleting question', [$e->getMessage()], 500);
        }
    }

    public function submit(Request $request)
    {
        try {
            $user = $request->user();
            $data = $request->validate([
                'test_id' => 'required|exists:tests,id',
                'answers' => 'required|array',
            ]);

            $test = Test::with(['questions' => function ($query) {
                $query->select('id', 'test_id', 'question', 'options', 'correct_answer_index')
                      ->whereNull('deleted_at');
            }])->whereNull('deleted_at')->findOrFail($data['test_id']);

            $questions = $test->questions;

            if ($questions->isEmpty()) {
                Log::warning('No questions found for test', ['test_id' => $data['test_id'], 'user_id' => $user->id]);
                return $this->respond(false, [], 'No questions found for this test', [], 400);
            }

            foreach ($data['answers'] as $questionId => $answerIndex) {
                if (!is_numeric($answerIndex) || !Question::where('id', $questionId)->exists()) {
                    Log::warning('Invalid answer data', ['question_id' => $questionId, 'answer_index' => $answerIndex]);
                    return $this->respond(false, [], 'Invalid answer data', [], 422);
                }
                $question = $questions->firstWhere('id', $questionId);
                $options = is_array($question->options) ? $question->options : json_decode($question->getRawOriginal('options'), true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::error('Failed to parse options JSON in submit', [
                        'test_id' => $test->id,
                        'question_id' => $questionId,
                        'raw_options' => $question->getRawOriginal('options'),
                        'json_error' => json_last_error_msg(),
                    ]);
                    return $this->respond(false, [], 'Invalid question options', [], 422);
                }
                if (!is_array($options) || count($options) < 2) {
                    Log::warning('Invalid options in submit', [
                        'test_id' => $test->id,
                        'question_id' => $questionId,
                        'options' => $options,
                    ]);
                    return $this->respond(false, [], 'Invalid question options', [], 422);
                }
                if ((int)$answerIndex >= count($options)) {
                    Log::warning('Answer index out of bounds', [
                        'test_id' => $test->id,
                        'question_id' => $questionId,
                        'answer_index' => $answerIndex,
                        'options_count' => count($options),
                    ]);
                    return $this->respond(false, [], 'Answer index out of bounds', [], 422);
                }
            }

            $feedback = $this->callGemini($questions, $data['answers'], $user->goal ?? 'Non défini', false);
            return $this->respond(true, ['feedback' => $feedback], 'Results submitted successfully');
        } catch (\Exception $e) {
            Log::error('Error in submit', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->respond(false, [], 'Server error submitting test', [$e->getMessage()], 500);
        }
    }

    public function setStudentStatus(Request $request)
    {
        try {
            $user = Auth::user();
            Log::info('setStudentStatus endpoint called', [
                'request' => $request->all(),
                'user_id' => $user->id,
                'headers' => $request->headers->all(),
            ]);

            $validator = Validator::make($request->all(), [
                'is_student' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for student status', [
                    'user_id' => $user->id,
                    'errors' => $validator->errors()->all()
                ]);
                return $this->respond(false, [], 'Validation failed', $validator->errors()->all(), 422);
            }

            $user->update([
                'is_student' => $request->is_student,
            ]);

            Log::info('Student status updated', [
                'user_id' => $user->id,
                'is_student' => $request->is_student
            ]);

            return $this->respond(true, ['user' => $user->fresh()], 'Student status updated successfully');
        } catch (\Exception $e) {
            Log::error('Error in setStudentStatus', [
                'user_id' => Auth::id() ?: 'guest',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->respond(false, [], 'Server error updating student status', [$e->getMessage()], 500);
        }
    }

    public function getGeneralTest(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                Log::warning('Unauthorized access to getGeneralTest', [
                    'token' => $request->bearerToken(),
                ]);
                return $this->respond(false, [], 'Utilisateur non authentifié', [], 401);
            }

            Log::info('Fetching general test', [
                'user_id' => $user->id,
                'is_student' => $user->is_student,
                'is_first_time' => $user->is_first_time,
            ]);

            if ($user->is_student === null) {
                Log::info('User requires student selection', ['user_id' => $user->id]);
                return $this->respond(true, [
                    'tests' => [],
                    'needs_student_selection' => true,
                ], 'Sélection du statut étudiant requise');
            }

            $test = Test::where('is_general', true)
                ->where('is_student', $user->is_student)
                ->whereNull('deleted_at')
                ->orderBy('created_at', 'desc')
                ->with(['questions' => function ($query) {
                    $query->select('id', 'test_id', 'question', 'options', 'correct_answer_index')
                          ->whereNull('deleted_at');
                }])
                ->first();

            if (!$test) {
                Log::warning('No general test found for user', [
                    'user_id' => $user->id,
                    'is_student' => $user->is_student,
                ]);
                return $this->respond(true, [
                    'tests' => [],
                    'needs_student_selection' => false,
                ], 'Aucun test général disponible pour votre profil', [
                    'reason' => 'no_matching_tests',
                ]);
            }

            $validQuestions = $test->questions->filter(function ($question) {
                try {
                    $options = is_array($question->options)
                        ? $question->options
                        : json_decode($question->getRawOriginal('options'), true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        Log::error('Invalid JSON in question options', [
                            'question_id' => $question->id,
                            'test_id' => $question->test_id,
                            'raw_options' => $question->getRawOriginal('options'),
                            'json_error' => json_last_error_msg(),
                        ]);
                        return false;
                    }
                    if (!is_array($options) || count($options) < 2) {
                        Log::warning('Invalid options for question', [
                            'question_id' => $question->id,
                            'test_id' => $question->test_id,
                            'options' => $options,
                        ]);
                        return false;
                    }
                    $question->options = $options;
                    return true;
                } catch (\Exception $e) {
                    Log::error('Error processing question options', [
                        'question_id' => $question->id,
                        'test_id' => $question->test_id,
                        'error' => $e->getMessage(),
                    ]);
                    return false;
                }
            })->values();

            if ($validQuestions->isEmpty()) {
                Log::warning('No valid questions for general test', [
                    'test_id' => $test->id,
                    'user_id' => $user->id,
                    'question_count' => $test->questions->count(),
                ]);
                return $this->respond(true, [
                    'tests' => [],
                    'needs_student_selection' => false,
                ], 'Aucune question valide trouvée pour ce test', [
                    'reason' => 'no_valid_questions',
                ]);
            }

            $test->questions = $validQuestions;

            Log::info('General test retrieved successfully', [
                'user_id' => $user->id,
                'test_id' => $test->id,
                'question_count' => $validQuestions->count(),
                'question_ids' => $validQuestions->pluck('id')->toArray(),
            ]);

            return $this->respond(true, [
                'tests' => [$test],
                'needs_student_selection' => false,
            ], 'Test général récupéré avec succès');
        } catch (\Exception $e) {
            Log::error('Error in getGeneralTest', [
                'user_id' => $user->id ?? 'unknown',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->respond(false, [], 'Erreur serveur lors de la récupération du test général', [
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function submitGeneralTest(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                Log::warning('Unauthorized access to submitGeneralTest', [
                    'token' => $request->bearerToken(),
                ]);
                return $this->respond(false, [], 'Utilisateur non authentifié', [], 401);
            }

            Log::info('Submitting general test', [
                'user_id' => $user->id,
                'is_student' => $user->is_student,
                'request_data' => $request->all(),
            ]);

            // Validation
            $validator = Validator::make($request->all(), [
                'test_id' => 'required|integer|exists:tests,id',
                'answers' => 'required|array|min:1',
                'answers.*.question_id' => 'required|integer|exists:questions,id',
                'answers.*.answer' => 'required|integer|min:0',
            ], [
                'test_id.required' => 'L\'ID du test est requis.',
                'test_id.exists' => 'Le test spécifié n\'existe pas.',
                'answers.required' => 'Les réponses sont requises.',
                'answers.array' => 'Les réponses doivent être un tableau.',
                'answers.min' => 'Au moins une réponse est requise.',
                'answers.*.question_id.required' => 'L\'ID de la question est requis.',
                'answers.*.question_id.exists' => 'Une question spécifiée n\'existe pas.',
                'answers.*.answer.required' => 'Une réponse est requise pour chaque question.',
                'answers.*.answer.integer' => 'La réponse doit être un entier.',
                'answers.*.answer.min' => 'La réponse doit être un index valide (0 ou plus).',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for submitGeneralTest', [
                    'user_id' => $user->id,
                    'errors' => $validator->errors()->toArray(),
                ]);
                return $this->respond(false, [], 'Validation échouée', $validator->errors()->toArray(), 422);
            }

            $testId = $request->input('test_id');
            $answers = $request->input('answers');

            // Charger le test
            $test = Test::where('id', $testId)
                ->where('is_general', true)
                ->where('is_student', $user->is_student)
                ->whereNull('deleted_at')
                ->with(['questions' => function ($query) {
                    $query->select('id', 'test_id', 'question', 'options', 'correct_answer_index')
                          ->whereNull('deleted_at');
                }])
                ->first();

            if (!$test) {
                Log::warning('Test not found or invalid for user', [
                    'user_id' => $user->id,
                    'test_id' => $testId,
                    'is_student' => $user->is_student,
                ]);
                return $this->respond(false, [], 'Test général introuvable ou non applicable', ['reason' => 'invalid_test'], 404);
            }

            // Vérifier les questions
            if (!$test->questions || $test->questions->isEmpty()) {
                Log::warning('No active questions found for test', [
                    'user_id' => $user->id,
                    'test_id' => $testId,
                ]);
                return $this->respond(false, [], 'Aucune question active trouvée pour ce test', ['reason' => 'no_questions'], 422);
            }

            // Valider les réponses
            $questionIds = $test->questions->pluck('id')->toArray();
            $score = 0;
            $totalQuestions = count($questionIds);
            $answerMap = [];

            foreach ($answers as $answer) {
                $questionId = $answer['question_id'];
                $userAnswer = $answer['answer'];

                if (!in_array($questionId, $questionIds)) {
                    Log::warning('Invalid question ID in answers', [
                        'user_id' => $user->id,
                        'test_id' => $testId,
                        'question_id' => $questionId,
                    ]);
                    return $this->respond(false, [], 'ID de question invalide', ['question_id' => $questionId], 422);
                }

                $question = $test->questions->firstWhere('id', $questionId);
                $options = json_decode($question->getRawOriginal('options'), true);

                if (!is_array($options) || $userAnswer >= count($options)) {
                    Log::warning('Invalid answer index', [
                        'user_id' => $user->id,
                        'test_id' => $testId,
                        'question_id' => $questionId,
                        'answer' => $userAnswer,
                    ]);
                    return $this->respond(false, [], 'Index de réponse invalide', ['question_id' => $questionId], 422);
                }

                $answerMap[$questionId] = $userAnswer;
                if ($userAnswer === $question->correct_answer_index) {
                    $score++;
                }
            }

            // Appeler Gemini pour feedback et recommandation
            $feedback = $this->callGemini($test->questions, $answerMap, $user->goal ?? 'Non défini', true);

            // Mettre à jour l'utilisateur
            $user->is_first_time = false;
            $user->target_audience = $feedback['recommended_audience'];
            $user->save();

            Log::info('General test submitted successfully', [
                'user_id' => $user->id,
                'test_id' => $testId,
                'score' => $score,
                'total_questions' => $totalQuestions,
                'recommended_audience' => $feedback['recommended_audience'],
                'feedback' => $feedback,
            ]);

            return $this->respond(true, [
                'score' => $score,
                'total_questions' => $totalQuestions,
                'percentage' => ($totalQuestions > 0) ? round(($score / $totalQuestions) * 100, 2) : 0,
                'feedback' => $feedback,
                'recommended_audience' => $feedback['recommended_audience'],
            ], 'Test soumis avec succès');
        } catch (\Exception $e) {
            Log::error('Error in submitGeneralTest', [
                'user_id' => $user->id ?? 'unknown',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->respond(false, [], 'Erreur serveur lors de la soumission du test', [
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function callGemini($questions, $answers, $goal, $isGeneral = false)
    {
        try {
            $client = new Client();
            $apiKey = env('GEMINI_API_KEY');
            Log::info('Preparing Gemini API call', [
                'api_key_exists' => !empty($apiKey),
                'is_general' => $isGeneral,
                'goal' => $goal,
                'user_id' => Auth::id() ?: 'guest',
                'question_count' => $questions->count(),
                'answer_count' => count($answers),
            ]);

            if (empty($apiKey)) {
                Log::error('GEMINI_API_KEY is not set');
                throw new \Exception('GEMINI_API_KEY is not configured in .env');
            }

            if ($questions->isEmpty()) {
                Log::warning('No questions provided to Gemini');
                throw new \Exception('No questions available for analysis');
            }

            $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

            $studentResponses = [];
            foreach ($questions as $question) {
                $options = is_array($question->options) ? $question->options : json_decode($question->getRawOriginal('options'), true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    Log::error('Failed to parse options JSON in callGemini', [
                        'question_id' => $question->id,
                        'raw_options' => $question->getRawOriginal('options'),
                    ]);
                    continue;
                }
                $answerIndex = $answers[$question->id] ?? -1;
                $studentAnswer = ($answerIndex >= 0 && isset($options[$answerIndex])) ? $options[$answerIndex] : 'Non répondu';
                $correctAnswer = ($question->correct_answer_index !== null && isset($options[$question->correct_answer_index]))
                    ? $options[$question->correct_answer_index]
                    : 'Non défini';

                $studentResponses[] = [
                    'question' => $question->question,
                    'student_answer' => $studentAnswer,
                    'correct_answer' => $correctAnswer,
                    'is_correct' => $answerIndex == $question->correct_answer_index,
                ];
            }

            if (empty($studentResponses)) {
                Log::warning('No valid responses to analyze in callGemini');
                throw new \Exception('No valid responses available for analysis');
            }

            $prompt = "Analyze the following quiz responses from a user with the goal '$goal'. "
                . "Provide a structured feedback in JSON format with the following fields:\n"
                . "{\n"
                . "  \"points_forts\": [\"string\", ...],\n"
                . "  \"domaines_d_amélioration\": [\"string\", ...],\n"
                . "  \"recommandations\": [\"string\", ...],\n"
                . "  \"recommended_audience\": \"etudiant_maroc|etudiant_etranger|entrepreneur|salarie_etat|salarie_prive\"\n"
                . "}\n"
                . "For 'recommended_audience', choose the most suitable audience based on the user's responses. Consider the following:\n"
                . "- 'etudiant_maroc': Strong academic focus, interest in local education or job markets.\n"
                . "- 'etudiant_etranger': Interest in international opportunities or global education.\n"
                . "- 'entrepreneur': Responses showing innovation, risk-taking, or business interest.\n"
                . "- 'salarie_etat': Preference for stable, public-sector roles.\n"
                . "- 'salarie_prive': Interest in dynamic, private-sector opportunities.\n"
                . "Ensure the response is valid JSON without additional markdown or code blocks.\n"
                . "User responses: " . json_encode($studentResponses, JSON_PRETTY_PRINT);

            Log::info('Sending request to Gemini API', [
                'prompt_length' => strlen($prompt),
                'response_count' => count($studentResponses),
            ]);

            $response = $client->post($apiUrl . '?key=' . $apiKey, [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ],
                'json' => [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'response_mime_type' => 'application/json',
                    ],
                ],
                'timeout' => 30,
            ]);

            $rawBody = $response->getBody()->getContents();
            Log::info('Gemini API raw response', ['raw_body' => $rawBody]);

            $body = json_decode($rawBody, true);
            if (!isset($body['candidates'][0]['content']['parts'][0]['text'])) {
                Log::error('Invalid Gemini API response structure');
                throw new \Exception('Invalid API response structure');
            }

            $text = trim($body['candidates'][0]['content']['parts'][0]['text']);
            $parsedResponse = json_decode($text, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to parse Gemini response as JSON', [
                    'text' => $text,
                    'json_error' => json_last_error_msg(),
                ]);
                throw new \Exception('Failed to parse API response as JSON');
            }

            // Valider la structure
            $requiredKeys = ['points_forts', 'domaines_d_amélioration', 'recommandations', 'recommended_audience'];
            foreach ($requiredKeys as $key) {
                if (!isset($parsedResponse[$key])) {
                    Log::warning('Missing required key in Gemini response', ['key' => $key]);
                    throw new \Exception("Missing required key '$key' in API response");
                }
            }

            // Valider recommended_audience
            $validAudiences = ['etudiant_maroc', 'etudiant_etranger', 'entrepreneur', 'salarie_etat', 'salarie_prive'];
            if (!in_array($parsedResponse['recommended_audience'], $validAudiences)) {
                Log::warning('Invalid recommended_audience in Gemini response', [
                    'recommended_audience' => $parsedResponse['recommended_audience'],
                ]);
                $parsedResponse['recommended_audience'] = 'etudiant_maroc'; // Fallback
            }

            Log::info('Gemini API parsed response', ['response' => $parsedResponse]);
            return $parsedResponse;
        } catch (\Exception $e) {
            Log::error('Error in callGemini', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $fallback = [
                'points_forts' => ['Effort fourni dans le test'],
                'domaines_d_amélioration' => ['Analyse impossible : ' . $e->getMessage()],
                'recommandations' => ['Réessayez ou contactez le support'],
                'recommended_audience' => 'etudiant_maroc',
            ];

            return $fallback;
        }
    }
}