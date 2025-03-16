<?php

namespace Database\Seeders;

use App\Models\Test;
use App\Models\Question;
use Illuminate\Database\Seeder;

class TestSeeder extends Seeder
{
    public function run()
    {
        $tests = [
            ['title' => "Test d'aptitudes professionnelles", 'duration' => "30 minutes", 'questions_count' => 5, 'description' => "Évaluez vos compétences en leadership, communication et résolution de problèmes."],
            ['title' => "Test de personnalité au travail", 'duration' => "20 minutes", 'questions_count' => 5, 'description' => "Découvrez votre type de personnalité et les environnements de travail qui vous conviennent."],
            ['title' => "Évaluation des compétences techniques", 'duration' => "45 minutes", 'questions_count' => 5, 'description' => "Mesurez vos connaissances techniques dans divers domaines spécifiques à votre secteur."],
        ];

        foreach ($tests as $testData) {
            $test = Test::create($testData);

            $questions = [
                ['question' => "Face à un conflit au sein de votre équipe, vous préférez généralement :", 'options' => ["Intervenir immédiatement et imposer une solution", "Réunir toutes les parties pour une discussion ouverte", "Laisser les personnes concernées résoudre le problème elles-mêmes", "Consulter individuellement chaque personne avant de proposer une solution"]],
                ['question' => "Quand vous devez prendre une décision importante, vous vous appuyez principalement sur :", 'options' => ["Des données et des faits concrets", "Votre intuition et votre ressenti", "Les conseils de personnes expérimentées", "Une analyse des avantages et inconvénients"]],
                ['question' => "Dans un projet d'équipe, vous préférez généralement :", 'options' => ["Planifier et organiser l'ensemble du travail", "Générer des idées créatives", "Faciliter la communication entre les membres", "Vous concentrer sur les détails et la qualité"]],
                ['question' => "Lorsque vous apprenez une nouvelle compétence, vous préférez :", 'options' => ["Suivre des instructions précises étape par étape", "Comprendre le concept global puis explorer par vous-même", "Observer quelqu'un d'autre le faire d'abord", "Apprendre par essai-erreur"]],
                ['question' => "Face à un changement soudain dans votre environnement de travail, vous :", 'options' => ["Vous adaptez rapidement et cherchez des opportunités", "Analysez la situation avant de décider comment réagir", "Recherchez des informations sur les raisons du changement", "Vous inquiétez des impacts potentiels sur votre travail"]],
            ];

            foreach ($questions as $questionData) {
                Question::create(array_merge($questionData, ['test_id' => $test->id]));
            }
        }
    }
}