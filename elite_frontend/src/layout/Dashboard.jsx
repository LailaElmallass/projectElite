import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Users, Briefcase, Award, Calendar, Clock, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useDarkMode } from '../DarkModeContext';
import { useTranslation } from 'react-i18next';

const performanceData = [
  { name: 'Communication', score: 85 },
  { name: 'Leadership', score: 70 },
  { name: 'Technique', score: 90 },
  { name: 'Créativité', score: 65 },
  { name: 'Adaptabilité', score: 80 },
];

const careerData = [
  { name: 'Ingénierie', value: 40 },
  { name: 'Management', value: 30 },
  { name: 'Marketing', value: 15 },
  { name: 'Finance', value: 15 },
];

const recommendedCourses = [
  { title: 'Leadership et prise de décision', duration: '4h', match: '95%' },
  { title: 'Communication efficace en entreprise', duration: '3h', match: '87%' },
  { title: 'Gestion de projet avancée', duration: '6h', match: '82%' },
];

const suggestedJobs = [
  { title: 'Chef de projet digital', sector: 'Technologie', match: '93%' },
  { title: 'Consultant en management', sector: 'Conseil', match: '89%' },
  { title: 'Responsable innovation', sector: 'R&D', match: '84%' },
];

const COLORS = ['#FFBB28', '#FF8042', '#00C49F', '#0088FE'];

