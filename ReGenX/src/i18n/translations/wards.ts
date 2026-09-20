import { Language } from '../languages';

export interface WardTranslation {
  en: string;
  hi: string;
  or: string;
}

export const WARD_NAMES: Record<number, WardTranslation> = {
  1: {
    en: 'Raghunathpur / Nandankanan',
    hi: 'रघुनाथपुर / नंदनकानन',
    or: 'ରଘୁନାଥପୁର / ନନ୍ଦନକାନନ',
  },
  2: {
    en: 'Patia / Infocity',
    hi: 'पटिया / इन्फोसिटी',
    or: 'ପଟିଆ / ଇନଫୋସିଟି',
  },
  3: {
    en: 'Kalarahanga',
    hi: 'कलारहांगा',
    or: 'କଲାରାହାଙ୍ଗା',
  },
  4: {
    en: 'Chandrasekharpur Phase-I',
    hi: 'चंद्रशेखरपुर फेज-1',
    or: 'ଚନ୍ଦ୍ରଶେଖରପୁର ଫେଜ୍-1',
  },
  5: {
    en: 'Sailashree Vihar',
    hi: 'सैलश्री विहार',
    or: 'ଶୈଳଶ୍ରୀ ବିହାର',
  },
  6: {
    en: 'Niladri Vihar',
    hi: 'नीलाद्री विहार',
    or: 'ନୀଳାଦ୍ରି ବିହାର',
  },
  7: {
    en: 'Damana / Silicon Hills',
    hi: 'दमणा / सिलिकॉन हिल्स',
    or: 'ଦମଣା / ସିଲିକନ୍ ହିଲ୍ସ',
  },
  8: {
    en: 'Gajapati Nagar / Nalco',
    hi: 'गजपति नगर / नाल्को',
    or: 'ଗଜପତି ନଗର / ନାଲକୋ',
  },
  9: {
    en: 'Mancheswar Industrial Estate',
    hi: 'मंचेश्वर इंडस्ट्रियल एस्टेट',
    or: 'ମଞ୍ଚେଶ୍ୱର ଇଣ୍ଡଷ୍ଟ୍ରିଆଲ୍ ଇଷ୍ଟେଟ୍',
  },
  10: {
    en: 'VSS Nagar / Railway Colony',
    hi: 'वीएसएस नगर / रेलवे कॉलोनी',
    or: 'ଭିଏସଏସ ନଗର / ରେଳ କଲୋନୀ',
  },
  11: {
    en: 'Rasulgarh Industrial Area',
    hi: 'रसूलगढ़ इंडस्ट्रियल एरिया',
    or: 'ରସୁଲଗଡ଼ ଇଣ୍ଡଷ୍ଟ୍ରିଆଲ୍ ଏରିଆ',
  },
  12: {
    en: 'Rasulgarh Canal Road',
    hi: 'रसूलगढ़ कैनाल रोड',
    or: 'ରସୁଲଗଡ଼ କେନାଲ ରୋଡ୍',
  },
  13: {
    en: 'Palasuni / NH-16',
    hi: 'पलासुणी / NH-16',
    or: 'ପଳାଶୁଣୀ / NH-16',
  },
  14: {
    en: 'Chakeisiani',
    hi: 'चकेइसिआनी',
    or: 'ଚକେଇସିଆଣି',
  },
  15: {
    en: 'Nayapalli Behera Sahi',
    hi: 'नयापल्ली बेहरा साही',
    or: 'ନୟାପଲ୍ଲୀ ବେହେରା ସାହି',
  },
  16: {
    en: 'Nayapalli Nuasahi',
    hi: 'नयापल्ली नुआसाही',
    or: 'ନୟାପଲ୍ଲୀ ନୂଆସାହି',
  },
  17: {
    en: 'IRC Village Sector 1-4',
    hi: 'आईआरसी विलेज सेक्टर 1-4',
    or: 'ଆଇଆରସି ଭିଲେଜ୍ ସେକ୍ଟର 1-4',
  },
  18: {
    en: 'Jaydev Vihar / Ekamra Kanan',
    hi: 'जयदेव विहार / एकाम्र कानन',
    or: 'ଜୟଦେବ ବିହାର / ଏକାମ୍ର କାନନ',
  },
  19: {
    en: 'Saheed Nagar West',
    hi: 'शहीद नगर पश्चिम',
    or: 'ସହିଦ ନଗର ପଶ୍ଚିମ',
  },
  20: {
    en: 'Saheed Nagar East',
    hi: 'शहीद नगर पूर्व',
    or: 'ସହିଦ ନଗର ପୂର୍ବ',
  },
  21: {
    en: 'Satya Nagar',
    hi: 'सत्य नगर',
    or: 'ସତ୍ୟ ନଗର',
  },
  22: {
    en: 'Kharvel Nagar / Janpath',
    hi: 'खारवेल नगर / जनपथ',
    or: 'ଖାରବେଳ ନଗର / ଜନପଥ',
  },
  23: {
    en: 'Master Canteen / Station Area',
    hi: 'मास्टर कैंटीन / स्टेशन एरिया',
    or: 'ମାଷ୍ଟର କ୍ୟାଣ୍ଟିନ / ଷ୍ଟେସନ ଏରିଆ',
  },
  24: {
    en: 'Ashok Nagar / Rajmahal',
    hi: 'अशोक नगर / राजमहल',
    or: 'ଅଶୋକ ନଗର / ରାଜମହଲ',
  },
  25: {
    en: 'Bapuji Nagar',
    hi: 'बापूजी नगर',
    or: 'ବାପୁଜୀ ନଗର',
  },
  26: {
    en: 'Forest Park / Capital Hospital',
    hi: 'फॉरेस्ट पार्क / कैपिटल हॉस्पिटल',
    or: 'ଫରେଷ୍ଟ ପାର୍କ / କ୍ୟାପିଟାଲ ହସ୍ପିଟାଲ',
  },
  27: {
    en: 'Unit-1 Daily Market',
    hi: 'यूनिट-1 डेली मार्केट',
    or: 'ୟୁନିଟ୍-1 ଦୈନିକ ହାଟ',
  },
  28: {
    en: 'Unit-2 / AG Square',
    hi: 'यूनिट-2 / एजी स्क्वायर',
    or: 'ୟୁନିଟ୍-2 / ଏଜି ଛକ',
  },
  29: {
    en: 'Unit-3 / Exhibition Ground',
    hi: 'यूनिट-3 / प्रदर्शनी मैदान',
    or: 'ୟୁନିଟ୍-3 / ପ୍ରଦର୍ଶନୀ ପଡ଼ିଆ',
  },
  30: {
    en: 'Unit-4 / MLA Colony',
    hi: 'यूनिट-4 / एमएलए कॉलोनी',
    or: 'ୟୁନିଟ୍-4 / ଏମଏଲଏ କଲୋନୀ',
  },
  31: {
    en: 'Unit-6 / Ganga Nagar',
    hi: 'यूनिट-6 / गंगा नगर',
    or: 'ୟୁନିଟ୍-6 / ଗଙ୍ଗା ନଗର',
  },
  32: {
    en: 'Unit-7 / Surya Nagar',
    hi: 'यूनिट-7 / सूर्य नगर',
    or: 'ୟୁନିଟ୍-7 / ସୂର୍ଯ୍ୟ ନଗର',
  },
  33: {
    en: 'Unit-8 / Delta Square',
    hi: 'यूनिट-8 / डेल्टा स्क्वायर',
    or: 'ୟୁନିଟ୍-8 / ଡେଲ୍ଟା ଛକ',
  },
  34: {
    en: 'Unit-9 / Bhoi Nagar',
    hi: 'यूनिट-9 / भोई नगर',
    or: 'ୟୁନିଟ୍-9 / ଭୋଇ ନଗର',
  },
  35: {
    en: 'Baramunda ISBT Area',
    hi: 'बरमुंडा आईएसबीटी एरिया',
    or: 'ବରମୁଣ୍ଡା ଆଇଏସବିଟି ଅଞ୍ଚଳ',
  },
  36: {
    en: 'Baramunda Housing Board',
    hi: 'बरमुंडा हाउसिंग बोर्ड',
    or: 'ବରମୁଣ୍ଡା ହାଉସିଂ ବୋର୍ଡ',
  },
  37: {
    en: 'Khandagiri Square',
    hi: 'खंडगिरि स्क्वायर',
    or: 'ଖଣ୍ଡଗିରି ଛକ',
  },
  38: {
    en: 'Khandagiri Caves / Udayagiri',
    hi: 'खंडगिरि गुफाएं / उदयगिरि',
    or: 'ଖଣ୍ଡଗିରି ଗୁମ୍ଫା / ଉଦୟଗିରି',
  },
  39: {
    en: 'Jagamara / ITER Road',
    hi: 'जगमारा / आईटीईआर रोड',
    or: 'ଜଗମରା / ଆଇଟିଇଆର ରୋଡ୍',
  },
  40: {
    en: 'Gandamunda / Pokhariput North',
    hi: 'गंडमुंडा / पोखरीपुट उत्तर',
    or: 'ଗଣ୍ଡମୁଣ୍ଡା / ପୋଖରୀପୁଟ ଉତ୍ତର',
  },
  41: {
    en: 'Pokhariput West',
    hi: 'पोखरीपुट पश्चिम',
    or: 'ପୋଖରୀପୁଟ ପଶ୍ଚିମ',
  },
  42: {
    en: 'Pokhariput East / Aerodrome Area',
    hi: 'पोखरीपुट पूर्व / एरोड्रम एरिया',
    or: 'ପୋଖରୀପୁଟ ପୂର୍ବ / ଏରୋଡ୍ରମ ଅଞ୍ଚଳ',
  },
  43: {
    en: 'Bhimatangi Housing Board',
    hi: 'भीमटांगी हाउसिंग बोर्ड',
    or: 'ଭୀମଟାଙ୍ଗୀ ହାଉସିଂ ବୋର୍ଡ',
  },
  44: {
    en: 'Kapilaprasad',
    hi: 'कपिलाप्रसाद',
    or: 'କପିଳାପ୍ରସାଦ',
  },
  45: {
    en: 'Sundarpada Hatasahi',
    hi: 'सुंदरपड़ा हाटसाही',
    or: 'ସୁନ୍ଦରପଦା ହାଟସାହି',
  },
  46: {
    en: 'Sundarpada Hi-Tech Enclave',
    hi: 'सुंदरपड़ा हाई-टेक एन्क्लेव',
    or: 'ସୁନ୍ଦରପଦା ହାଇ-ଟେକ୍ ଏନକ୍ଲେଭ୍',
  },
  47: {
    en: 'Old Town / Lingaraj Temple',
    hi: 'ओल्ड टाउन / लिंगराज मंदिर',
    or: 'ପୁରୁଣା ଭୁବନେଶ୍ୱର / ଲିଙ୍ଗରାଜ ମନ୍ଦିର',
  },
  48: {
    en: 'Old Town / Bindusagar Heritage',
    hi: 'ओल्ड टाउन / बिंदुसागर हेरिटेज',
    or: 'ପୁରୁଣା ଭୁବନେଶ୍ୱର / ବିନ୍ଦୁସାଗର',
  },
  49: {
    en: 'Kedargouri / Rathagada',
    hi: 'केदारगौरी / रथगड़ा',
    or: 'କେଦାରଗୌରୀ / ରଥଗଡ଼ା',
  },
  50: {
    en: 'Samantarapur / Daya West',
    hi: 'सामंतरापुर / दया पश्चिम',
    or: 'ସାମନ୍ତରାପୁର / ଦୟା ପଶ୍ଚିମ',
  },
  51: {
    en: 'Badagada Brit Colony',
    hi: 'बड़गड़ा ब्रिट कॉलोनी',
    or: 'ବଡ଼ଗଡ଼ ବ୍ରିଟ୍ କଲୋନୀ',
  },
  52: {
    en: 'Badagada Village / Canal',
    hi: 'बड़गड़ा विलेज / कैनाल',
    or: 'ବଡ଼ଗଡ଼ ଗ୍ରାମ / କେନାଲ',
  },
  53: {
    en: 'Laxmisagar Square',
    hi: 'लक्ष्मीसागर स्क्वायर',
    or: 'ଲକ୍ଷ୍ମୀସାଗର ଛକ',
  },
  54: {
    en: 'Laxmisagar Canal Bank',
    hi: 'लक्ष्मीसागर कैनाल बैंक',
    or: 'ଲକ୍ଷ୍ମୀସାଗର କେନାଲ କୂଳ',
  },
  55: {
    en: 'Jharapada Jail Road',
    hi: 'झारपड़ा जेल रोड',
    or: 'ଝାରପଡ଼ା ଜେଲ୍ ରୋଡ୍',
  },
  56: {
    en: 'Jharapada Cuttack Road',
    hi: 'झारपड़ा कटक रोड',
    or: 'ଝାରପଡ଼ା କଟକ ରୋଡ୍',
  },
  57: {
    en: 'Bomikhal Gangua Canal',
    hi: 'बोमीखाल गंगुआ कैनाल',
    or: 'ବୋମିଖାଲ ଗଙ୍ଗୁଆ କେନାଲ',
  },
  58: {
    en: 'Ghatikia / Kalinga Studio',
    hi: 'घटिकिया / कलिंग स्टूडियो',
    or: 'ଘାଟିକିଆ / କଳିଙ୍ଗ ଷ୍ଟୁଡିଓ',
  },
  59: {
    en: 'Kalinga Nagar K-4 to K-7',
    hi: 'कलिंग नगर K-4 से K-7',
    or: 'କଳିଙ୍ଗ ନଗର K-4 ରୁ K-7',
  },
  60: {
    en: 'Kalinga Nagar K-8 / Tata Hospital',
    hi: 'कलिंग नगर K-8 / टाटा हॉस्पिटल',
    or: 'କଳିଙ୍ଗ ନଗର K-8 / ଟାଟା ହସ୍ପିଟାଲ',
  },
  61: {
    en: 'Patrapada / AIIMS Bhubaneswar',
    hi: 'पात्रपड़ा / AIIMS भुवनेश्वर',
    or: 'ପାତ୍ରପଦା / AIIMS ଭୁବନେଶ୍ୱର',
  },
  62: {
    en: 'Dumduma Phase 1-3',
    hi: 'दुमदुमा फेज 1-3',
    or: 'ଡୁମୁଡୁମା ଫେଜ୍ 1-3',
  },
  63: {
    en: 'Dumduma HB Colony',
    hi: 'दुमदुमा एचबी कॉलोनी',
    or: 'ଡୁମୁଡୁମା ଏଚବି କଲୋନୀ',
  },
  64: {
    en: 'Tamando / NH Bypass',
    hi: 'तमंडो / NH बाईपास',
    or: 'ତମଣ୍ଡୋ / NH ବାଇପାସ୍',
  },
  65: {
    en: 'Bhagabanpur Industrial Area',
    hi: 'भगवानपुर इंडस्ट्रियल एरिया',
    or: 'ଭଗବାନପୁର ଇଣ୍ଡଷ୍ଟ୍ରିଆଲ୍ ଏରିଆ',
  },
  66: {
    en: 'Madanpur / Info Valley',
    hi: 'मदनपुर / इन्फो वैली',
    or: 'ମଦନପୁର / ଇନଫୋ ଭ୍ୟାଲି',
  },
  67: {
    en: 'Jatni Border / InfoCity South',
    hi: 'जटनी बॉर्डर / इन्फोसिटी साउथ',
    or: 'ଜଟଣୀ ସୀମା / ଇନଫୋସିଟି ଦକ୍ଷିଣ',
  },
};

export function getWardTranslation(
  wardId: number | string,
  lang: Language = 'en'
): string | undefined {
  const numericId = typeof wardId === 'number' ? wardId : parseInt(String(wardId).replace(/\D/g, ''), 10);
  if (!numericId || isNaN(numericId)) return undefined;
  const entry = WARD_NAMES[numericId];
  if (!entry) return undefined;
  return entry[lang] || entry.en;
}
