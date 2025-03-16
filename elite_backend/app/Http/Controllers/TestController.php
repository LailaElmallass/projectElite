<?php
namespace App\Http\Controllers;

use App\Models\Test;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use GuzzleHttp\Client;

class TestController extends Controller
{
    public function index()
    {
        $tests = Test::withCount('questions')->get();
        return response()->json($tests);
    }

    public function getQuestions($testId)
    {
        $test = Test::with('questions')->findOrFail($testId);
        \Log::info('Test avec questions:', $test->toArray());
        return response()->json($test);
    }

    public function storeTest(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'duration' => 'required|string|max:50',
            'description' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $test = Test::create([
            'title' => $request->title,
            'duration' => $request->duration,
            'description' => $request->description,
            'questions_count' => 0,
        ]);

        return response()->json(['message' => 'Test créé avec succès', 'test' => $test], 201);
    }

    public function storeQuestion(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'test_id' => 'required|exists:tests,id',
            'question' => 'required|string',
            'options' => 'required|array|min:2',
            'options.*' => 'required|string|max:255',
            'correct_answer_index' => 'required|integer|min:0|max:' . (count($request->options) - 1),
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $question = Question::create([
            'test_id' => $request->test_id,
            'question' => $request->question,
            'options' => json_encode($request->options),
            'correct_answer_index' => $request->correct_answer_index,
        ]);

        $test = Test::find($request->test_id);
        $test->questions_count = $test->questions()->count();
        $test->save();

        return response()->json(['message' => 'Question ajoutée avec succès', 'question' => $question], 201);
    }

    public function updateQuestion(Request $request, $id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $question = Question::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'test_id' => 'required|exists:tests,id',
            'question' => 'required|string',
            'options' => 'required|array|min:2',
            'options.*' => 'required|string|max:255',
            'correct_answer_index' => 'required|integer|min:0|max:' . (count($request->options) - 1),
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $question->update([
            'test_id' => $request->test_id,
            'question' => $request->question,
            'options' => json_encode($request->options),
            'correct_answer_index' => $request->correct_answer_index,
        ]);

        $test = Test::find($request->test_id);
        $test->questions_count = $test->questions()->count();
        $test->save();

        return response()->json(['message' => 'Question modifiée avec succès', 'question' => $question]);
    }

    public function deleteQuestion($id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $question = Question::findOrFail($id);
        $testId = $question->test_id;
        $question->delete();

        $test = Test::find($testId);
        $test->questions_count = $test->questions()->count();
        $test->save();

        return response()->json(['message' => 'Question supprimée avec succès']);
    }

    public function deleteTest($id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $test = Test::findOrFail($id);
        
        // Delete all associated questions
        Question::where('test_id', $test->id)->delete();
        
        // Delete the test
        $test->delete();

        return response()->json(['message' => 'Test et ses questions supprimés avec succès']);
    }

    public function submit(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'test_id' => 'required|exists:tests,id',
            'answers' => 'required|array',
        ]);

        try {
            $test = Test::with('questions')->findOrFail($data['test_id']);
            $questions = $test->questions;

            if ($questions->isEmpty()) {
                return response()->json(['error' => 'Aucune question trouvée pour ce test'], 400);
            }

            $feedback = $this->callGemini($questions, $data['answers']);

            if ($user->is_first_time) {
                $user->is_first_time = false;
                $user->save();
            }

            return response()->json(['feedback' => $feedback]);
        } catch (\Exception $e) {
            Log::error('Erreur dans submit : ', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => 'Erreur serveur lors de la soumission',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    private function callGemini($questions, $answers)
    {
        $client = new Client();
        $apiKey = env('GEMINI_API_KEY');

        if (empty($apiKey)) {
            \Log::error('Clé API Gemini manquante dans .env');
            return [
                'points_forts' => ['Configuration manquante'],
                'domaines_d_amélioration' => ['Clé API non définie'],
                'recommandations' => ['Ajoutez GEMINI_API_KEY dans .env'],
            ];
        }

        $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

        $studentResponses = [];
        foreach ($questions as $question) {
            // Vérifier si options est une chaîne JSON ou déjà un tableau
            $options = is_string($question->options) ? json_decode($question->options, true) : $question->options;

            if (!is_array($options)) {
                \Log::error('Options invalides pour la question : ', ['question_id' => $question->id]);
                $studentResponses[] = [
                    'question' => $question->question,
                    'student_answer' => 'Non disponible',
                    'right_answer' => 'Non défini',
                ];
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

        $prompt = "Analysez les réponses suivantes d'un étudiant à un quiz et retournez UNIQUEMENT un objet JSON valide avec les champs suivants, sans texte supplémentaire :\n"
            . "{\n"
            . "  \"points_forts\": [\"...\"],\n"
            . "  \"domaines_d_amélioration\": [\"...\"],\n"
            . "  \"recommandations\": [\"...\"]\n"
            . "}\n"
            . "Les réponses de l'étudiant sont : " . json_encode($studentResponses);

        \Log::info('Prompt envoyé à Gemini : ', ['prompt' => $prompt]);

        try {
            $response = $client->post($apiUrl . '?key=' . $apiKey, [
                'headers' => ['Content-Type' => 'application/json'],
                'json' => [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 500,
                    ],
                ],
            ]);

            $rawBody = $response->getBody()->getContents();
            \Log::info('Réponse API Gemini brute : ', ['raw' => $rawBody]);

            $body = json_decode($rawBody, true);
            if (!isset($body['candidates']) || !isset($body['candidates'][0]['content']['parts'][0]['text'])) {
                throw new \Exception('Structure de réponse API invalide : champs manquants');
            }

            $text = trim($body['candidates'][0]['content']['parts'][0]['text']);
            if (strpos($text, '```json') === 0) {
                $text = trim(substr($text, 7, -3)); // Supprimer ```json et ```
            }

            $feedback = json_decode($text, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Erreur de décodage JSON : ' . json_last_error_msg() . ' - Contenu : ' . $text);
            }

            if (!isset($feedback['points_forts']) || !isset($feedback['domaines_d_amélioration']) || !isset($feedback['recommandations'])) {
                throw new \Exception('Structure de feedback invalide : ' . json_encode($feedback));
            }

            return $feedback;
        } catch (\Exception $e) {
            \Log::error('Erreur dans callGemini : ', ['message' => $e->getMessage()]);
            return [
                'points_forts' => ['Erreur de traitement'],
                'domaines_d_amélioration' => ['Erreur : ' . $e->getMessage()],
                'recommandations' => ['Vérifiez les logs serveur'],
            ];
        }
    }
}