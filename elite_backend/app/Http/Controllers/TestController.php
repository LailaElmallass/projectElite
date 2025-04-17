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
                $query->select('id', 'test_id', 'question', 'options', 'correct_answer_index');
            }])->find($testId);

            if (!$test) {
                Log::warning('Test not found', ['test_id' => $testId, 'user_id' => Auth::id() ?: 'guest']);
                return $this->respond(false, [], 'Test not found', [], 404);
            }

            $questions = $test->questions->map(function ($question) use ($testId) {
                $rawOptions = $question->getRawOriginal('options');
                $options = is_array($question->options) ? $question->options : [];
                if (empty($options) && $rawOptions) {
                    Log::warning('Invalid options for question', [
                        'test_id' => $testId,
                        'question_id' => $question->id,
                        'raw_options' => $rawOptions
                    ]);
                }
                return [
                    'id' => $question->id,
                    'question' => $question->question,
                    'options' => $options,
                    'correct_answer_index' => $question->correct_answer_index,
                ];
            });

            Log::info('Questions fetched', [
                'test_id' => $testId,
                'question_count' => $questions->count(),
                'user_id' => Auth::id() ?: 'guest'
            ]);

            return $this->respond(true, ['questions' => $questions->values()], 'Questions retrieved successfully');
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
                $query->select('id', 'test_id', 'question', 'options', 'correct_answer_index');
            }])->find($id);

            if (!$test) {
                Log::warning('Test not found', ['test_id' => $id, 'user_id' => Auth::id() ?: 'guest']);
                return $this->respond(false, [], 'Test not found', [], 404);
            }

            $test->questions = $test->questions->map(function ($question) use ($id) {
                $rawOptions = $question->getRawOriginal('options');
                $options = is_array($question->options) ? $question->options : [];
                if (empty($options) && $rawOptions) {
                    Log::warning('Invalid options for question', [
                        'test_id' => $id,
                        'question_id' => $question->id,
                        'raw_options' => $rawOptions
                    ]);
                }
                return [
                    'id' => $question->id,
                    'question' => $question->question,
                    'options' => $options,
                    'correct_answer_index' => $question->correct_answer_index,
                ];
            });

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
                    'correct_answer_index' => (int) $questionData['correct_answer_index'],
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

        $validator = Validator::make($request->all(), $this->getTestValidationRules(true), [
            'title.string' => 'The title must be a string.',
            'title.max' => 'The title must not exceed 255 characters.',
            'duration.string' => 'The duration must be a string.',
            'duration.max' => 'The duration must not exceed 50 characters.',
            'description.string' => 'The description must be a string.',
            'is_general.boolean' => 'The is_general field must be true or false.',
            'target_audience.required_if' => 'The target audience is required when the test is not general.',
            'target_audience.in' => 'The selected target audience is invalid.',
            'is_student.required_if' => 'The is_student field is required when the test is general.',
            'is_student.boolean' => 'The is_student field must be true or false.',
            'questions.required' => 'At least one question is required.',
            'questions.array' => 'Questions must be an array.',
            'questions.min' => 'At least one question is required.',
            'questions.*.question.required' => 'Each question must have a question text.',
            'questions.*.question.string' => 'Each question must be a string.',
            'questions.*.options.required' => 'Each question must have options.',
            'questions.*.options.array' => 'Options must be an array.',
            'questions.*.options.min' => 'Each question must have at least 2 options.',
            'questions.*.options.*.required' => 'Each option must be a non-empty string.',
            'questions.*.options.*.string' => 'Each option must be a string.',
            'questions.*.correct_answer_index.required' => 'Each question must specify a correct answer index.',
            'questions.*.correct_answer_index.integer' => 'The correct answer index must be an integer.',
            'questions.*.correct_answer_index.min' => 'The correct answer index must be at least 0.',
        ]);

        if ($validator->fails()) {
            Log::warning('Validation failed for test update', [
                'test_id' => $testId,
                'errors' => $validator->errors()->all(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()->all(),
                'data' => []
            ], 422);
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
                        return response()->json([
                            'success' => false,
                            'message' => "Question at index $index must have at least 2 valid options",
                            'errors' => [],
                            'data' => []
                        ], 422);
                    }
                    if ($questionData['correct_answer_index'] >= count($options)) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "Correct answer index for question at index $index is out of bounds",
                            'errors' => [],
                            'data' => []
                        ], 422);
                    }

                    $question->test_id = $test->id;
                    $question->question = $questionData['question'];
                    $question->options = json_encode($options);
                    $question->correct_answer_index = (int) $questionData['correct_answer_index'];
                    $question->save();
                }
            }

            $test->questions_count = $test->questions()->count();
            $test->save();
            DB::commit();

            Log::info('Test updated successfully', ['test_id' => $testId, 'question_count' => $test->questions_count]);
            return response()->json([
                'success' => true,
                'message' => 'Test updated successfully',
                'data' => ['test' => $test->fresh(['questions'])]
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating test', [
                'test_id' => $testId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error updating test: ' . $e->getMessage(),
                'errors' => [],
                'data' => []
            ], 500);
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
                'correct_answer_index' => (int) $request->correct_answer_index,
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

            $test = Test::with('questions')->findOrFail($data['test_id']);
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
                $options = is_array($question->options) ? $question->options : [];
                if ($answerIndex >= count($options)) {
                    Log::warning('Answer index out of bounds', ['question_id' => $questionId, 'answer_index' => $answerIndex]);
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

    public function getGeneralTest()
    {
        try {
            $user = Auth::user();
            Log::info('Fetching general tests', [
                'user_id' => $user->id,
                'is_student' => $user->is_student,
                'is_first_time' => $user->is_first_time,
            ]);

            if (is_null($user->is_student)) {
                Log::info('User needs student selection', ['user_id' => $user->id]);
                return $this->respond(true, [
                    'tests' => [],
                    'needs_student_selection' => true,
                ], 'Student status required');
            }

            if (!$user->is_first_time) {
                Log::info('User is not first-time, ineligible for general test', ['user_id' => $user->id]);
                return $this->respond(true, [
                    'tests' => [],
                    'needs_student_selection' => false,
                ], 'User has already completed the general test', ['reason' => 'not_first_time']);
            }

            $tests = Test::where('is_general', true)
                ->whereNull('target_audience')
                ->where('is_student', $user->is_student)
                ->whereNull('deleted_at')
                ->with(['questions' => function ($query) {
                    $query->whereNull('deleted_at')
                          ->select('id', 'test_id', 'question', 'options', 'correct_answer_index');
                }])
                ->get();

            Log::info('Raw tests query', [
                'user_id' => $user->id,
                'is_student' => $user->is_student,
                'test_count' => $tests->count(),
                'tests' => $tests->map(function ($test) {
                    return [
                        'id' => $test->id,
                        'title' => $test->title,
                        'is_general' => $test->is_general,
                        'is_student' => $test->is_student,
                        'target_audience' => $test->target_audience,
                        'questions_count' => $test->questions_count,
                        'questions' => $test->questions->toArray(),
                    ];
                })->toArray(),
            ]);

            $filteredTests = $tests->map(function ($test) {
                $test->questions = $test->questions->map(function ($question) use ($test) {
                    try {
                        $options = json_decode($question->options, true);
                        Log::info('Processing question options', [
                            'test_id' => $test->id,
                            'question_id' => $question->id,
                            'options_raw' => $question->options,
                            'options_parsed' => $options,
                            'options_type' => gettype($options),
                            'options_count' => is_array($options) ? count($options) : 0,
                            'correct_answer_index' => $question->correct_answer_index,
                            'correct_answer_index_type' => gettype($question->correct_answer_index),
                        ]);
                        if (!is_array($options)) {
                            Log::warning('Options is not an array', [
                                'test_id' => $test->id,
                                'question_id' => $question->id,
                                'options' => $question->options,
                            ]);
                            return null;
                        }
                        if (count($options) < 2) {
                            Log::warning('Options has fewer than 2 items', [
                                'test_id' => $test->id,
                                'question_id' => $question->id,
                                'options' => $options,
                            ]);
                            return null;
                        }
                        if (!is_numeric($question->correct_answer_index)) {
                            Log::warning('Correct answer index is not numeric', [
                                'test_id' => $test->id,
                                'question_id' => $question->id,
                                'correct_answer_index' => $question->correct_answer_index,
                            ]);
                            return null;
                        }
                        if ($question->correct_answer_index >= count($options)) {
                            Log::warning('Correct answer index out of bounds', [
                                'test_id' => $test->id,
                                'question_id' => $question->id,
                                'correct_answer_index' => $question->correct_answer_index,
                                'options_count' => count($options),
                            ]);
                            return null;
                        }
                        return [
                            'id' => $question->id,
                            'question' => $question->question,
                            'options' => $options,
                            'correct_answer_index' => (int) $question->correct_answer_index,
                        ];
                    } catch (\Exception $e) {
                        Log::error('Error parsing question options', [
                            'test_id' => $test->id,
                            'question_id' => $question->id,
                            'options' => $question->options,
                            'error' => $e->getMessage(),
                        ]);
                        return null;
                    }
                })->filter()->values();

                Log::info('Questions after filtering', [
                    'test_id' => $test->id,
                    'question_count' => $test->questions->count(),
                ]);

                return $test->questions->isNotEmpty() ? $test : null;
            })->filter()->values();

            if ($filteredTests->isEmpty()) {
                Log::warning('No valid tests found after filtering', [
                    'user_id' => $user->id,
                    'is_student' => $user->is_student,
                    'reason' => 'no_valid_tests',
                ]);
                return $this->respond(true, [
                    'tests' => [],
                    'needs_student_selection' => false,
                ], 'No general tests for this profile', ['reason' => 'no_valid_tests']);
            }

            Log::info('Valid tests returned', [
                'user_id' => $user->id,
                'test_count' => $filteredTests->count(),
                'test_ids' => $filteredTests->pluck('id')->toArray(),
            ]);

            return $this->respond(true, [
                'tests' => $filteredTests,
                'needs_student_selection' => false,
            ], 'General tests retrieved successfully');
        } catch (\Exception $e) {
            Log::error('Error in getGeneralTest', [
                'user_id' => Auth::id() ?: 'guest',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->respond(false, [], 'Server error retrieving general tests', [$e->getMessage()], 500);
        }
    }

    public function submitGeneralTest(Request $request)
    {
        try {
            $user = $request->user();
            $data = $request->validate([
                'answers' => 'required|array',
            ]);

            if (is_null($user->is_student)) {
                Log::warning('User has not selected student status', ['user_id' => $user->id]);
                return $this->respond(false, [], 'Student status required', [], 400);
            }

            $test = Test::where('is_general', true)
                ->where('is_student', $user->is_student)
                ->with(['questions' => function ($query) {
                    $query->select('id', 'test_id', 'question', 'options', 'correct_answer_index');
                }])
                ->first();

            if (!$test) {
                Log::warning('No general test found', ['user_id' => $user->id, 'is_student' => $user->is_student]);
                return $this->respond(false, [], 'No general test available', [], 404);
            }

            $questions = $test->questions;
            if ($questions->isEmpty()) {
                Log::warning('No questions found for general test', ['test_id' => $test->id, 'user_id' => $user->id]);
                return $this->respond(false, [], 'No questions found for this test', [], 400);
            }

            foreach ($data['answers'] as $questionId => $answerIndex) {
                if (!is_numeric($answerIndex) || !Question::where('id', $questionId)->exists()) {
                    Log::warning('Invalid answer data for general test', ['question_id' => $questionId, 'answer_index' => $answerIndex]);
                    return $this->respond(false, [], 'Invalid answer data', [], 422);
                }
                $question = $questions->firstWhere('id', $questionId);
                $options = is_array($question->options) ? $question->options : [];
                if ($answerIndex >= count($options)) {
                    Log::warning('Answer index out of bounds for general test', ['question_id' => $questionId, 'answer_index' => $answerIndex]);
                    return $this->respond(false, [], 'Answer index out of bounds', [], 422);
                }
            }

            $feedback = $this->callGemini($questions, $data['answers'], $user->goal ?? 'Non défini', true);

            $user->update([
                'target_audience' => $feedback['recommended_audience'] ?? 'etudiant_maroc',
                'is_first_time' => false,
            ]);

            return $this->respond(true, ['feedback' => $feedback], 'General test submitted successfully');
        } catch (\Exception $e) {
            Log::error('Error in submitGeneralTest', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->respond(false, [], 'Server error submitting general test', [$e->getMessage()], 500);
        }
    }

    private function callGemini($questions, $answers, $goal, $isGeneral = false)
    {
        try {
            $client = new Client();
            $apiKey = env('GEMINI_API_KEY');

            if (empty($apiKey)) {
                Log::warning('GEMINI_API_KEY is not set');
                return [
                    'points_forts' => ['Tentative d’analyse'],
                    'domaines_d_amélioration' => ['Configuration manquante'],
                    'recommandations' => ['Vérifiez la configuration de l’API'],
                    'recommended_audience' => $isGeneral ? 'etudiant_maroc' : null,
                ];
            }

            $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

            $studentResponses = [];
            foreach ($questions as $question) {
                $options = is_array($question->options) ? $question->options : [];
                if (empty($options)) {
                    Log::warning('Invalid question options in callGemini', ['question_id' => $question->id]);
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
                    'right_answer' => $correctAnswer,
                ];
            }

            if (empty($studentResponses)) {
                Log::warning('No valid responses to analyze in callGemini');
                return [
                    'points_forts' => ['Aucune réponse analysée'],
                    'domaines_d_amélioration' => ['Réponses manquantes'],
                    'recommandations' => ['Vérifiez les questions'],
                    'recommended_audience' => $isGeneral ? 'etudiant_maroc' : null,
                ];
            }

            $prompt = "Analysez les réponses suivantes d’un utilisateur ayant pour objectif '$goal' à un quiz. "
                . "Retournez UNIQUEMENT un objet JSON valide avec les champs suivants :\n"
                . "{\n"
                . "  \"points_forts\": [\"...\"],\n"
                . "  \"domaines_d_amélioration\": [\"...\"],\n"
                . "  \"recommandations\": [\"...\"]\n";
            if ($isGeneral) {
                $prompt .= ",  \"recommended_audience\": \"etudiant_maroc|etudiant_etranger|entrepreneur|salarie_etat|salarie_prive\"\n";
            }
            $prompt .= "}\n"
                . "Réponses de l’utilisateur : " . json_encode($studentResponses);

            $response = $client->post($apiUrl . '?key=' . $apiKey, [
                'headers' => ['Content-Type' => 'application/json'],
                'json' => [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]],
                    ],
                ],
            ]);

            $rawBody = $response->getBody()->getContents();
            $body = json_decode($rawBody, true);
            if (!isset($body['candidates'][0]['content']['parts'][0]['text'])) {
                throw new \Exception('Invalid API response structure');
            }

            $text = trim($body['candidates'][0]['content']['parts'][0]['text']);
            if (strpos($text, '```json') === 0) {
                $text = trim(substr($text, 7, -3));
            }

            $parsedResponse = json_decode($text, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Failed to parse API response as JSON: ' . json_last_error_msg());
            }

            return $parsedResponse;
        } catch (\Exception $e) {
            Log::error('Error in callGemini', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return [
                'points_forts' => ['Effort fourni'],
                'domaines_d_amélioration' => ['Erreur API'],
                'recommandations' => ['Vérifiez les logs'],
                'recommended_audience' => $isGeneral ? 'etudiant_maroc' : null,
            ];
        }
    }
}