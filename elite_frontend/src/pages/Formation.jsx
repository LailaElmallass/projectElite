import React, { useState } from 'react';
import { Search, Filter, Clock, BookOpen, Star, Users, ChevronRight, CheckCircle } from 'lucide-react';

const formationsData = [
  {
    id: 1,
    title: "Leadership et Management d'équipe",
    description: "Apprenez à diriger efficacement une équipe et à développer vos compétences en leadership.",
    duration: "12h",
    level: "Intermédiaire",
    students: 1245,
    rating: 4.8,
    image: "/placeholder.svg",
    category: "Management",
    instructor: "Marie Dupont",
    progress: 35
  },
  {
    id: 2,
    title: "Communication professionnelle efficace",
    description: "Maîtrisez les techniques de communication pour améliorer vos interactions professionnelles.",
    duration: "8h",
    level: "Débutant",
    students: 2130,
    rating: 4.6,
    image: "/placeholder.svg",
    category: "Communication",
    instructor: "Thomas Martin",
    progress: 0
  },
  {
    id: 3,
    title: "Analyse de données pour la prise de décision",
    description: "Utilisez les données pour prendre des décisions stratégiques éclairées.",
    duration: "15h",
    level: "Avancé",
    students: 876,
    rating: 4.9,
    image: "/placeholder.svg",
    category: "Analyse",
    instructor: "Sophie Bernard",
    progress: 0
  },
  {
    id: 4,
    title: "Gestion de projet agile",
    description: "Apprenez les méthodologies agiles pour gérer vos projets avec efficacité.",
    duration: "10h",
    level: "Intermédiaire",
    students: 1567,
    rating: 4.7,
    image: "/placeholder.svg",
    category: "Gestion de projet",
    instructor: "David Lambert",
    progress: 100
  },
  {
    id: 5,
    title: "Négociation commerciale",
    description: "Développez vos compétences en négociation pour conclure des accords avantageux.",
    duration: "6h",
    level: "Intermédiaire",
    students: 1089,
    rating: 4.5,
    image: "/placeholder.svg",
    category: "Vente",
    instructor: "Julie Moreau",
    progress: 65
  },
  {
    id: 6,
    title: "Intelligence émotionnelle au travail",
    description: "Améliorez vos relations professionnelles grâce à l'intelligence émotionnelle.",
    duration: "5h",
    level: "Débutant",
    students: 2310,
    rating: 4.8,
    image: "/placeholder.svg",
    category: "Développement personnel",
    instructor: "Nicolas Petit",
    progress: 0
  }
];

const categories = [
  "Tous",
  "Management",
  "Communication",
  "Analyse",
  "Gestion de projet",
  "Vente",
  "Développement personnel"
];

const levels = ["Tous", "Débutant", "Intermédiaire", "Avancé"];

