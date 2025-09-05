import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LanguageCode = 'en' | 'hi' | 'mr' | 'sa';

interface Translations {
  [key: string]: {
    [lang in LanguageCode]?: string;
  };
}

interface ArrayTranslations {
  [key: string]: {
    [lang in LanguageCode]?: string[];
  };
}

interface TranslationContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  tArray: (key: string) => string[];
}

const translations: Translations = {
  welcomeTitle: { en: 'Simhasth Saathi', hi: 'सिंहस्थ साथी', mr: 'सिंहस्थ साथी', sa: 'सिंहस्थ साथी' },
  welcomeSubtitle: { en: 'Your safety companion for Simhastha', hi: 'सिंहस्थ के लिए आपका सुरक्षा साथी', mr: 'सिंहस्थसाठी तुमचा सुरक्षा साथी', sa: 'सिंहस्थ के लिए आपका सुरक्षा साथी' },
  chooseLanguage: { en: 'Choose Your Language', hi: 'अपनी भाषा चुनें', mr: 'आपली भाषा निवडा', sa: 'भाषा चुनें' },
  next: { en: 'Continue', hi: 'आगे बढ़ें', mr: 'पुढे जा', sa: 'आगे बढ़ें' },
  groupStatus: { en: 'Group Status', hi: 'समूह की स्थिति', mr: 'गट स्थिती', sa: 'समूह की स्थिति' },
  yourGroup: { en: 'Your Group', hi: 'आपका समूह', mr: 'तुमचा गट', sa: 'आपका समूह' },
  members: { en: 'members', hi: 'सदस्य', mr: 'सदस्य', sa: 'सदस्य' },
  quickActions: { en: 'Quick Actions', hi: 'त्वरित क्रियाएं', mr: 'त्वरीत क्रिया', sa: 'त्वरित क्रियाएं' },
  emergencyHelp: { en: 'Emergency Help', hi: 'आपातकालीन सहायता', mr: 'आपत्कालीन मदत', sa: 'आपातकालीन सहायता' },
  findGroup: { en: 'Find Group Members', hi: 'समूह के सदस्यों को खोजें', mr: 'गट सदस्य शोधा', sa: 'समूह के सदस्यों को खोजें' },
  helpdesk: { en: 'Digital Helpdesk', hi: 'डिजिटल हेल्पडेस्क', mr: 'डिजिटल हेल्पडेस्क', sa: 'डिजिटल हेल्पडेस्क' },
  recentActivity: { en: 'Recent Activity', hi: 'हाल की गतिविधि', mr: 'अलीकडील क्रियाकलाप', sa: 'हाल की गतिविधि' },
  allSafe: { en: 'All members are safe', hi: 'सभी सदस्य सुरक्षित हैं', mr: 'सर्व सदस्य सुरक्षित आहेत', sa: 'सभी सदस्य सुरक्षित हैं' },
  lastUpdate: { en: 'Last updated 2 min ago', hi: '2 मिनट पहले अपडेट किया गया', mr: '2 मिनिटांपूर्वी अपडेट', sa: '2 मिनट पहले अपडेट किया गया' },
  loginTitle: { en: 'Secure Login', hi: 'सुरक्षित लॉगिन', mr: 'सुरक्षित लॉगिन', sa: 'सुरक्षित लॉगिन' },
  loginSubtitle: { en: 'Enter your phone number to get started', hi: 'शुरू करने के लिए अपना फोन नंबर दर्ज करें', mr: 'सुरू करण्यासाठी फोन नंबर टाका', sa: 'शुरू करने के लिए अपना फोन नंबर दर्ज करें' },
  otpTitle: { en: 'Enter OTP', hi: 'OTP दर्ज करें', mr: 'OTP टाका', sa: 'OTP दर्ज करें' },
  otpLabel: { en: 'Enter OTP', hi: 'OTP दर्ज करें', mr: 'OTP टाका', sa: 'OTP दर्ज करें' },
  sendOtp: { en: 'Send OTP', hi: 'OTP भेजें', mr: 'OTP पाठवा', sa: 'OTP भेजें' },
  verifyOtp: { en: 'Verify & Continue', hi: 'सत्यापित करें और जारी रखें', mr: 'सत्यापित करा आणि पुढे जा', sa: 'सत्यापित करें और जारी रखें' },
  resendOtp: { en: 'Resend OTP', hi: 'OTP पुनः भेजें', mr: 'OTP पुन्हा पाठवा', sa: 'OTP पुनः भेजें' },
  guestMode: { en: 'Continue as Guest', hi: 'अतिथि के रूप में जारी रखें', mr: 'अतिथी म्हणून पुढे जा', sa: 'अतिथि के रूप में जारी रखें' },
  sending: { en: 'Sending...', hi: 'भेज रहा है...', mr: 'पाठवत आहे...', sa: 'भेज रहा है...' },
  verifying: { en: 'Verifying...', hi: 'सत्यापित कर रहा है...', mr: 'सत्यापित करत आहे...', sa: 'सत्यापित कर रहा है...' },
  securityNotice: { en: 'Your data is encrypted and secure', hi: 'आपका डेटा एन्क्रिप्टेड और सुरक्षित है', mr: 'तुमचा डेटा सुरक्षित आहे', sa: 'आपका डेटा एन्क्रिप्टेड और सुरक्षित है' },
  phoneLabel: { en: 'Phone Number', hi: 'फोन नंबर', mr: 'फोन नंबर', sa: 'फोन नंबर' },
  phonePlaceholder: { en: '+91 00000 00000', hi: '+91 00000 00000', mr: '+91 00000 00000', sa: '+91 00000 00000' },
  sosTitle: { en: 'Emergency Help', hi: 'आपातकालीन सहायता', mr: 'आपत्कालीन मदत', sa: 'आपातकालीन सहायता' },
  sosSubtitle: { en: 'Press the SOS button for immediate help', hi: 'तुरंत सहायता के लिए SOS बटन दबाएं', mr: 'तत्काळ मदतीसाठी SOS बटन दाबा', sa: 'तुरंत सहायता के लिए SOS बटन दबाएं' },
  sosButton: { en: 'SOS', hi: 'SOS', mr: 'SOS', sa: 'SOS' },
  sosEmergency: { en: 'Emergency', hi: 'आपातकाल', mr: 'आपत्कालीन', sa: 'आपातकाल' },
  sosSending: { en: 'Sending your SOS alert...', hi: 'आपका SOS अलर्ट भेजा जा रहा है...', mr: 'आपला SOS अलर्ट पाठवित आहे...', sa: 'आपका SOS अलर्ट भेजा जा रहा है...' },
  sosSent: { en: 'Your SOS alert was sent successfully. Help is on the way.', hi: 'आपका SOS अलर्ट सफलतापूर्वक भेजा गया। सहायता आ रही है।', mr: 'आपला SOS अलर्ट यशस्वीपणे पाठवला गेला आहे. मदत येत आहे.', sa: 'आपका SOS अलर्ट सफलतापूर्वक भेजा गया। सहायता आ रही है।' },
  quickContacts: { en: 'Quick Contacts', hi: 'त्वरित संपर्क', mr: 'त्वरीत संपर्क', sa: 'त्वरित संपर्क' },
  police: { en: 'Police', hi: 'पुलिस', mr: 'पोलीस', sa: 'पुलिस' },
  volunteers: { en: 'Volunteers', hi: 'स्वयंसेवक', mr: 'स्वयंसेवक', sa: 'स्वयंसेवक' },
  sosAlert: { en: 'SOS Alert', hi: 'SOS अलर्ट', mr: 'SOS अलर्ट', sa: 'SOS अलर्ट' },
  resolved: { en: 'Resolved', hi: 'समाधान', mr: 'समाधान', sa: 'समाधान' },
  responded: { en: 'Responded', hi: 'जवाब मिला', mr: 'उत्तर दिला', sa: 'जवाब मिला' },
  sent: { en: 'Sent', hi: 'भेजा गया', mr: 'पाठवले', sa: 'भेजा गया' },
helpdeskTitle: {
  en: 'Helpdesk',
  hi: 'सहायता केंद्र',
  mr: 'मदत केंद्र',
  sa: 'सहायता केंद्र',
},
helpdeskSubtitle: {
  en: 'All services for your convenience',
  hi: 'आपकी सुविधा के लिए सभी सेवाएं',
  mr: 'तुमच्या सोयीसाठी सर्व सेवा',
  sa: 'आपकी सुविधा के लिए सभी सेवाएं',
},
digitalHelp: { en: 'Digital Help', hi: 'डिजिटल सहायता', mr: 'डिजिटल मदत', sa: 'डिजिटल सहायता' },
lostFound: { en: 'Lost & Found', hi: 'खोया-पाया', mr: 'गमावले व सापडले', sa: 'खोया-पाया' },
callVolunteer: { en: 'Talk to Volunteer', hi: 'स्वयंसेवक से बात करें', mr: 'स्वयंसेवकाशी बोला', sa: 'स्वयंसेवक से बात करें' },
contactPolice: { en: 'Contact Police', hi: 'पुलिस से संपर्क करें', mr: 'पोलीस संपर्क करा', sa: 'पुलिस से संपर्क करें' },
nearestHelpCenter: { en: 'Nearest Help Center', hi: 'निकटतम सहायता केंद्र', mr: 'सर्वात जवळचा मदत केंद्र', sa: 'निकटतम सहायता केंद्र' },
emergencyNumbers: { en: 'Emergency Numbers', hi: 'आपातकालीन नंबर', mr: 'आपत्कालीन क्रमांक', sa: 'आपातकालीन नंबर' },
policeControlRoom: { en: 'Police Control Room', hi: 'पुलिस कंट्रोल रूम', mr: 'पोलीस कंट्रोल रूम', sa: 'पुलिस कंट्रोल रूम' },
medicalEmergency: { en: 'Medical Emergency', hi: 'मेडिकल इमरजेंसी', mr: 'वैद्यकीय आपत्काल', sa: 'मेडिकल इमरजेंसी' },
simhasthHelpline: { en: 'Simhasth Helpline', hi: 'सिंहस्थ हेल्पलाइन', mr: 'सिंहस्थ हेल्पलाइन', sa: 'सिंहस्थ हेल्पलाइन' },
scanQR: { en: 'Scan QR', hi: 'QR स्कैन करें', mr: 'QR स्कॅन करा', sa: 'QR स्कैन करें' },
missingReport: { en: 'Missing Report', hi: 'गुमशुदा रिपोर्ट', mr: 'गमावलेली माहिती', sa: 'गुमशुदा रिपोर्ट' },
searchPerson: { en: 'Search Person', hi: 'व्यक्ति खोजें', mr: 'व्यक्ती शोधा', sa: 'व्यक्ति खोजें' },
searchName: { en: 'Name', hi: 'नाम', mr: 'नाव', sa: 'नाम' },
searchAge: { en: 'Age', hi: 'उम्र', mr: 'वय', sa: 'उम्र' },
searchDescription: { en: 'Description', hi: 'विवरण', mr: 'वर्णन', sa: 'विवरण' },
scanQRInstruction: { en: 'Place QR code in front of camera', hi: 'व्यक्ति की पहचान के लिए QR कोड को कैमरे के सामने रखें', mr: 'QR कोड कॅमेर्‍यासमोर ठेवा', sa: 'व्यक्ति की पहचान के लिए QR कोड को कैमरे के सामने रखें' },
qrScannerTitle: { en: 'Scan QR Code', hi: 'QR कोड स्कैन करें', mr: 'QR कोड स्कॅन करा', sa: 'QR कोड स्कैन करें' },
qrScannerCameraView: { en: 'Camera view will appear here', hi: 'कैमरा व्यू यहाँ दिखेगा', mr: 'कॅमेरा दृश्य येथे दिसेल', sa: 'कैमरा व्यू यहाँ दिखेगा' },
back: { en: 'Go Back', hi: 'वापस जाएं', mr: 'मागे जा', sa: 'वापस जाएं' },
locationMessage: { en: "I'm at Simhastha. My location:", hi: "मैं सिंहस्थ में हूँ। मेरी स्थिति:", mr: "मी सिंहस्थमध्ये आहे. माझे स्थान:", sa: "मैं सिंहस्थ में हूँ। मेरी स्थिति:" },
emergencyContacts: { en: "Emergency Contacts", hi: "आपातकालीन संपर्क", mr: "आपत्कालीन संपर्क", sa: "आपातकालीन संपर्क" },
addContact: { en: "Add Contact", hi: "संपर्क जोड़ें", mr: "संपर्क जोडा", sa: "संपर्क जोड़ें" },
locationSharing: { en: "Location Sharing", hi: "स्थान साझाकरण", mr: "स्थान सामायिकरण", sa: "स्थान साझाकरण" },
shareLocation: { en: "Share location with group", hi: "समूह के साथ स्थान साझा करें", mr: "गटासह स्थान सामायिक करा", sa: "समूह के साथ स्थान साझा करें" },
shareLocationDesc: { en: "Your group will see your location", hi: "आपका समूह आपकी स्थिति देख सकेगा", mr: "तुमचा गट तुमचे स्थान पाहू शकेल", sa: "आपका समूह आपकी स्थिति देख सकेगा" },
sendLocationSMS: { en: "Send location via SMS", hi: "SMS के द्वारा स्थान भेजें", mr: "SMS द्वारे स्थान पाठवा", sa: "SMS के द्वारा स्थान भेजें" },
offlineLocationInfo: { en: "Share your location via SMS in offline mode", hi: "ऑफलाइन मोड में SMS के माध्यम से अपनी स्थिति साझा करें", mr: "ऑफलाइन मोडमध्ये SMS द्वारे तुमचे स्थान सामायिक करा", sa: "ऑफलाइन मोड में SMS के माध्यम से अपनी स्थिति साझा करें" },
groupInfo: { en: "Group Info", hi: "समूह जानकारी", mr: "गट माहिती", sa: "समूह जानकारी" },
totalMembers: { en: "Total Members", hi: "कुल सदस्य", mr: "एकूण सदस्य", sa: "कुल सदस्य" },
onlineMembers: { en: "Online Members", hi: "ऑनलाइन सदस्य", mr: "ऑनलाइन सदस्य", sa: "ऑनलाइन सदस्य" },
groupCreated: { en: "Group Created", hi: "समूह बनाया", mr: "गट तयार केला", sa: "समूह बनाया" },
viewGroupMembers: { en: "View Group Members", hi: "समूह सदस्य देखें", mr: "गट सदस्य पहा", sa: "समूह सदस्य देखें" },
settings: { en: "Settings", hi: "सेटिंग्स", mr: "सेटिंग्ज", sa: "सेटिंग्स" },
settingsDesc: { en: "Language, Privacy & Options", hi: "भाषा, गोपनीयता और अन्य विकल्प", mr: "भाषा, गोपनीयता व पर्याय", sa: "भाषा, गोपनीयता और अन्य विकल्प" },
logout: { en: "Logout", hi: "लॉगआउट", mr: "लॉगआउट", sa: "लॉगआउट" },
age: { en: "Age", hi: "उम्र", mr: "वय", sa: "उम्र" },
groupId: { en: "Group ID", hi: "समूह ID", mr: "गट ID", sa: "समूह ID" },
profileTitle: { en: 'Profile', hi: 'प्रोफ़ाइल', mr: 'प्रोफाइल', sa: 'प्रोफ़ाइल' },
notificationsTitle: { en: 'Notifications', hi: 'सूचनाएं', mr: 'सूचना', sa: 'सूचनाएं' },
viewMap: { en: 'View on Map', hi: 'मानचित्र पर देखें', mr: 'नकाशावर पहा', sa: 'मानचित्र पर देखें' },
youAreHere: { en: 'You are here', hi: 'आप यहाँ हैं', mr: 'तुम येथे आहात', sa: 'आप यहाँ हैं' },
focusOnGroup: { en: 'Focus on Group', hi: 'समूह पर केंद्रित करें', mr: 'गटावर केंद्रित करा', sa: 'समूह पर केंद्रित करें' },

};

const arrayTranslations: ArrayTranslations = {
  features: {
    en: ['Group Tracking', 'SOS Alerts', 'Safety First'],
    hi: ['समूह ट्रैकिंग', 'SOS अलर्ट', 'सुरक्षा पहले'],
    mr: ['गट ट्रॅकिंग', 'SOS अलर्ट', 'सुरक्षा प्रथम'],
    sa: ['समूह ट्रैकिंग', 'SOS अलर्ट', 'सुरक्षा पहले'],
  },
};

const TranslationContext = createContext<TranslationContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
  tArray: (key: string) => [],
});

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<LanguageCode>(
    (localStorage.getItem('language') as LanguageCode) || 'hi'
  );

  const setLang = (lang: LanguageCode) => {
    localStorage.setItem('language', lang);
    setLanguage(lang);
  };

  const t = (key: string) => translations[key]?.[language] || key;
  const tArray = (key: string) => arrayTranslations[key]?.[language] || [];

  return (
    <TranslationContext.Provider value={{ language, setLanguage: setLang, t, tArray }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