const Dashboard = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const { darkMode } = useDarkMode();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [filteredPerformance, setFilteredPerformance] = useState(performanceData);
  const [filteredCareer, setFilteredCareer] = useState(careerData);
  const [filteredCourses, setFilteredCourses] = useState(recommendedCourses);
  const [filteredJobs, setFilteredJobs] = useState(suggestedJobs);

  const handleSearch = (query) => {
    const lowerQuery = query.toLowerCase();
    const newPerformance = performanceData.filter(item => item.name.toLowerCase().includes(lowerQuery));
    setFilteredPerformance(newPerformance.length > 0 ? newPerformance : performanceData);

    const newCareer = careerData.filter(item => item.name.toLowerCase().includes(lowerQuery));
    setFilteredCareer(newCareer.length > 0 ? newCareer : careerData);

    const newCourses = recommendedCourses.filter(course => course.title.toLowerCase().includes(lowerQuery));
    setFilteredCourses(newCourses.length > 0 ? newCourses : recommendedCourses);

    const newJobs = suggestedJobs.filter(job => job.title.toLowerCase().includes(lowerQuery) || job.sector.toLowerCase().includes(lowerQuery));
    setFilteredJobs(newJobs.length > 0 ? newJobs : suggestedJobs);
  };

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
          <div className="container mx-auto">
          <div className="mb-8">
              <h1 className={cn("text-2xl font-bold mb-2", darkMode ? "text-elite-yellow-100" : "text-elite-black-800")}>
                {t('dashboard')}
              </h1>
              <p className={cn("text-sm", darkMode ? "text-elite-yellow-400" : "text-elite-black-600")}>
                {user ? t('welcome', {name: user.name}) : t('welcomeGuest')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { icon: Award, title: t('skills'), value: "7", subtext: t('validatedSkills'), trend: "+2 ce mois" },
                { icon: Briefcase, title: t('trainings'), value: "3", subtext: t('inProgress'), trend: "Progression moyenne 68%" },
                { icon: Users, title: t('interviews'), value: "2", subtext: t('upcoming'), trend: "Prochain: 15 Nov" },
                { icon: Clock, title: t('studyTime'), value: "24h", subtext: t('thisMonth'), trend: "+3h vs dernier mois" },
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
                    {stat.title === t('interviews') ? (
                      <Calendar className="h-4 w-4 text-elite-yellow-400" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-elite-red-500" />
                    )}
                    <span className={cn("ml-1 text-xs", stat.title === t('interviews') ? (darkMode ? "text-elite-yellow-400" : "text-elite-black-600") : "text-elite-red-500")}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className={cn("p-6 rounded-lg shadow-md", darkMode ? "bg-elite-black-800" : "bg-white")}>
                <h3 className={cn("text-lg font-semibold mb-4", darkMode ? "text-elite-yellow-100" : "text-elite-black-900")}>
                  {t('performanceBySkill')}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredPerformance} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#666" : "#ccc"} />
                      <XAxis dataKey="name" stroke={darkMode ? "#FFF3B0" : "#333"} />
                      <YAxis stroke={darkMode ? "#FFF3B0" : "#333"} />
                      <Tooltip contentStyle={darkMode ? { backgroundColor: "#333", color: "#FFF3B0" } : {}} />
                      <Legend />
                      <Bar dataKey="score" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={cn("p-6 rounded-lg shadow-md", darkMode ? "bg-elite-black-800" : "bg-white")}>
                <h3 className={cn("text-lg font-semibold mb-4", darkMode ? "text-elite-yellow-100" : "text-elite-black-900")}>
                  {t('careerOrientation')}
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={filteredCareer} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {filteredCareer.map((entry, index) => (
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
                    {t('recommendedCourses')}
                  </h3>
                  <button className={cn("text-sm flex items-center", darkMode ? "text-elite-yellow-400" : "text-elite-black-700")}>
                    {t('seeAll')} <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <div className="space-y-4">
                  {filteredCourses.map((course, index) => (
                    <div key={index} className={cn("flex items-center p-3 border rounded-md hover:bg-elite-red-500/10 transition-colors cursor-pointer", darkMode ? "border-elite-black-700" : "border-elite-black-200")}>
                      <div className={cn("w-10 h-10 rounded-md flex items-center justify-center text-elite-yellow-400 mr-4", darkMode ? "bg-elite-yellow-400/10" : "bg-elite-yellow-400/20")}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className={cn("font-medium", darkMode ? "text-elite-yellow-100" : "text-elite-black-900")}>
                          {course.title}
                        </h4>
                        <p className={cn("text-xs", darkMode ? "text-elite-yellow-400" : "text-elite-black-600")}>
                          {t('duration')}: {course.duration}
                        </p>
                      </div>
                      <div className={cn("px-2 py-1 text-xs rounded", darkMode ? "bg-elite-yellow-400/10 text-elite-yellow-400" : "bg-elite-yellow-400/20 text-elite-yellow-600")}>
                        {t('match')} {course.match}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cn("p-6 rounded-lg shadow-md", darkMode ? "bg-elite-black-800" : "bg-white")}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={cn("text-lg font-semibold", darkMode ? "text-elite-yellow-100" : "text-elite-black-900")}>
                    {t('suggestedJobs')}
                  </h3>
                  <button className={cn("text-sm flex items-center", darkMode ? "text-elite-yellow-400" : "text-elite-black-700")}>
                    {t('explore')} <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <div className="space-y-4">
                  {filteredJobs.map((job, index) => (
                    <div key={index} className={cn("flex items-center p-3 border rounded-md hover:bg-elite-red-500/10 transition-colors cursor-pointer", darkMode ? "border-elite-black-700" : "border-elite-black-200")}>
                      <div className={cn("w-10 h-10 rounded-md flex items-center justify-center text-elite-yellow-400 mr-4", darkMode ? "bg-elite-yellow-400/10" : "bg-elite-yellow-400/20")}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className={cn("font-medium", darkMode ? "text-elite-yellow-100" : "text-elite-black-900")}>
                          {job.title}
                        </h4>
                        <p className={cn("text-xs", darkMode ? "text-elite-yellow-400" : "text-elite-black-600")}>
                          {t('sector')}: {job.sector}
                        </p>
                      </div>
                      <div className={cn("px-2 py-1 text-xs rounded", darkMode ? "bg-elite-yellow-400/10 text-elite-yellow-400" : "bg-elite-yellow-400/20 text-elite-yellow-600")}>
                        {t('match')} {job.match}
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