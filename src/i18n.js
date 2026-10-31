// All screen text lives here. English and Hindi are filled in.
// Other languages fall back to English until you add them (copy the "en" block and translate).

export const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Bengali',
  'Marathi', 'Kannada', 'Malayalam', 'Gujarati', 'Punjabi',
];

// Native names shown in the language picker.
export const NATIVE_NAMES = {
  English: 'English',
  Hindi: 'हिन्दी',
  Tamil: 'தமிழ்',
  Telugu: 'తెలుగు',
  Bengali: 'বাংলা',
  Marathi: 'मराठी',
  Kannada: 'ಕನ್ನಡ',
  Malayalam: 'മലയാളം',
  Gujarati: 'ગુજરાતી',
  Punjabi: 'ਪੰਜਾਬੀ',
};

const UI_CODE = { English: 'en', Hindi: 'hi' };

const strings = {
  en: {
    appName: 'ReportSense',
    tagline: 'Understand your hospital and lab reports in simple words',
    disclaimer:
      'ReportSense explains medical reports in simple language; it does not diagnose or replace your doctor. Always discuss results with a qualified doctor.',
    navAnalyze: 'New report',
    navHistory: 'History',
    signOut: 'Sign out',
    loginTitle: 'Sign in',
    loginHelp: 'Enter your email. We will send you a link to sign in. No password needed.',
    email: 'Email address',
    sendLink: 'Send sign-in link',
    sending: 'Sending…',
    checkInbox: 'Check your email and tap the link to sign in. Look in Spam if you do not see it.',
    chooseLanguage: 'Language for the explanation',
    uploadTitle: 'Upload your report',
    uploadHelp: 'Take a clear photo of your report — blood test, X-ray, MRI, ECG, urine test, prescription, discharge summary, or any hospital report.',
    chooseFile: 'Choose photo or screenshot',
    changeFile: 'Choose a different photo',
    analyze: 'Explain my report',
    analyzing: 'Reading your report… this can take up to a minute.',
    consentTitle: 'Before you upload',
    consentText:
      'Your report image is sent to Google’s AI service for analysis. This app does not store the image. Only the explanation is saved in your history.',
    consentAgree: 'I understand and agree',
    cancel: 'Cancel',
    resultsTitle: 'Your results',
    summary: 'Summary',
    yourValue: 'Your value',
    reportRange: 'Range on report',
    urgentBanner: 'Consider contacting a doctor soon',
    urgentBannerSub: 'One or more values are far outside the range printed on your report.',
    checkValues: 'AI can misread a photo. Please compare each value with your original report.',
    statusLow: 'Low',
    statusNormal: 'Normal',
    statusHigh: 'High',
    statusAbnormal: 'Abnormal',
    statusPresent: 'Present',
    statusAbsent: 'Absent',
    statusUnclear: 'Unclear',
    unclearNote: 'This value could not be read clearly.',
    historyTitle: 'Past reports',
    historyEmpty: 'No reports yet. Your explained reports will appear here.',
    tests: 'tests',
    open: 'Open',
    delete: 'Delete',
    deleteConfirm: 'Delete this report from your history?',
    back: 'Back to history',
    loading: 'Loading…',
    tryAgain: 'Try again',
    notConfigured:
      'The app is not connected to Supabase yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see SETUP_GUIDE.md).',
    saved: 'Saved to your history',
  },
  hi: {
    appName: 'ReportSense',
    tagline: 'अपनी ब्लड टेस्ट रिपोर्ट को आसान शब्दों में समझें',
    disclaimer:
      'ReportSense जाँच के मान समझाता है; यह रोग की पहचान नहीं करता और डॉक्टर का विकल्प नहीं है। नतीजों पर किसी योग्य डॉक्टर से बात करें।',
    navAnalyze: 'नई रिपोर्ट',
    navHistory: 'इतिहास',
    signOut: 'साइन आउट',
    loginTitle: 'साइन इन करें',
    loginHelp: 'अपना ईमेल दर्ज करें। हम आपको साइन-इन लिंक भेजेंगे। पासवर्ड की ज़रूरत नहीं।',
    email: 'ईमेल पता',
    sendLink: 'साइन-इन लिंक भेजें',
    sending: 'भेज रहे हैं…',
    checkInbox: 'अपना ईमेल देखें और साइन इन करने के लिए लिंक पर टैप करें। न दिखे तो स्पैम देखें।',
    chooseLanguage: 'समझाने की भाषा',
    uploadTitle: 'अपनी रिपोर्ट अपलोड करें',
    uploadHelp: 'अच्छी रोशनी में पूरी रिपोर्ट की साफ़ फ़ोटो लें, या स्क्रीनशॉट चुनें।',
    chooseFile: 'फ़ोटो या स्क्रीनशॉट चुनें',
    changeFile: 'दूसरी फ़ोटो चुनें',
    analyze: 'मेरी रिपोर्ट समझाएँ',
    analyzing: 'आपकी रिपोर्ट पढ़ी जा रही है… इसमें एक मिनट तक लग सकता है।',
    consentTitle: 'अपलोड से पहले',
    consentText:
      'आपकी रिपोर्ट की तस्वीर विश्लेषण के लिए Google की AI सेवा को भेजी जाती है। यह ऐप तस्वीर को सेव नहीं करता। आपके इतिहास में केवल स्पष्टीकरण सेव होता है।',
    consentAgree: 'मैं समझता/समझती हूँ और सहमत हूँ',
    cancel: 'रद्द करें',
    resultsTitle: 'आपके नतीजे',
    summary: 'सारांश',
    yourValue: 'आपका मान',
    reportRange: 'रिपोर्ट में दी गई सीमा',
    urgentBanner: 'जल्द ही डॉक्टर से संपर्क करने पर विचार करें',
    urgentBannerSub: 'एक या अधिक मान आपकी रिपोर्ट में छपी सीमा से काफ़ी बाहर हैं।',
    checkValues: 'AI फ़ोटो को गलत पढ़ सकता है। कृपया हर मान को अपनी असली रिपोर्ट से मिलाएँ।',
    statusLow: 'कम',
    statusNormal: 'सामान्य',
    statusHigh: 'ज़्यादा',
    statusUnclear: 'अस्पष्ट',
    unclearNote: 'यह मान साफ़ पढ़ा नहीं जा सका।',
    historyTitle: 'पिछली रिपोर्ट',
    historyEmpty: 'अभी कोई रिपोर्ट नहीं। आपकी समझाई गई रिपोर्ट यहाँ दिखेंगी।',
    tests: 'जाँच',
    open: 'खोलें',
    delete: 'हटाएँ',
    deleteConfirm: 'क्या यह रिपोर्ट इतिहास से हटानी है?',
    back: 'इतिहास पर वापस',
    loading: 'लोड हो रहा है…',
    tryAgain: 'फिर कोशिश करें',
    notConfigured:
      'ऐप अभी Supabase से जुड़ा नहीं है। VITE_SUPABASE_URL और VITE_SUPABASE_ANON_KEY जोड़ें (SETUP_GUIDE.md देखें)।',
    saved: 'आपके इतिहास में सेव हो गया',
  },
};

export function makeT(language) {
  const code = UI_CODE[language] || 'en';
  return (key) => strings[code]?.[key] ?? strings.en[key] ?? key;
}
