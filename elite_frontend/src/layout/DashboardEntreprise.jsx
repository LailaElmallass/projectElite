import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, Briefcase, Award, Calendar, Clock, ChevronRight, Building2, 
  UserCheck, ClipboardList, MessageSquare, Search, MapPin, DollarSign, Star
} from 'lucide-react';
import { cn } from '../lib/utils';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useDarkMode } from '../DarkModeContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// Données des candidatures par secteur
const applicationsByIndustry = [
  { secteur: 'Tech', total: 48, acceptees: 12 },
  { secteur: 'Finance', total: 32, acceptees: 8 },
  { secteur: 'Santé', total: 24, acceptees: 7 },
  { secteur: 'Marketing', total: 18, acceptees: 5 },
  { secteur: 'Éducation', total: 14, acceptees: 4 },
  { secteur: 'Autres', total: 22, acceptees: 6 },
];

// Répartition des types d'emploi
const jobTypesData = [
  { name: 'CDI', value: 45 },
  { name: 'CDD', value: 25 },
  { name: 'Freelance', value: 15 },
  { name: 'Stage', value: 15 },
];

// Entretiens planifiés
const upcomingInterviews = [
  { candidat: 'Marie Lambert', poste: 'Développeur Full-Stack', entreprise: 'TechSolutions', date: '15 Nov, 10:00', statut: 'Confirmé' },
  { candidat: 'Paul Martin', poste: 'Chef de projet digital', entreprise: 'DigitalWave', date: '16 Nov, 14:30', statut: 'En attente' },
  { candidat: 'Sophie Dubois', poste: 'UX Designer', entreprise: 'CreativeMinds', date: '18 Nov, 11:15', statut: 'Confirmé' },
];

// Offres d'emploi récentes
const recentJobs = [
  { titre: 'Ingénieur Développement', entreprise: 'InnoTech', lieu: 'Paris', salaire: '50-60K €', matchRate: '92%' },
  { titre: 'Product Manager', entreprise: 'StrategyPlus', lieu: 'Lyon', salaire: '45-55K €', matchRate: '88%' },
  { titre: 'Data Scientist', entreprise: 'DataCorp', lieu: 'Bordeaux', salaire: '55-65K €', matchRate: '85%' },
];

const COLORS = ['#FFBB28', '#FF8042', '#00C49F', '#0088FE'];

