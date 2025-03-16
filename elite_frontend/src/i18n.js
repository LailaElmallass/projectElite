import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Fichiers de traduction
const resources = {
  en: {
    translation: {
      "openSidebar": "Open Sidebar",
      "search": "Search",
      "toggleDarkMode": "Toggle Dark Mode",
      "language": "Language",
      "notifications": "Notifications",
      "noNotifications": "No notifications",
      "profile": "Profile",
      "settings": "Settings",
      "logout": "Logout",
      "login": "Login",
      "dashboard": "Dashboard",
      "welcome": "Welcome {{name}}! Here's an overview of your journey and opportunities.",
      "welcomeGuest": "Welcome! Here's an overview of your journey and opportunities.",
      "skills": "Skills",
      "trainings": "Trainings",
      "interviews": "Interviews",
      "studyTime": "Study Time",
      "performanceBySkill": "Performance by Skill",
      "careerOrientation": "Career Orientation",
      "recommendedCourses": "Recommended Courses",
      "suggestedJobs": "Suggested Jobs",
      "seeAll": "See All",
      "explore": "Explore",
      "noResults": "No results found",
      "adminOnlyNotification": "Only administrators can add notifications",
      "professionalCoach": "Professional Coach",
      "company": "Company",
      "administrator": "Administrator",
      "user": "User",
      "title": "Title",
      "message": "Message",
      "addNotification": "Add Notification",
      "validatedSkills": "validated skills",
      "inProgress": "in progress",
      "upcoming": "upcoming",
      "thisMonth": "this month",
      "duration": "Duration",
      "sector": "Sector",
      "match": "Match"
    }
  },
  fr: {
    translation: {
      "openSidebar": "Ouvrir la barre latérale",
      "search": "Rechercher",
      "toggleDarkMode": "Basculer le mode sombre",
      "language": "Langue",
      "notifications": "Notifications",
      "noNotifications": "Aucune notification",
      "profile": "Profil",
      "settings": "Paramètres",
      "logout": "Déconnexion",
      "login": "Connexion",
      "dashboard": "Tableau de bord",
      "welcome": "Bienvenue {{name}} ! Voici un aperçu de votre parcours et vos opportunités.",
      "welcomeGuest": "Bienvenue ! Voici un aperçu de votre parcours et vos opportunités.",
      "skills": "Compétences",
      "trainings": "Formations",
      "interviews": "Entretiens",
      "studyTime": "Temps d'étude",
      "performanceBySkill": "Performance par compétence",
      "careerOrientation": "Orientation professionnelle",
      "recommendedCourses": "Formations recommandées",
      "suggestedJobs": "Métiers suggérés",
      "seeAll": "Tout voir",
      "explore": "Explorer",
      "noResults": "Aucun résultat trouvé",
    "adminOnlyNotification": "Seuls les administrateurs peuvent ajouter des notifications",
    "professionalCoach": "Coach professionnel",
    "company": "Entreprise",
    "administrator": "Administrateur",
    "user": "Utilisateur",
    "title": "Titre",
    "message": "Message",
    "addNotification": "Ajouter une notification",
    "validatedSkills": "compétences validées",
    "inProgress": "en cours",
    "upcoming": "à venir",
    "thisMonth": "ce mois",
    "duration": "Durée",
    "sector": "Secteur",
    "match": "Correspondance"
    }
  },
  ar: {
    translation: {
      "openSidebar": "فتح الشريط الجانبي",
      "search": "بحث",
      "toggleDarkMode": "تبديل الوضع الداكن",
      "language": "اللغة",
      "notifications": "الإشعارات",
      "noNotifications": "لا توجد إشعارات",
      "profile": "الملف الشخصي",
      "settings": "الإعدادات",
      "logout": "تسجيل الخروج",
      "login": "تسجيل الدخول",
      "dashboard": "لوحة التحكم",
      "welcome": "مرحبًا {{name}}! إليك نظرة عامة على مسيرتك وفرصك.",
      "welcomeGuest": "مرحبًا! إليك نظرة عامة على مسيرتك وفرصك.",
      "skills": "المهارات",
      "trainings": "التدريبات",
      "interviews": "المقابلات",
      "studyTime": "وقت الدراسة",
      "performanceBySkill": "الأداء حسب المهارة",
      "careerOrientation": "التوجيه المهني",
      "recommendedCourses": "الدورات الموصى بها",
      "suggestedJobs": "الوظائف المقترحة",
      "seeAll": "عرض الكل",
      "explore": "استكشاف",
      "noResults": "لم يتم العثور على نتائج",
      "adminOnlyNotification": "يمكن للمسؤولين فقط إضافة الإشعارات",
      "professionalCoach": "مدرب محترف",
      "company": "شركة",
      "administrator": "مسؤول",
      "user": "مستخدم",
      "title": "عنوان",
      "message": "رسالة",
      "addNotification": "إضافة إشعار",
      "validatedSkills": "مهارات تم التحقق منها",
      "inProgress": "قيد التقدم",
      "upcoming": "قادمة",
      "thisMonth": "هذا الشهر",
      "duration": "المدة",
      "sector": "القطاع",
      "match": "تطابق"
    }
  }
};

i18n
  .use(LanguageDetector) 
  .use(initReactI18next) 
  .init({
    resources,
    fallbackLng: 'fr', 
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;