const Formations = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedLevel, setSelectedLevel] = useState('Tous');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFormation, setActiveFormation] = useState(null);

  const toggleFilters = () => setShowFilters(!showFilters);

  const filteredFormations = formationsData.filter(formation => {
    const matchesSearch = formation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         formation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         formation.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || formation.category === selectedCategory;
    const matchesLevel = selectedLevel === 'Tous' || formation.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const viewFormation = (id) => setActiveFormation(formationsData.find(f => f.id === id));
  const backToList = () => setActiveFormation(null);

  if (activeFormation) {
    return (
      <div className="container mx-auto py-10 px-6 max-w-7xl">
        <button 
          onClick={backToList}
          className="flex items-center text-sm font-medium text-elite-black-600 dark:text-elite-yellow-200 hover:text-elite-red-600 transition-colors mb-6"
        >
          <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
          Retour aux formations
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Détails de la formation */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-elite-yellow-50 dark:bg-elite-black-900 rounded-xl shadow-lg overflow-hidden transform transition-all hover:shadow-xl">
              <img 
                src={activeFormation.image} 
                alt={activeFormation.title} 
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <h1 className="text-2xl font-bold text-elite-black-900 dark:text-elite-yellow-100 mb-3">{activeFormation.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-elite-black-500 dark:text-elite-yellow-400 mb-4">
                  <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {activeFormation.duration}</span>
                  <span className="flex items-center"><BookOpen className="h-4 w-4 mr-1" /> {activeFormation.level}</span>
                  <span className="flex items-center"><Users className="h-4 w-4 mr-1" /> {activeFormation.students} apprenants</span>
                  <span className="flex items-center"><Star className="h-4 w-4 mr-1 text-elite-yellow-500" /> {activeFormation.rating}/5</span>
                </div>
                <p className="text-elite-black-600 dark:text-elite-yellow-200 mb-6">{activeFormation.description}</p>
                <div className="border-t border-elite-black-200 dark:border-elite-black-700 pt-4">
                  <h3 className="font-semibold text-elite-black-900 dark:text-elite-yellow-100 mb-3">Ce que vous apprendrez</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Développer votre leadership",
                      "Gérer efficacement une équipe",
                      "Résoudre les conflits",
                      "Déléguer avec efficacité",
                      "Motiver vos collaborateurs",
                      "Mener des réunions productives"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start text-elite-black-700 dark:text-elite-yellow-200">
                        <CheckCircle className="h-5 w-5 text-elite-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-elite-yellow-50 dark:bg-elite-black-900 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-elite-black-900 dark:text-elite-yellow-100 mb-4">Contenu de la formation</h2>
              <div className="space-y-4">
                {[
                  { title: "Introduction au leadership", duration: "1h", completed: activeFormation.progress >= 20 },
                  { title: "Styles de management", duration: "2h", completed: activeFormation.progress >= 40 },
                  { title: "Communication efficace", duration: "2h30", completed: activeFormation.progress >= 60 },
                  { title: "Gestion des conflits", duration: "2h", completed: activeFormation.progress >= 80 },
                  { title: "Motivation d'équipe", duration: "2h30", completed: activeFormation.progress >= 100 },
                  { title: "Évaluation et feedback", duration: "2h", completed: activeFormation.progress >= 100 }
                ].map((module, index) => (
                  <div 
                    key={index} 
                    className={`p-4 border rounded-lg flex justify-between items-center transition-all ${
                      module.completed ? 'border-elite-red-500/50 bg-elite-red-50 dark:bg-elite-red-900/20' : 'border-elite-black-200 dark:border-elite-black-700'
                    }`}
                  >
                    <div className="flex items-center">
                      {module.completed ? (
                        <div className="w-6 h-6 rounded-full bg-elite-red-100 dark:bg-elite-red-700 text-elite-red-500 flex items-center justify-center mr-3">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-elite-black-200 dark:bg-elite-black-600 text-elite-black-500 dark:text-elite-yellow-300 flex items-center justify-center mr-3">
                          {index + 1}
                        </div>
                      )}
                      <h3 className={`font-medium ${module.completed ? 'text-elite-red-600 dark:text-elite-red-400' : 'text-elite-black-900 dark:text-elite-yellow-100'}`}>
                        {module.title}
                      </h3>
                    </div>
                    <span className="text-sm text-elite-black-500 dark:text-elite-yellow-400">{module.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-elite-yellow-50 dark:bg-elite-black-900 rounded-xl shadow-lg p-6 sticky top-20">
              {activeFormation.progress > 0 && activeFormation.progress < 100 ? (
                <>
                  <div className="mb-6">
                    <h3 className="font-semibold text-elite-black-900 dark:text-elite-yellow-100">Votre progression</h3>
                    <div className="flex items-center justify-between text-sm text-elite-black-600 dark:text-elite-yellow-300 mt-2">
                      <span>{activeFormation.progress}% complété</span>
                      <span>En cours</span>
                    </div>
                    <div className="mt-2 h-2 bg-elite-black-200 dark:bg-elite-black-700 rounded-full overflow-hidden">
                      <div 
                        className="bg-elite-red-500 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${activeFormation.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <button className="w-full bg-elite-red-600 text-white py-2 px-4 rounded-lg hover:bg-elite-red-700 transition-colors mb-3">
                    Continuer la formation
                  </button>
                </>
              ) : activeFormation.progress === 100 ? (
                <>
                  <div className="mb-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-elite-red-100 dark:bg-elite-red-700 text-elite-red-500 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-elite-black-900 dark:text-elite-yellow-100">Formation complétée !</h3>
                    <p className="text-sm text-elite-black-500 dark:text-elite-yellow-400 mt-1">Vous avez terminé cette formation.</p>
                  </div>
                  <button className="w-full bg-elite-black-200 dark:bg-elite-black-600 text-elite-black-900 dark:text-elite-yellow-100 py-2 px-4 rounded-lg hover:bg-elite-black-300 dark:hover:bg-elite-black-500 transition-colors mb-3">
                    Revoir la formation
                  </button>
                </>
              ) : (
                <button className="w-full bg-elite-red-600 text-white py-2 px-4 rounded-lg hover:bg-elite-red-700 transition-colors mb-3">
                  Commencer la formation
                </button>
              )}
              <button className="w-full bg-elite-black-200 dark:bg-elite-black-600 text-elite-black-900 dark:text-elite-yellow-100 py-2 px-4 rounded-lg hover:bg-elite-black-300 dark:hover:bg-elite-black-500 transition-colors">
                Télécharger les ressources
              </button>

              <div className="mt-6 pt-6 border-t border-elite-black-200 dark:border-elite-black-700">
                <h3 className="font-semibold text-elite-black-900 dark:text-elite-yellow-100 mb-3">Formateur</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-elite-black-200 dark:bg-elite-black-600 flex items-center justify-center text-elite-black-700 dark:text-elite-yellow-100 font-medium mr-3">
                    {activeFormation.instructor.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-elite-black-900 dark:text-elite-yellow-100">{activeFormation.instructor}</p>
                    <p className="text-sm text-elite-black-500 dark:text-elite-yellow-400">Expert en {activeFormation.category}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-elite-black-200 dark:border-elite-black-700">
                <h3 className="font-semibold text-elite-black-900 dark:text-elite-yellow-100 mb-3">Informations</h3>
                <ul className="space-y-2 text-sm text-elite-black-600 dark:text-elite-yellow-300">
                  <li className="flex justify-between"><span className="text-elite-black-500 dark:text-elite-yellow-400">Catégorie</span><span>{activeFormation.category}</span></li>
                  <li className="flex justify-between"><span className="text-elite-black-500 dark:text-elite-yellow-400">Niveau</span><span>{activeFormation.level}</span></li>
                  <li className="flex justify-between"><span className="text-elite-black-500 dark:text-elite-yellow-400">Durée</span><span>{activeFormation.duration}</span></li>
                  <li className="flex justify-between"><span className="text-elite-black-500 dark:text-elite-yellow-400">Mise à jour</span><span>Juin 2023</span></li>
                </ul>
              </div>

              <div className="mt-6 pt-6 border-t border-elite-black-200 dark:border-elite-black-700">
                <h3 className="font-semibold text-elite-black-900 dark:text-elite-yellow-100 mb-3">Partager</h3>
                <div className="flex gap-2">
                  {['twitter', 'linkedin', 'instagram', 'facebook'].map((platform, i) => (
                    <button key={i} className="p-2 bg-elite-black-200 dark:bg-elite-black-600 rounded-lg hover:bg-elite-black-300 dark:hover:bg-elite-black-500 transition-colors">
                      <svg className="h-5 w-5 text-elite-black-700 dark:text-elite-yellow-100" fill="currentColor" viewBox="0 0 24 24">
                        {platform === 'twitter' && <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />}
                        {platform === 'linkedin' && <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />}
                        {platform === 'instagram' && <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />}
                        {platform === 'facebook' && <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />}
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-elite-black-900 dark:text-elite-yellow-100 mb-2">Formations</h1>
        <p className="text-elite-black-600 dark:text-elite-yellow-200">Développez vos compétences professionnelles avec nos formations en ligne.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
        <div className="relative w-full md:w-2/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-elite-black-400 dark:text-elite-yellow-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher une formation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 w-full bg-elite-yellow-50 dark:bg-elite-black-800 border border-elite-black-200 dark:border-elite-black-700 text-elite-black-900 dark:text-elite-yellow-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-elite-red-500 transition-all placeholder-elite-black-400 dark:placeholder-elite-yellow-400"
          />
        </div>
        <button
          onClick={toggleFilters}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-elite-black-200 dark:bg-elite-black-600 text-elite-black-900 dark:text-elite-yellow-100 hover:bg-elite-black-300 dark:hover:bg-elite-black-500 transition-colors"
        >
          <Filter className="h-5 w-5" />
          <span>Filtres</span>
        </button>
      </div>

      {showFilters && (
        <div className="bg-elite-yellow-50 dark:bg-elite-black-900 p-6 rounded-xl shadow-lg mb-8 border border-elite-black-200 dark:border-elite-black-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-elite-black-900 dark:text-elite-yellow-100 mb-3">Catégorie</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-elite-red-600 text-white'
                        : 'bg-elite-black-200 dark:bg-elite-black-600 text-elite-black-900 dark:text-elite-yellow-100 hover:bg-elite-black-300 dark:hover:bg-elite-black-500'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-elite-black-900 dark:text-elite-yellow-100 mb-3">Niveau</h3>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedLevel === level
                        ? 'bg-elite-red-600 text-white'
                        : 'bg-elite-black-200 dark:bg-elite-black-600 text-elite-black-900 dark:text-elite-yellow-100 hover:bg-elite-black-300 dark:hover:bg-elite-black-500'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredFormations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-medium text-elite-black-900 dark:text-elite-yellow-100 mb-2">Aucune formation trouvée</p>
          <p className="text-elite-black-600 dark:text-elite-yellow-200">Essayez de modifier vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFormations.map((formation) => (
            <div 
              key={formation.id} 
              className="bg-elite-yellow-50 dark:bg-elite-black-900 rounded-xl overflow-hidden shadow-lg transform transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              onClick={() => viewFormation(formation.id)}
            >
              <img 
                src={formation.image} 
                alt={formation.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-semibold text-elite-black-900 dark:text-elite-yellow-100 line-clamp-2 flex-1">{formation.title}</h2>
                  <div className="flex items-center ml-2 text-sm text-elite-black-600 dark:text-elite-yellow-300">
                    <Star className="h-4 w-4 text-elite-yellow-500 mr-1" />
                    <span>{formation.rating}</span>
                  </div>
                </div>
                <p className="text-elite-black-600 dark:text-elite-yellow-200 text-sm mb-4 line-clamp-2">{formation.description}</p>
                <div className="flex items-center justify-between text-sm text-elite-black-500 dark:text-elite-yellow-400 mb-4">
                  <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {formation.duration}</span>
                  <span className="flex items-center"><BookOpen className="h-4 w-4 mr-1" /> {formation.level}</span>
                  <span className="flex items-center"><Users className="h-4 w-4 mr-1" /> {formation.students}</span>
                </div>
                {formation.progress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-elite-black-600 dark:text-elite-yellow-300 mb-1">
                      <span>{formation.progress}% complété</span>
                      <span>{formation.progress === 100 ? 'Terminé' : 'En cours'}</span>
                    </div>
                    <div className="h-1.5 bg-elite-black-200 dark:bg-elite-black-700 rounded-full overflow-hidden">
                      <div 
                        className="bg-elite-red-500 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${formation.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <button 
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    formation.progress === 0 
                      ? 'bg-elite-red-600 text-white hover:bg-elite-red-700' 
                      : formation.progress === 100 
                        ? 'bg-elite-black-200 dark:bg-elite-black-600 text-elite-black-900 dark:text-elite-yellow-100 hover:bg-elite-black-300 dark:hover:bg-elite-black-500' 
                        : 'bg-elite-red-600 text-white hover:bg-elite-red-700'
                  }`}
                >
                  {formation.progress === 0 ? 'Commencer' : formation.progress === 100 ? 'Revoir' : 'Continuer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Formations;