const Dashboard = ({ user, onLogout, isLoading }) => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [filteredApplications, setFilteredApplications] = useState(applicationsByIndustry);
  const [filteredJobTypes, setFilteredJobTypes] = useState(jobTypesData);
  const [filteredInterviews, setFilteredInterviews] = useState(upcomingInterviews);
  const [filteredJobs, setFilteredJobs] = useState(recentJobs);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin');
    }
  }, [user, isLoading, navigate]);

  const handleSearch = (query) => {
    const lowerQuery = query.toLowerCase();
    
    const newInterviews = upcomingInterviews.filter(item => 
      item.candidat.toLowerCase().includes(lowerQuery) || 
      item.poste.toLowerCase().includes(lowerQuery) ||
      item.entreprise.toLowerCase().includes(lowerQuery)
    );
    setFilteredInterviews(newInterviews.length > 0 ? newInterviews : upcomingInterviews);

    const newJobs = recentJobs.filter(item => 
      item.titre.toLowerCase().includes(lowerQuery) || 
      item.entreprise.toLowerCase().includes(lowerQuery) ||
      item.lieu.toLowerCase().includes(lowerQuery)
    );
    setFilteredJobs(newJobs.length > 0 ? newJobs : recentJobs);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  const companyName = user?.companyName || 'JobConnect';

  return (
    <div className={cn("min-h-screen", darkMode ? "dark bg-elite-black-900" : "bg-elite-yellow-50")}>
      <Navbar 
        isSidebarOpen={isSidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={onLogout}
        onSearch={handleSearch}
      />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
        <main className={cn("flex-1 p-6 transition-all duration-300", isSidebarOpen ? "lg:pl-64 xl:pl-72" : "pl-0")}>
          <div className="container mx-auto pt-16">
            <div className="mb-8">
              <h1 className={cn("text-2xl font-bold mb-2", darkMode ? "text-elite-yellow-100" : "text-elite-black-800")}>
                Tableau de bord de recrutement
              </h1>
              <p className={cn("text-sm", darkMode ? "text-elite-yellow-400" : "text-elite-black-600")}>
                <strong>{companyName}</strong> | {user?.totalJobs} offres publiées | {user?.activeApplications} candidatures actives | {user?.pendingInterviews} entretiens en attente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { icon: Briefcase, title: "Offres d'emploi", value: "127", subtext: "Actives", trend: "+8 cette semaine" },
                { icon: ClipboardList, title: "Candidatures", value: "543", subtext: "Reçues", trend: "+42 cette semaine" },
                { icon: UserCheck, title: "Entretiens", value: "32", subtext: "Programmés", trend: "+5 cette semaine" },
                { icon: MessageSquare, title: "Messages", value: "87", subtext: "Non lus", trend: "+15 aujourd'hui" },
              ].map((stat, index) => (
                <div key={index} className={cn("p-6 rounded-lg shadow-md hover:scale-105 transition-transform", darkMode ? "bg-elite-black-800 text-elite-yellow-100" : "bg-white text-elite-black-900")}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-full bg-elite-yellow-400/20 text-elite-yellow-400">
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <h3 className="ml-3 text-lg font-semibold">{stat.title}</h3>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">{stat.value}</span>
                    <span className={cn("ml-2 text-sm", darkMode ? "text-elite-yellow-400" : "text-elite-black-600")}>
                      {stat.subtext}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center">
                    <TrendingUp className="h-4 w-4 text-elite-red-500" />
                    <span className="ml-1 text-xs text-elite-red-500">
                      {stat.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className={cn("p-6 rounded-lg shadow-md", darkMode ? "bg-elite-black-800" : "bg-white")}>
                <h3 className={cn("text-lg font-semibold mb-4", darkMode ? "text-elite-yellow-100" : "text-elite-black-900")}>
                  Candidatures par secteur
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredApplications} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#666" : "#ccc"} />
                      <XAxis dataKey="secteur" stroke={darkMode ? "#FFF3B0" : "#333"} />
                      <YAxis stroke={darkMode ? "#FFF3B0" : "#333"} />
                      <Tooltip contentStyle={darkMode ? { backgroundColor: "#333", color: "#FFF3B0" } : {}} />
                      <Legend />
                      <Bar dataKey="total" fill="#FFBB28" name="Total" />
                      <Bar dataKey="acceptees" fill="#00C49F" name="Acceptées" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={cn("p-6 rounded-lg shadow-md", darkMode ? "bg-elite-black-800" : "bg-white")}>
                <h3 className={cn("text-lg font-semibold mb-4", darkMode ? "text-elite-yellow-100" : "text-elite-black-900")}>
                  Types d'emploi
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={filteredJobTypes} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {filteredJobTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={darkMode ? { backgroundColor: "#333", color: "#FFF3B0" } : {}} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={cn("p-6 rounded-lg shadow-md", darkMode ? "bg-elite-black-800" : "bg-white")}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={cn("text-lg font-semibold", darkMode ? "text-elite-yellow-100" : "text-elite-black-900")}>
                    Entretiens à venir
                  </h3>
                  <button className={cn("text-sm flex items-center", darkMode ? "text-elite-yellow-400" : "text-elite-black-700")}>
                    Voir tous <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <div className="space-y-4">
                  {filteredInterviews.map((interview, index) => (
                    <div key={index} className={cn("flex items-center p-3 border rounded-md hover:bg-elite-red-500/10 transition-colors cursor-pointer", darkMode ? "border-elite-black-700" : "border-elite-black-200")}>
                      <div className={cn("w-10 h-10 rounded-md flex items-center justify-center text-elite-yellow-400 mr-4", darkMode ? "bg-elite-yellow-400/10" : "bg-elite-yellow-400/20")}>
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className={cn("font-medium", darkMode ? "text-elite-yellow-100" : "text-elite-black-900")}>
                          {interview.candidat}
                        </h4>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <p className={cn("text-xs", darkMode ? "text-elite-yellow-400" : "text-elite-black-600")}>
                            Poste: {interview.poste}
                          </p>
                          <p className={cn("text-xs", darkMode ? "text-elite-yellow-400" : "text-elite-black-600")}>
                            Entreprise: {interview.entreprise}
                          </p>
                          <p className={cn("text-xs", darkMode ? "text-elite-yellow-400" : "text-elite-black-600")}>
                            Date: {interview.date}
                          </p>
                        </div>
                      </div>
                      <div className={cn("px-2 py-1 text-xs rounded", 
                        interview.statut === 'Confirmé' 
                          ? (darkMode ? "bg-green-400/10 text-green-400" : "bg-green-400/20 text-green-600")
                          : (darkMode ? "bg-yellow-400/10 text-yellow-400" : "bg-yellow-400/20 text-yellow-600")
                      )}>
                        {interview.statut}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cn("p-6 rounded-lg shadow-md", darkMode ? "bg-elite-black-800" : "bg-white")}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={cn("text-lg font-semibold", darkMode ? "text-elite-yellow-100" : "text-elite-black-900")}>
                    Offres d'emploi récentes
                  </h3>
                  <button className={cn("text-sm flex items-center", darkMode ? "text-elite-yellow-400" : "text-elite-black-700")}>
                    Explorer <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <div className="space-y-4">
                  {filteredJobs.map((job, index) => (
                    <div key={index} className={cn("flex items-center p-3 border rounded-md hover:bg-elite-red-500/10 transition-colors cursor-pointer", darkMode ? "border-elite-black-700" : "border-elite-black-200")}>
                      <div className={cn("w-10 h-10 rounded-md flex items-center justify-center text-elite-yellow-400 mr-4", darkMode ? "bg-elite-yellow-400/10" : "bg-elite-yellow-400/20")}>
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className={cn("font-medium", darkMode ? "text-elite-yellow-100" : "text-elite-black-900")}>
                          {job.titre}
                        </h4>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <p className={cn("text-xs flex items-center", darkMode ? "text-elite-yellow-400" : "text-elite-black-600")}>
                            <Building2 className="h-3 w-3 mr-1" /> {job.entreprise}
                          </p>
                          <p className={cn("text-xs flex items-center", darkMode ? "text-elite-yellow-400" : "text-elite-black-600")}>
                            <MapPin className="h-3 w-3 mr-1" /> {job.lieu}
                          </p>
                          <p className={cn("text-xs flex items-center", darkMode ? "text-elite-yellow-400" : "text-elite-black-600")}>
                            <DollarSign className="h-3 w-3 mr-1" /> {job.salaire}
                          </p>
                        </div>
                      </div>
                      <div className={cn("px-2 py-1 text-xs rounded flex items-center", darkMode ? "bg-elite-yellow-400/10 text-elite-yellow-400" : "bg-elite-yellow-400/20 text-elite-yellow-600")}>
                        <Star className="h-3 w-3 mr-1" /> {job.matchRate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;