// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // CONTRACTOR STRINGS
      contractor: {
        title: "Contractor Portal",
        online: "SYSTEM ACTIVE",
        newOrders: "New Orders",
        inProgress: "In Progress",
        history: "History",
        noOrders: "No Pending Orders",
        noOrdersDesc: "There are currently no assigned tasks in your area.",
        accept: "Initialize Job",
        resolve: "Mark Resolved",
        revenue: "Total Revenue",
        settled: "Settled",
        budget: "Budget"
      },
      // CITIZEN STRINGS
      citizen: {
        heading: "What seems to be the problem?",
        subheading: "Select a category below to start your report.",
        reportTitle: "Report Issue",
        issueTitlePlaceholder: "e.g., Heavy water leakage near Main Gate",
        locDetails: "Location Details",
        selectState: "Select State",
        selectCity: "Select City",
        enterPincode: "Enter or Select Pincode",
        addressPlaceholder: "Street Name, Landmark, House No.",
        descPlaceholder: "Describe the problem in detail...",
        uploadPhoto: "Upload Photo",
        askAi: "Ask AI Help",
        submit: "Submit Report",
        myReports: "My Reports",
        liveTracker: "Live Tracker",
        aiForecast: "AI Forecast"
      },
      // CATEGORIES
      cat: {
        "Water Leakage": "Water Leakage",
        "Potholes": "Potholes",
        "Garbage": "Garbage",
        "Street Light": "Street Light",
        "Manhole": "Manhole",
        "Other": "Other"
      }
    }
  },
  hi: { // HINDI
    translation: {
      contractor: {
        title: "ठेकेदार पोर्टल",
        online: "सिस्टम सक्रिय",
        newOrders: "नए कार्य",
        inProgress: "प्रगति पर",
        history: "इतिहास",
        noOrders: "कोई कार्य लंबित नहीं",
        noOrdersDesc: "आपके क्षेत्र में अभी कोई कार्य नहीं है।",
        accept: "कार्य शुरू करें",
        resolve: "कार्य पूर्ण करें",
        revenue: "कुल कमाई",
        settled: "भुगतान हुआ",
        budget: "बजट"
      },
      citizen: {
        heading: "क्या समस्या है?",
        subheading: "रिपोर्ट करने के लिए नीचे एक श्रेणी चुनें।",
        reportTitle: "शिकायत दर्ज करें",
        issueTitlePlaceholder: "उदा. मुख्य गेट के पास भारी पानी का रिसाव",
        locDetails: "स्थान विवरण",
        selectState: "राज्य चुनें",
        selectCity: "शहर चुनें",
        enterPincode: "पिनकोड दर्ज करें",
        addressPlaceholder: "सड़क का नाम, लैंडमार्क, मकान नंबर",
        descPlaceholder: "समस्या का विस्तार से वर्णन करें...",
        uploadPhoto: "फोटो अपलोड करें",
        askAi: "AI से पूछें",
        submit: "रिपोर्ट भेजें",
        myReports: "मेरी रिपोर्ट",
        liveTracker: "लाइव ट्रैकर",
        aiForecast: "AI भविष्यवाणी"
      },
      cat: {
        "Water Leakage": "पानी का रिसाव",
        "Potholes": "गड्ढे",
        "Garbage": "कचरा",
        "Street Light": "स्ट्रीट लाइट",
        "Manhole": "मैनहोल",
        "Other": "अन्य"
      }
    }
  },
  mr: { // MARATHI
    translation: {
      contractor: {
        title: "कंत्राटदार पोर्टल",
        online: "सिस्टम चालू",
        newOrders: "नवीन कामे",
        inProgress: "काम सुरू आहे",
        history: "इतिहास",
        noOrders: "कोणतेही काम प्रलंबित नाही",
        noOrdersDesc: "सध्या तुमच्या भागात कोणतेही काम नाही.",
        accept: "काम सुरू करा",
        resolve: "काम पूर्ण झाले",
        revenue: "एकूण महसूल",
        settled: "जमा झाले",
        budget: "बजट"
      },
      citizen: {
        heading: "काय समस्या आहे?",
        subheading: "तक्रार करण्यासाठी खालील श्रेणी निवडा.",
        reportTitle: "तक्रार नोंदवा",
        issueTitlePlaceholder: "उदा. मेन गेटजवळ पाणी गळती",
        locDetails: "ठिकाणाचे तपशील",
        selectState: "राज्य निवडा",
        selectCity: "शहर निवडा",
        enterPincode: "पिनकोड टाका",
        addressPlaceholder: "रस्त्याचे नाव, लँडमार्क",
        descPlaceholder: "समस्येचे सविस्तर वर्णन करा...",
        uploadPhoto: "फोटो अपलोड करा",
        askAi: "AI मदत",
        submit: "तक्रार सबमिट करा",
        myReports: "माझ्या तक्रारी",
        liveTracker: "लाइव ट्रॅकर",
        aiForecast: "AI अंदाज"
      },
      cat: {
        "Water Leakage": "पाणी गळती",
        "Potholes": "खड्डे",
        "Garbage": "कचरा",
        "Street Light": "स्ट्रीट लाइट",
        "Manhole": "मॅनहोल",
        "Other": "इतर"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // Default language
    interpolation: { escapeValue: false }
  });

export default i18n;