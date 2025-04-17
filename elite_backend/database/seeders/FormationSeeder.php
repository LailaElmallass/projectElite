<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Formation;

class FormationSeeder extends Seeder
{
    public function run()
    {
        $formations = [
            [
                'title' => "Leadership et Management d'équipe",
                'description' => "Apprenez à diriger efficacement une équipe et à développer vos compétences en leadership.",
                'duration' => "12h",
                'level' => "Intermédiaire",
                'students' => 1245,
                'rating' => 4.8,
                'image' => "/placeholder.svg",
                'category' => "Management",
                'instructor' => "Marie Dupont",
                'price' => 49.99,
            ],
            [
                'title' => "Communication professionnelle efficace",
                'description' => "Maîtrisez les techniques de communication pour améliorer vos interactions professionnelles.",
                'duration' => "8h",
                'level' => "Débutant",
                'students' => 2130,
                'rating' => 4.6,
                'image' => "/placeholder.svg",
                'category' => "Communication",
                'instructor' => "Thomas Martin",
                'price' => 29.99,
            ],
            [
                'title' => "Analyse de données pour la prise de décision",
                'description' => "Utilisez les données pour prendre des décisions stratégiques éclairées.",
                'duration' => "15h",
                'level' => "Avancé",
                'students' => 876,
                'rating' => 4.9,
                'image' => "/placeholder.svg",
                'category' => "Analyse",
                'instructor' => "Sophie Bernard",
                'price' => 59.99,
            ],
            [
                'title' => "Gestion de projet agile",
                'description' => "Apprenez les méthodologies agiles pour gérer vos projets avec efficacité.",
                'duration' => "10h",
                'level' => "Intermédiaire",
                'students' => 1567,
                'rating' => 4.7,
                'image' => "/placeholder.svg",
                'category' => "Gestion de projet",
                'instructor' => "David Lambert",
                'price' => 39.99,
            ],
            [
                'title' => "Négociation commerciale",
                'description' => "Développez vos compétences en négociation pour conclure des accords avantageux.",
                'duration' => "6h",
                'level' => "Intermédiaire",
                'students' => 1089,
                'rating' => 4.5,
                'image' => "/placeholder.svg",
                'category' => "Vente",
                'instructor' => "Julie Moreau",
                'price' => 19.99,
            ],
            [
                'title' => "Intelligence émotionnelle au travail",
                'description' => "Améliorez vos relations professionnelles grâce à l'intelligence émotionnelle.",
                'duration' => "5h",
                'level' => "Débutant",
                'students' => 2310,
                'rating' => 4.8,
                'image' => "/placeholder.svg",
                'category' => "Développement personnel",
                'instructor' => "Nicolas Petit",
                'price' => 15.99,
            ],
        ];

        foreach ($formations as $formation) {
            Formation::create($formation);
        }
    }
}