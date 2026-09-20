import { Language } from '../languages';

export interface PhraseTranslation {
  hi: string;
  or: string;
}

export const PHRASES: Record<string, PhraseTranslation> = {
  // Hazard Descriptions
  'Flash flooding triggered by Gangua drainage channel overflow inundating low-lying residential sectors K-4 through K-7.': {
    hi: 'गंगुआ जल निकासी चैनल के उफान से निचले आवासीय सेक्टर K-4 से K-7 में अचानक बाढ़ आ गई है।',
    or: 'ଗଙ୍ଗୁଆ ନାଳର ଜଳସ୍ତର ବୃଦ୍ଧି ପାଇ K-4 ରୁ K-7 ପର୍ଯ୍ୟନ୍ତ ତଳିଆ ଆବାସିକ ଅଞ୍ଚଳରେ ହଠାତ୍ ବନ୍ୟା ପରିସ୍ଥିତି ସୃଷ୍ଟି ହୋଇଛି।',
  },
  'Severe waterlogging at Bomikhal canal junction and Cuttack-Puri flyover underpass; water depth exceeding 75cm.': {
    hi: 'बोमीखाल कैनाल जंक्शन और कटक-पुरी फ्लाईओवर अंडरपास पर गंभीर जलभराव; पानी की गहराई 75 सेमी से अधिक।',
    or: 'ବୋମିଖାଲ କେନାଲ ଛକ ଏବଂ କଟକ-ପୁରୀ ଫ୍ଲାଏଓଭର ଅଣ୍ଡରପାସରେ ପ୍ରବଳ ଜଳଜମା; ଜଳପତ୍ତନ 75 ସେମିରୁ ଅଧିକ।',
  },
  'Intense precipitation rate measuring 45mm/hr causing urban runoff around the Interstate Bus Terminal and NH-16 service lanes.': {
    hi: '45 मिमी/घंटा की तीव्र वर्षा दर से अंतरराज्यीय बस टर्मिनल और NH-16 सर्विस लेन के आसपास जलभराव हो रहा है।',
    or: 'ଘଣ୍ଟା ପ୍ରତି 45 ମିମି ବର୍ଷା ଯୋଗୁଁ ଆନ୍ତଃରାଜ୍ୟ ବସ୍ ଟର୍ମିନାଲ୍ ଏବଂ NH-16 ସର୍ଭିସ୍ ରୋଡରେ ଜଳବନ୍ଦୀ ସମସ୍ୟା ଦେଖାଦେଇଛି।',
  },
  'Daya River backflow inundating agricultural fringes and low-lying residential apartments in Sundarpada.': {
    hi: 'दया नदी के बैकफ्लो से सुंदरपड़ा में कृषि भूमि और निचले आवासीय अपार्टमेंट जलमग्न हो रहे हैं।',
    or: 'ଦୟା ନଦୀର ବ୍ୟାକଫ୍ଲୋ ଯୋଗୁଁ ସୁନ୍ଦରପଦାର ଚାଷଜମି ଏବଂ ତଳିଆ ଆପାର୍ଟମେଣ୍ଟଗୁଡ଼ିକରେ ପାଣି ପଶିଯାଇଛି।',
  },
  'Moderate water accumulation on industrial corridor link roads due to canal siltation.': {
    hi: 'नहर में गाद जमा होने के कारण औद्योगिक गलियारे की संपर्क सड़कों पर मध्यम जलभराव।',
    or: 'କେନାଲରେ ପଙ୍କ ଜମିବା ଯୋଗୁଁ ଶିଳ୍ପାଞ୍ଚଳ ସଂଯୋଗକାରୀ ରାସ୍ତାରେ ମଧ୍ୟମ ଧରଣର ଜଳଜମା ହୋଇଛି।',
  },
  'Street-level water stagnation along Behera Sahi internal lanes after torrential downpours.': {
    hi: 'मूसलाधार बारिश के बाद बेहरा साही की आंतरिक गलियों में सड़क स्तर पर जलभराव।',
    or: 'ପ୍ରବଳ ବର୍ଷା ପରେ ବେହେରା ସାହିର ଭିତର ରାସ୍ତାଗୁଡ଼ିକରେ ପାଣି ଜମି ରହିଛି।',
  },
  'Isolated convective lightning strikes detected by Doppler radar over north tech corridor.': {
    hi: 'डॉपलर रडार द्वारा उत्तरी तकनीकी गलियारे पर छिटपुट आकाशीय बिजली की गतिविधि दर्ज की गई।',
    or: 'ଡପଲର୍ ରାଡାର୍ ଦ୍ୱାରା ଉତ୍ତର ଆଇଟି କରିଡର୍ରେ ବିକ୍ଷିପ୍ତ ବଜ୍ରପାତ ଚିହ୍ନଟ ହୋଇଛି।',
  },
  'Low-probability lightning activity over heritage zone. Normal drainage discharge.': {
    hi: 'हेरिटेज जोन में आकाशीय बिजली की कम संभावना। सामान्य जल निकासी जारी।',
    or: 'ଐତିହ୍ୟ ଅଞ୍ଚଳରେ ବଜ୍ରପାତର କମ୍ ସମ୍ଭାବନା। ଜଳ ନିଷ୍କାସନ ସ୍ୱାଭାବିକ ଅଛି।',
  },

  // Recommended Actions
  'Immediate evacuation of ground floor residences. Move to designated higher ground shelters (SUM Ultimate Relief Annex). Avoid Kalinga Nagar main arterial road.': {
    hi: 'भूतल के आवासों को तत्काल खाली करें। निर्दिष्ट ऊंचे आश्रय स्थलों (सम अल्टीमेट रिलीफ एनेक्स) में जाएं। कलिंग नगर मुख्य मार्ग से बचें।',
    or: 'ତଳ ମହଲାରେ ରହୁଥିବା ଲୋକେ ତୁରନ୍ତ ସ୍ଥାନାନ୍ତର ହୁଅନ୍ତୁ। ନିକଟସ୍ଥ ଉଚ୍ଚ ଆଶ୍ରୟସ୍ଥଳ (ସମ୍ ଅଲ୍ଟିମେଟ୍ ରିଲିଫ୍ ଆନେକ୍ସ)କୁ ଯାଆନ୍ତୁ। କଳିଙ୍ଗ ନଗର ମୁଖ୍ୟ ରାସ୍ତା ଆଡ଼କୁ ଯାଆନ୍ତୁ ନାହିଁ।',
  },
  'Traffic diversion active. Heavy vehicle movement restricted. High-capacity dewatering pumps operational.': {
    hi: 'यातायात डायवर्जन सक्रिय। भारी वाहनों की आवाजाही प्रतिबंधित। उच्च क्षमता वाले डीवाटरिंग पंप चालू हैं।',
    or: 'ଟ୍ରାଫିକ୍ ଡାଇଭର୍ସନ୍ ଲାଗୁ। ଭାରୀ ଯାନ ଚଳାଚଳ ନିଷିଦ୍ଧ। ଉଚ୍ଚ କ୍ଷମତା ସମ୍ପନ୍ନ ଜଳ ନିଷ୍କାସନ ପମ୍ପ କାର୍ଯ୍ୟକ୍ଷମ।',
  },
  'Commuters advised to avoid bus stand underground pedestrian crossings. Maintain safe driving distance on NH-16.': {
    hi: 'यात्रियों को बस स्टैंड के भूमिगत पैदल पार पथ से बचने की सलाह दी जाती है। NH-16 पर सुरक्षित दूरी बनाए रखें।',
    or: 'ଯାତ୍ରୀମାନେ ବସ୍ ଷ୍ଟାଣ୍ଡ ଭୂତଳ ପାଦଚଲା ପୋଲ ବ୍ୟବହାର ନ କରିବାକୁ ପରାମର୍ଶ। NH-16 ରେ ନିରାପଦ ଦୂରତା ବଜାୟ ରଖନ୍ତୁ।',
  },
  'Ground floor residents move valuables to upper levels. BMC boat teams on standby at Sundarpada bridge.': {
    hi: 'भूतल के निवासी कीमती सामान को ऊपरी मंजिल पर ले जाएं। सुंदरपड़ा पुल पर BMC नाव दल तैयार है।',
    or: 'ତଳ ମହଲା ବାସିନ୍ଦା ମୂଲ୍ୟବାନ ସାମଗ୍ରୀ ଉପର ମହଲାକୁ ନିଅନ୍ତୁ। ସୁନ୍ଦରପଦା ପୋଲ ନିକଟରେ BMC ଡଙ୍ଗା ଟିମ୍ ପ୍ରସ୍ତୁତ ଅଛନ୍ତି।',
  },
  'Exercise caution while operating heavy machinery. Drive with hazard lights in slow lanes.': {
    hi: 'भारी मशीनरी चलाते समय सावधानी बरतें। धीमी लेन में हैजर्ड लाइट चालू रखकर वाहन चलाएं।',
    or: 'ଭାରୀ ଯନ୍ତ୍ରପାତି ଚଳାଇବା ସମୟରେ ସତର୍କତା ଅବଲମ୍ବନ କରନ୍ତୁ। ଧୀମା ଲେନରେ ହାଜାର୍ଡ ଲାଇଟ୍ ଲଗାଇ ଯାନ ଚଳାନ୍ତୁ।',
  },
  'Pedestrians advised to watch for open manholes and submerged utility covers.': {
    hi: 'पैदल यात्रियों को खुले मैनहोल और डूबे हुए ढक्कनों से सावधान रहने की सलाह दी जाती है।',
    or: 'ପାଦଚଲା ଯାତ୍ରୀମାନେ ଖୋଲା ଥିବା ଡ୍ରେନ୍ ଓ ମ୍ୟାନହୋଲ୍ ପ୍ରତି ସତର୍କ ରହିବାକୁ ପରାମର୍ଶ।',
  },
  'Stay indoors away from open fields, mobile towers, and tall trees during thunderstorms.': {
    hi: 'गरज-चमक के दौरान खुले मैदानों, मोबाइल टावरों और ऊंचे पेड़ों से दूर घर के अंदर रहें।',
    or: 'ବଜ୍ରପାତ ସମୟରେ ଖୋଲା ପଡ଼ିଆ, ମୋବାଇଲ୍ ଟାୱାର୍ ଏବଂ ଉଚ୍ଚ ଗଛଠାରୁ ଦୂରରେ ରହି ଘର ଭିତରେ ରୁହନ୍ତୁ।',
  },
  'Standard monsoon precautions apply.': {
    hi: 'मानक मानसून सावधानियां लागू हैं।',
    or: 'ସାଧାରଣ ବର୍ଷାଜନିତ ସତର୍କତା ନିୟମାବଳୀ ଲାଗୁ।',
  },

  // Safe Place Names
  'AIIMS Bhubaneswar Hospital & Trauma Centre': {
    hi: 'एम्स भुवनेश्वर अस्पताल एवं ट्रॉमा सेंटर',
    or: 'ଏମ୍ସ ଭୁବନେଶ୍ୱର ଡାକ୍ତରଖାନା ଏବଂ ଟ୍ରମା ସେଣ୍ଟର',
  },
  'Capital Hospital (District HQ Hospital)': {
    hi: 'कैपिटल अस्पताल (जिला मुख्यालय अस्पताल)',
    or: 'କ୍ୟାପିଟାଲ ହସ୍ପିଟାଲ (ଜିଲ୍ଲା ମୁଖ୍ୟ ଡାକ୍ତରଖାନା)',
  },
  'SUM Ultimate Medicare Relief Camp Annex': {
    hi: 'सम अल्टीमेट मेडिकेयर राहत शिविर एनेक्स',
    or: 'ସମ୍ ଅଲ୍ଟିମେଟ୍ ମେଡିକେୟାର ରିଲିଫ୍ ଶିବିର ଆନେକ୍ସ',
  },
  'BMC Official Cyclone & Flood Shelter - Baramunda': {
    hi: 'BMC आधिकारिक चक्रवात एवं बाढ़ आश्रय - बरमुंडा',
    or: 'BMC ସରକାରୀ ବାତ୍ୟା ଓ ବନ୍ୟା ଆଶ୍ରୟସ୍ଥଳ - ବରମୁଣ୍ଡା',
  },
  'Kalinga Nagar Community Kalyan Mandap (Hazard Inundated)': {
    hi: 'कलिंग नगर सामुदायिक कल्याण मंडप (जलमग्न)',
    or: 'କଳିଙ୍ଗ ନଗର କଲ୍ୟାଣ ମଣ୍ଡପ (ଜଳମଗ୍ନ)',
  },
  'Odisha Fire & Disaster Response Station - Kalpana': {
    hi: 'ओडिशा अग्निशमन एवं आपदा प्रतिक्रिया स्टेशन - कल्पना',
    or: 'ଓଡ଼ିଶା ଅଗ୍ନିଶମ ଓ ବିପର୍ଯ୍ୟୟ ପ୍ରଶମନ ଷ୍ଟେସନ - କଳ୍ପନା',
  },
  'Khandagiri Police Station & Disaster Response Post': {
    hi: 'खंडगिरि पुलिस स्टेशन एवं आपदा प्रतिक्रिया चौकी',
    or: 'ଖଣ୍ଡଗିରି ଥାନା ଏବଂ ବିପର୍ଯ୍ୟୟ ମୁକାବିଲା ପୋଷ୍ଟ',
  },
  'BMC Temporary Relief Camp - IRC Village High School': {
    hi: 'BMC अस्थायी राहत शिविर - आईआरसी विलेज हाई स्कूल',
    or: 'BMC ଅସ୍ଥାୟୀ ରିଲିଫ୍ ଶିବିର - ଆଇଆରସି ଭିଲେଜ୍ ହାଇସ୍କୁଲ୍',
  },
  'KIMS Medical College & Emergency Hospital': {
    hi: 'किम्स मेडिकल कॉलेज एवं आपातकालीन अस्पताल',
    or: 'କିମ୍ସ ମେଡିକାଲ କଲେଜ ଏବଂ ଜରୁରୀକାଳୀନ ଡାକ୍ତରଖାନା',
  },
  'Multipurpose Cyclone & Evacuation Shelter - Old Town': {
    hi: 'बहुउद्देशीय चक्रवात एवं निकासी आश्रय - ओल्ड टाउन',
    or: 'ବହୁମୁଖୀ ବାତ୍ୟା ଓ ଆଶ୍ରୟସ୍ଥଳ - ଓଲ୍ଡ ଟାଉନ୍',
  },
  'BMC Community Relief Camp - Niladri Vihar Kalyan Mandap': {
    hi: 'BMC सामुदायिक राहत शिविर - नीलाद्री विहार कल्याण मंडप',
    or: 'BMC ସାମୁଦାୟିକ ରିଲିଫ୍ ଶିବିର - ନୀଳାଦ୍ରି ବିହାର କଲ୍ୟାଣ ମଣ୍ଡପ',
  },
  'ODRAF Disaster Response HQ & Fire Station - Chandaka': {
    hi: 'ओड्राफ (ODRAF) आपदा प्रतिक्रिया मुख्यालय एवं अग्निशमन स्टेशन - चंडका',
    or: 'ଓଡ୍ରାଫ୍ (ODRAF) ବିପର୍ଯ୍ୟୟ ପ୍ରଶମନ ମୁଖ୍ୟାଳୟ ଓ ଅଗ୍ନିଶମ କେନ୍ଦ୍ର - ଚନ୍ଦକା',
  },

  // Safe Place Addresses
  'Sijua, Patrapada, Bhubaneswar, Odisha 751019': {
    hi: 'सिजुआ, पात्रपड़ा, भुवनेश्वर, ओडिशा 751019',
    or: 'ସିଜୁଆ, ପାତ୍ରପଦା, ଭୁବନେଶ୍ୱର, ଓଡ଼ିଶା 751019',
  },
  'Unit 6, Forest Park, Bhubaneswar, Odisha 751001': {
    hi: 'यूनिट 6, फॉरेस्ट पार्क, भुवनेश्वर, ओडिशा 751001',
    or: 'ୟୁନିଟ୍ 6, ଫରେଷ୍ଟ ପାର୍କ, ଭୁବନେଶ୍ୱର, ଓଡ଼ିଶା 751001',
  },
  'Kalinga Nagar Sector 8, Bhubaneswar 751003': {
    hi: 'कलिंग नगर सेक्टर 8, भुवनेश्वर 751003',
    or: 'କଳିଙ୍ଗ ନଗର ସେକ୍ଟର 8, ଭୁବନେଶ୍ୱର 751003',
  },
  'Near ISBT Complex, Baramunda, Bhubaneswar 751003': {
    hi: 'आईएसबीटी कॉम्प्लेक्स के पास, बरमुंडा, भुवनेश्वर 751003',
    or: 'ଆଇଏସବିଟି କମ୍ପ୍ଲେକ୍ସ ନିକଟ, ବରମୁଣ୍ଡା, ଭୁବନେଶ୍ୱର 751003',
  },
  'Sector K-4, Kalinga Nagar, Bhubaneswar 751003': {
    hi: 'सेक्टर K-4, कलिंग नगर, भुवनेश्वर 751003',
    or: 'ସେକ୍ଟର K-4, କଳିଙ୍ଗ ନଗର, ଭୁବନେଶ୍ୱର 751003',
  },
  'Kalpana Square, Cuttack-Puri Road, Bhubaneswar 751014': {
    hi: 'कल्पना स्क्वायर, कटक-पुरी रोड, भुवनेश्वर 751014',
    or: 'କଳ୍ପନା ଛକ, କଟକ-ପୁରୀ ରୋଡ୍, ଭୁବନେଶ୍ୱର 751014',
  },
  'Khandagiri Square, NH-16 Junction, Bhubaneswar 751030': {
    hi: 'खंडगिरि स्क्वायर, NH-16 जंक्शन, भुवनेश्वर 751030',
    or: 'ଖଣ୍ଡଗିରି ଛକ, NH-16 ଛକ, ଭୁବନେଶ୍ୱର 751030',
  },
  'IRC Village Sector 2, Nayapalli, Bhubaneswar 751015': {
    hi: 'आईआरसी विलेज सेक्टर 2, नयापल्ली, भुवनेश्वर 751015',
    or: 'ଆଇଆରସି ଭିଲେଜ୍ ସେକ୍ଟର 2, ନୟାପଲ୍ଲୀ, ଭୁବନେଶ୍ୱର 751015',
  },
  'KIIT Road, Patia, Bhubaneswar, Odisha 751024': {
    hi: 'केआईआईटी रोड, पटिया, भुवनेश्वर, ओडिशा 751024',
    or: 'କିଟ୍ ରୋଡ୍, ପଟିଆ, ଭୁବନେଶ୍ୱର, ଓଡ଼ିଶା 751024',
  },
  'Near Bindusagar Lake, Old Town, Bhubaneswar 751002': {
    hi: 'बिंदुसागर झील के पास, ओल्ड टाउन, भुवनेश्वर 751002',
    or: 'ବିନ୍ଦୁସାଗର ହ୍ରଦ ନିକଟ, ଓଲ୍ଡ ଟାଉନ୍, ଭୁବନେଶ୍ୱର 751002',
  },
  'Sector 3, Niladri Vihar, Chandrasekharpur, Bhubaneswar 751021': {
    hi: 'सेक्टर 3, नीलाद्री विहार, चंद्रशेखरपुर, भुवनेश्वर 751021',
    or: 'ସେକ୍ଟର 3, ନୀଳାଦ୍ରି ବିହାର, ଚନ୍ଦ୍ରଶେଖରପୁର, ଭୁବନେଶ୍ୱର 751021',
  },
  'Chandaka Industrial Area, Bhubaneswar 751024': {
    hi: 'चंडका औद्योगिक क्षेत्र, भुवनेश्वर 751024',
    or: 'ଚନ୍ଦକା ଶିଳ୍ପାଞ୍ଚଳ, ଭୁବନେଶ୍ୱର 751024',
  },
  'Patia / KIIT Campus': {
    hi: 'पटिया / केआईआईटी परिसर',
    or: 'ପଟିଆ / କିଟ୍ କ୍ୟାମ୍ପସ',
  },
  'Old Town / Lingaraj Temple': {
    hi: 'ओल्ड टाउन / लिंगराज मंदिर',
    or: 'ଓଲ୍ଡ ଟାଉନ୍ / ଲିଙ୍ଗରାଜ ମନ୍ଦିର',
  },
  'Niladri Vihar / Chandrasekharpur': {
    hi: 'नीलाद्री विहार / चंद्रशेखरपुर',
    or: 'ନୀଳାଦ୍ରି ବିହାର / ଚନ୍ଦ୍ରଶେଖରପୁର',
  },
  'Chandaka Industrial Belt': {
    hi: 'चंडका औद्योगिक क्षेत्र',
    or: 'ଚନ୍ଦକା ଶିଳ୍ପାଞ୍ଚଳ',
  },

  // Safe Place Facilities
  '24x7 Emergency': { hi: '24x7 आपातकालीन सेवा', or: '24x7 ଜରୁରୀକାଳୀନ ସେବା' },
  'Trauma ICU': { hi: 'ट्रॉमा आईसीयू', or: 'ଟ୍ରମା ଆଇସିୟୁ' },
  'Oxygen Plant': { hi: 'ऑक्सीजन प्लांट', or: 'ଅକ୍ସିଜେନ୍ ପ୍ଲାଣ୍ଟ' },
  'Helipad': { hi: 'हेलीपैड', or: 'ହେଲିପ୍ୟାଡ୍' },
  'Ambulance Fleet': { hi: 'एम्बुलेंस बेड़ा', or: 'ଆମ୍ବୁଲାନ୍ସ ବାହିନୀ' },
  'Blood Bank': { hi: 'ब्लड बैंक', or: 'ରକ୍ତ ଭଣ୍ଡାର' },
  'Emergency Ward': { hi: 'आपातकालीन वार्ड', or: 'ଜରୁରୀକାଳୀନ ୱାର୍ଡ' },
  'Dialysis Unit': { hi: 'डायलिसिस यूनिट', or: 'ଡାଏଲିସିସ୍ ୟୁନିଟ୍' },
  'Burn Ward': { hi: 'बर्न वार्ड', or: 'ପୋଡ଼ାଜଳା ୱାର୍ଡ' },
  'Clean Drinking Water': { hi: 'स्वच्छ पेयजल', or: 'ବିଶୁଦ୍ଧ ପାନୀୟ ଜଳ' },
  'Dry Rations': { hi: 'सूखा राशन', or: 'ଶୁଖିଲା ଖାଦ୍ୟ ସାମଗ୍ରୀ' },
  'First Aid Station': { hi: 'प्राथमिक उपचार केंद्र', or: 'ପ୍ରାଥମିକ ଚିକିତ୍ସା କେନ୍ଦ୍ର' },
  'Baby Care': { hi: 'शिशु देखभाल', or: 'ଶିଶୁ ଯତ୍ନ' },
  'Backup Generator': { hi: 'बैकअप जनरेटर', or: 'ଜରୁରୀକାଳୀନ ଜେନେରେଟର' },
  'Community Kitchen': { hi: 'सामुदायिक रसोई', or: 'ସାମୁଦାୟିକ ରୋଷେଇଶାଳା' },
  'Sanitation Blocks': { hi: 'शौचालय परिसर', or: 'ଶୌଚାଳୟ ବ୍ୟବସ୍ଥା' },
  'Solar Lighting': { hi: 'सौर प्रकाश व्यवस्था', or: 'ସୌର ଆଲୋକ ବ୍ୟବସ୍ଥା' },
  'Community Hall': { hi: 'सामुदायिक भवन', or: 'କଲ୍ୟାଣ ମଣ୍ଡପ' },
  'Diverted': { hi: 'डायवर्ट किया गया', or: 'ଅନ୍ୟତ୍ର ସ୍ଥାନାନ୍ତରିତ' },
  'Inflatable Rescue Boats': { hi: 'इन्फ्लेटेबल बचाव नौकाएं', or: 'ଉଦ୍ଧାରକାରୀ ରବର ଡଙ୍ଗା' },
  'Dewatering Pumps': { hi: 'डीवाटरिंग पंप', or: 'ଜଳ ନିଷ୍କାସନ ପମ୍ପ' },
  'Chainsaws': { hi: 'चेनसॉ', or: 'କାଠ କଟା ଚେନସ' },
  'Hydraulic Cutters': { hi: 'हाइड्रोलिक कटर', or: 'ହାଇଡ୍ରୋଲିକ୍ କଟର' },
  'Emergency Control Room': { hi: 'आपातकालीन नियंत्रण कक्ष', or: 'ଜରୁରୀକାଳୀନ ନିୟନ୍ତ୍ରଣ କକ୍ଷ' },
  'VHF Comms': { hi: 'वीएचएफ संचार', or: 'VHF ବେତାର ଯୋଗାଯୋଗ' },
  'First Aid': { hi: 'प्राथमिक उपचार', or: 'ପ୍ରାଥମିକ ଚିକିତ୍ସା' },
  'Clean Water Tanks': { hi: 'स्वच्छ जल टंकी', or: 'ବିଶୁଦ୍ଧ ପାଣି ଟାଙ୍କି' },
  'Dry Food Distribution': { hi: 'सूखा भोजन वितरण', or: 'ଶୁଖିଲା ଖାଦ୍ୟ ବଣ୍ଟନ' },
  'Doctor on Call': { hi: 'ऑन-कॉल चिकित्सक', or: 'ଡାକ୍ତର ଉପଲବ୍ଧ' },
  'Mattresses': { hi: 'गद्दे व बिस्तर', or: 'ଶେଯ ଓ ବିଛଣା' },
  'Trauma Center': { hi: 'ट्रॉमा सेंटर', or: 'ଟ୍ରମା ସେଣ୍ଟର' },
  '24x7 Ambulance': { hi: '24x7 एम्बुलेंस', or: '24x7 ଆମ୍ବୁଲାନ୍ସ' },
  'Emergency ICU': { hi: 'आपातकालीन आईसीयू', or: 'ଜରୁରୀକାଳୀନ ଆଇସିୟୁ' },
  'Emergency Power': { hi: 'आपातकालीन बिजली', or: 'ଜରୁରୀକାଳୀନ ବିଦ୍ୟୁତ ସେବା' },
  'Food Storage': { hi: 'खाद्य भंडारण', or: 'ଖାଦ୍ୟ ଭଣ୍ଡାର' },
  'Water Supply': { hi: 'जल आपूर्ति', or: 'ଜଳ ଯୋଗାଣ' },
  'Medical Assistance': { hi: 'चिकित्सा सहायता', or: 'ଚିକିତ୍ସା ସହାୟତା' },
  'Childcare Corner': { hi: 'शिशु देखभाल केंद्र', or: 'ଶିଶୁ ଯତ୍ନ କେନ୍ଦ୍ର' },
  'Heavy Rescue Vehicles': { hi: 'भारी बचाव वाहन', or: 'ଭାରୀ ଉଦ୍ଧାରକାରୀ ଯାନ' },
  'Tree Cutters': { hi: 'पेड़ काटने वाले उपकरण', or: 'ଗଛ କଟା ଯନ୍ତ୍ର' },
  'High-Volume Dewatering Pumps': { hi: 'उच्च-क्षमता वाले डीवाटरिंग पंप', or: 'ଉଚ୍ଚ କ୍ଷମତା ସମ୍ପନ୍ନ ଜଳ ନିଷ୍କାସନ ପମ୍ପ' },
  'High-Mobility Craft': { hi: 'उच्च-गतिशीलता बचाव नौका', or: 'ଦ୍ରୁତଗାମୀ ଉଦ୍ଧାରକାରୀ ଡଙ୍ଗା' },

  // News Titles & Overviews
  'Gangua Canal Breaches Embankment in Kalinga Nagar: 400 Families Relocated': {
    hi: 'कलिंग नगर में गंगुआ नहर का तटबंध टूटा: 400 परिवारों को सुरक्षित स्थान पर पहुंचाया गया',
    or: 'କଳିଙ୍ଗ ନଗରରେ ଗଙ୍ଗୁଆ କେନାଲ ବନ୍ଧ ଭାଙ୍ଗିଲା: 400 ପରିବାର ସ୍ଥାନାନ୍ତରିତ',
  },
  'Continuous torrential downpours across Khordha district triggered unprecedented discharge in Gangua Canal, inundating Kalinga Nagar Sectors K-4 and K-5. ODRAF deployed rescue dinghies.': {
    hi: 'खोर्धा जिले में लगातार मूसलाधार बारिश से गंगुआ नहर में अभूतपूर्व जलप्रवाह हुआ, जिससे कलिंग नगर के सेक्टर K-4 और K-5 जलमग्न हो गए। ओड्राफ ने बचाव नौकाएं तैनात की हैं।',
    or: 'ଖୋର୍ଦ୍ଧା ଜିଲ୍ଲାରେ ଲଗାଣ ବର୍ଷା ଯୋଗୁଁ ଗଙ୍ଗୁଆ କେନାଲରେ ଜଳସ୍ତର ବୃଦ୍ଧି ପାଇ କଳିଙ୍ଗ ନଗର ସେକ୍ଟର K-4 ଏବଂ K-5 ଜଳମଗ୍ନ ହୋଇଛି। ଓଡ୍ରାଫ୍ ପକ୍ଷରୁ ଉଦ୍ଧାର କାର୍ଯ୍ୟ ଜାରି ରହିଛି।',
  },
  'Bomikhal Flyover Underpass Inundated: BMC Deploys 5 Heavy Dewatering Pumps': {
    hi: 'बोमीखाल फ्लाईओवर अंडरपास जलमग्न: BMC ने 5 भारी डीवाटरिंग पंप तैनात किए',
    or: 'ବୋମିଖାଲ ଫ୍ଲାଏଓଭର ଅଣ୍ଡରପାସ୍ ଜଳମଗ୍ନ: BMC ପକ୍ଷରୁ 5ଟି ଭାରୀ ପମ୍ପ ମୁତୟନ',
  },
  'Traffic along Cuttack-Puri road came to a standstill as stormwater accumulated up to 75cm at Bomikhal junction. BMC engineers are clearing downstream drainage gates.': {
    hi: 'बोमीखाल जंक्शन पर 75 सेमी तक बारिश का पानी जमा होने से कटक-पुरी रोड पर यातायात ठप हो गया। BMC इंजीनियर जल निकासी द्वारों की सफाई कर रहे हैं।',
    or: 'ବୋମିଖାଲ ଛକରେ 75 ସେମି ପର୍ଯ୍ୟନ୍ତ ପାଣି ଜମି ରହିବାରୁ କଟକ-ପୁରୀ ରୋଡରେ ଯାତାୟାତ ବାଧାପ୍ରାପ୍ତ। BMC ଯନ୍ତ୍ରୀମାନେ ନାଳ ସଫା କରୁଛନ୍ତି।',
  },
  'Baramunda ISBT Plagued by Severe Water Stagnation: Bus Operations Diverted': {
    hi: 'बरमुंडा आईएसबीटी में भारी जलजमाव: बस संचालन डायवर्ट',
    or: 'ବରମୁଣ୍ଡା ଆଇଏସବିଟିରେ ପ୍ରବଳ ଜଳବନ୍ଦୀ: ବସ୍ ଚଳାଚଳ ଅନ୍ୟ ରାସ୍ତାରେ ଡାଇଭର୍ଟ',
  },
  'Intense rain over the capital caused flash accumulation in Baramunda terminal departure bays. Long distance buses are being routed through Khandagiri square.': {
    hi: 'राजधानी में भारी बारिश से बरमुंडा टर्मिनल के प्रस्थान बे में अचानक पानी भर गया। लंबी दूरी की बसों को खंडगिरि चौराहे से डायवर्ट किया जा रहा है।',
    or: 'ରାଜଧାନୀରେ ପ୍ରବଳ ବର୍ଷା ଯୋଗୁଁ ବରମୁଣ୍ଡା ଟର୍ମିନାଲରେ ପାଣି ଜମିଯାଇଛି। ଦୂରଗାମୀ ବସ୍‌ଗୁଡ଼ିକୁ ଖଣ୍ଡଗିରି ଛକ ଦେଇ ଛଡ଼ାଯାଉଛି।',
  },
  'IMD Issues Red Alert for Bhubaneswar & Cuttack: 150mm Rain Expected in 24 Hours': {
    hi: 'IMD ने भुवनेश्वर और कटक के लिए रेड अलर्ट जारी किया: 24 घंटों में 150 मिमी बारिश की संभावना',
    or: 'ଭୁବନେଶ୍ୱର ଓ କଟକ ପାଇଁ IMD ର ରେଡ୍ ଆଲର୍ଟ: 24 ଘଣ୍ଟାରେ 150 ମିମି ବର୍ଷା ସମ୍ଭାବନା',
  },
  'The India Meteorological Department (IMD) warned of intense monsoonal squalls and lightning activity across the Twin Cities under the influence of a deep depression over northwest Bay of Bengal.': {
    hi: 'भारत मौसम विज्ञान विभाग (IMD) ने उत्तर-पश्चिम बंगाल की खाड़ी में गहरे दबाव के प्रभाव से जुड़वां शहरों में भारी मानसूनी हवाओं और बिजली गिरने की चेतावनी दी है।',
    or: 'ଭାରତୀୟ ପାଣିପାଗ ବିଭାଗ (IMD) ପକ୍ଷରୁ ଉତ୍ତର-ପଶ୍ଚିମ ବଙ୍ଗୋପସାଗରରେ ସୃଷ୍ଟ ଅବପାତ ପ୍ରଭାବରେ ଟ୍ୱିନ୍ ସିଟିରେ ପ୍ରବଳ ବର୍ଷା ଓ ବଜ୍ରପାତର ଚେତାବନୀ ଦିଆଯାଇଛି।',
  },
  'Deep Depression Over Bay of Bengal Intensifies: Coastal Odisha Put on High Alert': {
    hi: 'बंगाल की खाड़ी में गहरा दबाव और तीव्र: तटीय ओडिशा में हाई अलर्ट',
    or: 'ବଙ୍ଗୋପସାଗରରେ ଗଭୀର ଅବପାତ ଘନୀଭୂତ: ଉପକୂଳ ଓଡ଼ିଶାରେ ହାଇ ଆଲର୍ଟ ଜାରି',
  },
  'Special Relief Commissioner (SRC) Odisha has directed all district administrations including BMC to keep 24x7 control rooms staffed and pre-position power saws and pumps.': {
    hi: 'विशेष राहत आयुक्त (SRC) ओडिशा ने BMC सहित सभी जिला प्रशासनों को 24x7 नियंत्रण कक्ष सक्रिय रखने और आरी व पंप तैयार रखने का निर्देश दिया है।',
    or: 'ସ୍ୱତନ୍ତ୍ର ରିଲିଫ୍ କମିଶନର (SRC) BMC ସମେତ ସମସ୍ତ ଜିଲ୍ଲା ପ୍ରଶାସନକୁ 24x7 କଣ୍ଟ୍ରୋଲ୍ ରୁମ୍ ଚାଲୁ ରଖିବାକୁ ଏବଂ ପମ୍ପ ଓ କଟର୍ ମହଜୁଦ ରଖିବାକୁ ନିର୍ଦ୍ଦେଶ ଦେଇଛନ୍ତି।',
  },

  // Official Field Updates
  '3 of 5 high-capacity submersible dewatering pumps are operational. Silt trap cleared at canal bottleneck.': {
    hi: '5 में से 3 उच्च क्षमता वाले सबमर्सिबल डीवाटरिंग पंप चालू हैं। नहर के मुहाने पर गाद साफ कर दी गई है।',
    or: '5 ଟି ମଧ୍ୟରୁ 3 ଟି ଭାରୀ ପମ୍ପ କାର୍ଯ୍ୟକ୍ଷମ ଅଛି। କେନାଲର ପଙ୍କ ସଫା କରାଯାଇଛି।',
  },
  'Dewatering rate: 18,000 liters/min. One lane reopened for light emergency vehicles under police escort.': {
    hi: 'जल निकासी दर: 18,000 लीटर/मिनट। पुलिस सुरक्षा में हल्के आपातकालीन वाहनों के लिए एक लेन खोली गई।',
    or: 'ଜଳ ନିଷ୍କାସନ ହାର: ମିନିଟ୍ ପ୍ରତି 18,000 ଲିଟର। ପୋଲିସ୍ ସହାୟତାରେ ଜରୁରୀକାଳୀନ ଯାନ ପାଇଁ ଗୋଟିଏ ଲେନ୍ ଖୋଲାଯାଇଛି।',
  },
  'Active emergency flood zone. ODRAF unit deployed with 4 inflatable rescue boats and life jackets.': {
    hi: 'सक्रिय आपातकालीन बाढ़ क्षेत्र। 4 इन्फ्लेटेबल बचाव नौकाओं और लाइफ जैकेट के साथ ओड्राफ इकाई तैनात।',
    or: 'ସକ୍ରିୟ ଜରୁରୀକାଳୀନ ବନ୍ୟା ଅଞ୍ଚଳ। 4 ଟି ରବର ଡଙ୍ଗା ଓ ଲାଇଫ୍ ଜ୍ୟାକେଟ୍ ସହ ଓଡ୍ରାଫ୍ ଟିମ୍ ମୁତୟନ।',
  },
  'Evacuated 120 residents to SUM Ultimate Relief Annex. Medical triage center set up at K-8 junction.': {
    hi: '120 निवासियों को सम अल्टीमेट रिलीफ एनेक्स में पहुंचाया गया। K-8 जंक्शन पर मेडिकल सहायता केंद्र स्थापित।',
    or: '120 ଜଣ ବାସିନ୍ଦାଙ୍କୁ ସମ୍ ଅଲ୍ଟିମେଟ୍ ଶିବିରକୁ ସ୍ଥାନାନ୍ତର କରାଯାଇଛି। K-8 ଛକରେ ଚିକିତ୍ସା କେନ୍ଦ୍ର ଖୋଲାଯାଇଛି।',
  },
  'Fallen banyan tree on VIP road completely cut and removed. Overhead electric lines repaired.': {
    hi: 'वीआईपी रोड पर गिरा बरगद का पेड़ पूरी तरह काटकर हटा दिया गया। ऊपर से गुजरने वाली बिजली की लाइनें ठीक कर दी गई हैं।',
    or: 'ଭିଆଇପି ରୋଡରେ ପଡ଼ିଥିବା ବରଗଛକୁ ସମ୍ପୂର୍ଣ୍ଣ କାଟି ହଟାଯାଇଛି। ବିଦ୍ୟୁତ୍ ତାର ମରାମତି ଶେଷ ହୋଇଛି।',
  },
  'Both carriage ways clear for regular vehicular traffic.': {
    hi: 'नियमित वाहन यातायात के लिए दोनों लेन पूरी तरह साफ हैं।',
    or: 'ସାଧାରଣ ଯାନବାହନ ଚଳାଚଳ ପାଇଁ ଉଭୟ ପାର୍ଶ୍ୱ ରାସ୍ତା ସମ୍ପୂର୍ଣ୍ଣ ସଫା ହୋଇଛି।',
  },
  'ODRAF Boat Unit 4 deployed to Sector K-4 for immediate evacuation.': {
    hi: 'तत्काल बचाव एवं निकासी के लिए ओड्राफ बोट यूनिट 4 को सेक्टर K-4 में तैनात किया गया।',
    or: 'ତୁରନ୍ତ ଉଦ୍ଧାର ପାଇଁ ସେକ୍ଟର K-4 ରେ ଓଡ୍ରାଫ୍ ବୋଟ୍ ୟୁନିଟ୍ 4 ମୁତୟନ କରାଯାଇଛି।',
  },
  'TPCODL disconnected live line; BMC forest wing tree cutting team at site.': {
    hi: 'टीपीसीओडीएल ने बिजली काट दी है; BMC वन विभाग की पेड़ काटने वाली टीम मौके पर है।',
    or: 'TPCODL ବିଦ୍ୟୁତ୍ ସଂଯୋଗ କାଟି ଦେଇଛି; BMC ବନ ବିଭାଗ ଗଛ କାଟିବା ପାଇଁ ଘଟଣାସ୍ଥଳରେ ଉପସ୍ଥିତ।',
  },

  // Seeded In-App Notifications
  'EMERGENCY: Flood Inundation Warning': {
    hi: 'आपातकाल: बाढ़ चेतावनी',
    or: 'ଜରୁରୀକାଳୀନ: ବନ୍ୟା ସତର୍କତା ସୂଚନା',
  },
  'Flash flooding reported in Kalinga Nagar (Ward 59). Immediate evacuation to SUM Ultimate Relief Camp advised.': {
    hi: 'कलिंग नगर (वार्ड 59) में अचानक बाढ़ की सूचना। सम अल्टीमेट राहत शिविर में तुरंत जाने की सलाह।',
    or: 'କଳିଙ୍ଗ ନଗର (ୱାର୍ଡ 59) ରେ ହଠାତ୍ ବନ୍ୟା। ତୁରନ୍ତ ସମ୍ ଅଲ୍ଟିମେଟ୍ ରିଲିଫ୍ ଶିବିରକୁ ଯିବାକୁ ପରାମର୍ଶ।',
  },
  'HIGH: Severe Waterlogging Alert': {
    hi: 'उच्च: गंभीर जलभराव चेतावनी',
    or: 'ଉଚ୍ଚ: ଗମ୍ଭୀର ଜଳଜମା ସତର୍କତା',
  },
  'Bomikhal Flyover underpass submerged (75cm water depth). Traffic diversions active.': {
    hi: 'बोमीखाल फ्लाईओवर अंडरपास जलमग्न (75 सेमी पानी की गहराई)। यातायात डायवर्जन सक्रिय।',
    or: 'ବୋମିଖାଲ ଫ୍ଲାଏଓଭର ଅଣ୍ଡରପାସ୍ ବୁଡ଼ିଯାଇଛି (75 ସେମି ଜଳପତ୍ତନ)। ଟ୍ରାଫିକ୍ ଡାଇଭର୍ସନ୍ ଲାଗୁ।',
  },
  'MODERATE: Rain Advisory': {
    hi: 'मध्यम: वर्षा परामर्श',
    or: 'ମଧ୍ୟମ: ବର୍ଷା ସତର୍କତା',
  },
  'Rasulgarh Industrial Area drainage congestion. Exercise caution while driving.': {
    hi: 'रसूलगढ़ औद्योगिक क्षेत्र में जल निकासी जाम। वाहन चलाते समय सावधानी बरतें।',
    or: 'ରସୁଲଗଡ଼ ଶିଳ୍ପାଞ୍ଚଳରେ ଜଳ ନିଷ୍କାସନ ସମସ୍ୟା। ଗାଡ଼ି ଚଳାଇବା ବେଳେ ସତର୍କ ରୁହନ୍ତୁ।',
  },

  // Auth, API & System Error Messages
  'Access Denied: You do not have System Admin privileges.': {
    hi: 'प्रवेश अस्वीकृत: आपके पास सिस्टम एडमिन विशेषाधिकार नहीं हैं।',
    or: 'ପ୍ରବେଶ ଅନୁମତି ନାହିଁ: ଆପଣଙ୍କ ପାଖରେ ସିଷ୍ଟମ୍ ଆଡମିନ୍ ଅନୁମତି ନାହିଁ।',
  },
  'Access Denied: You do not have Government Official privileges.': {
    hi: 'प्रवेश अस्वीकृत: आपके पास सरकारी अधिकारी विशेषाधिकार नहीं हैं।',
    or: 'ପ୍ରବେଶ ଅନୁମତି ନାହିଁ: ଆପଣଙ୍କ ପାଖରେ ସରକାରୀ ଅଧିକାରୀ ଅନୁମତି ନାହିଁ।',
  },
  'Google Sign-In completed without user credentials.': {
    hi: 'गूगल साइन-इन बिना उपयोगकर्ता क्रेडेंशियल के पूरा हुआ।',
    or: 'ବିନା ତଥ୍ୟରେ ଗୁଗୁଲ୍ ସାଇନ୍-ଇନ୍ ସମ୍ପନ୍ନ ହୋଇଛି।',
  },
  'Failed to initialize notification push service.': {
    hi: 'अधिसूचना पुश सेवा शुरू करने में विफल।',
    or: 'ନୋଟିଫିକେସନ୍ ସେବା ଆରମ୍ଭ କରିବାରେ ବିଫଳ।',
  },
  'Email already in use': {
    hi: 'ईमेल पहले से उपयोग में है',
    or: 'ଏହି ଇମେଲ୍ ପୂର୍ବରୁ ବ୍ୟବହୃତ ହୋଇଛି',
  },
  'Invalid phone number format': {
    hi: 'अमान्य फोन नंबर प्रारूप',
    or: 'ଅବୈଧ ଫୋନ୍ ନମ୍ବର ଫର୍ମାଟ୍',
  },
  'Citizen registered successfully': {
    hi: 'नागरिक का सफलतापूर्वक पंजीकरण हुआ',
    or: 'ନାଗରିକ ପଞ୍ଜୀକରଣ ସଫଳ ହୋଇଛି',
  },
  'Preferences updated successfully': {
    hi: 'प्राथमिकताएं सफलतापूर्वक अपडेट की गईं',
    or: 'ପ୍ରାଥମିକତା ସଫଳତାର ସହ ଅପଡେଟ୍ ହୋଇଛି',
  },
  'Location updated successfully': {
    hi: 'स्थान सफलतापूर्वक अपडेट किया गया',
    or: 'ସ୍ଥାନ ସଫଳତାର ସହ ଅପଡେଟ୍ ହୋଇଛି',
  },
  'Invalid or expired session token': {
    hi: 'अमान्य या समाप्त सत्र टोकन',
    or: 'ଅବୈଧ କିମ୍ବା ମିଆଦ ପୂରିଯାଇଥିବା ସେସନ୍ ଟୋକନ୍',
  },
  'User not found': {
    hi: 'उपयोगकर्ता नहीं मिला',
    or: 'ଉପଭୋକ୍ତା ମିଳିଲେ ନାହିଁ',
  },
  'Missing user identifier': {
    hi: 'उपयोगकर्ता पहचानकर्ता अनुपलब्ध है',
    or: 'ଉପଭୋକ୍ତା ପରିଚୟ ମିଳୁନାହିଁ',
  },
  'Unauthorized: Cannot update location of another user': {
    hi: 'अनधिकृत: किसी अन्य उपयोगकर्ता का स्थान अपडेट नहीं किया जा सकता',
    or: 'ଅନଧିକୃତ: ଅନ୍ୟ ଉପଭୋକ୍ତାଙ୍କ ସ୍ଥାନ ଅପଡେଟ୍ କରିପାରିବେ ନାହିଁ',
  },
  'Coordinates out of bounds (-90 to 90 lat, -180 to 180 lon)': {
    hi: 'निर्देशांक सीमा से बाहर हैं (-90 से 90 अक्षांश, -180 से 180 देशांतर)',
    or: 'ଅକ୍ଷାଂଶ/ଦ୍ରାଘିମା ନିର୍ଦ୍ଧାରିତ ସୀମା ବାହାରେ ଅଛି',
  },
  'Google Sign-In is for Citizens only': {
    hi: 'गूगल साइन-इन केवल नागरिकों के लिए है',
    or: 'ଗୁଗୁଲ୍ ସାଇନ୍-ଇନ୍ କେବଳ ସାଧାରଣ ନାଗରିକଙ୍କ ପାଇଁ ଉପଲବ୍ଧ',
  },
  'Account suspended': {
    hi: 'खाता निलंबित कर दिया गया है',
    or: 'ଖାତା ନିଲମ୍ବିତ କରାଯାଇଛି',
  },
  'Invalid or expired Google token': {
    hi: 'अमान्य या समाप्त गूगल टोकन',
    or: 'ଅବୈଧ କିମ୍ବା ଅବଧି ସରିଥିବା ଗୁଗୁଲ୍ ଟୋକନ୍',
  },
  'Invalid official email': {
    hi: 'अमान्य सरकारी ईमेल',
    or: 'ଅବୈଧ ସରକାରୀ ଇମେଲ୍',
  },
  'Official password must be at least 8 characters': {
    hi: 'आधिकारिक पासवर्ड कम से कम 8 वर्णों का होना चाहिए',
    or: 'ସରକାରୀ ପାସୱାର୍ଡ ଅତିକମରେ 8 ଟି ଅକ୍ଷର ହେବା ଆବଶ୍ୟକ',
  },
  'An account with this email already exists': {
    hi: 'इस ईमेल से पहले से एक खाता मौजूद है',
    or: 'ଏହି ଇମେଲ୍ ରେ ପୂର୍ବରୁ ଏକ ଆକାଉଣ୍ଟ୍ ରହିଛି',
  },
  'Government Official registration submitted. Account is pending Admin approval.': {
    hi: 'सरकारी अधिकारी पंजीकरण प्रस्तुत किया गया। खाता व्यवस्थापक स्वीकृति के लिए लंबित है।',
    or: 'ସରକାରୀ ଅଧିକାରୀ ପଞ୍ଜୀକରଣ ଦାଖଲ ହୋଇଛି। ଆଡମିନ୍ ଅନୁମୋଦନ ଅପେକ୍ଷାରେ ଅଛି।',
  },
  'System Administrator account provisioned successfully': {
    hi: 'सिस्टम प्रशासक खाता सफलतापूर्वक तैयार किया गया',
    or: 'ସିଷ୍ଟମ୍ ଆଡମିନିଷ୍ଟ୍ରେଟର୍ ଆକାଉଣ୍ଟ୍ ସଫଳତାର ସହ ପ୍ରସ୍ତୁତ ହୋଇଛି',
  },
  'Unauthorized: System Admin privileges required': {
    hi: 'अनधिकृत: सिस्टम एडमिन विशेषाधिकार आवश्यक हैं',
    or: 'ଅନଧିକୃତ: ସିଷ୍ଟମ୍ ଆଡମିନ୍ ଅନୁମତି ଆବଶ୍ୟକ',
  },
  'Target user is not a Government Official': {
    hi: 'लक्षित उपयोगकर्ता सरकारी अधिकारी नहीं है',
    or: 'ଲକ୍ଷ୍ୟଭୁକ୍ତ ଉପଭୋକ୍ତା ସରକାରୀ ଅଧିକାରୀ ନୁହଁନ୍ତି',
  },
  'Government Official approved successfully': {
    hi: 'सरकारी अधिकारी को सफलतापूर्वक स्वीकृति दी गई',
    or: 'ସରକାରୀ ଅଧିକାରୀଙ୍କୁ ସଫଳତାର ସହ ଅନୁମୋଦନ କରାଗଲା',
  },
  'Invalid email or password': {
    hi: 'अमान्य ईमेल या पासवर्ड',
    or: 'ଭୁଲ୍ ଇମେଲ୍ କିମ୍ବା ପାସୱାର୍ଡ',
  },
  'Account is suspended. Contact Administrator.': {
    hi: 'खाता निलंबित है। प्रशासक से संपर्क करें।',
    or: 'ଆକାଉଣ୍ଟ୍ ନିଲମ୍ବିତ ଅଛି। ଆଡମିନିଷ୍ଟ୍ରେଟରଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।',
  },
  'Account is pending Administrator approval.': {
    hi: 'खाता व्यवस्थापक की मंजूरी के लिए लंबित है।',
    or: 'ଆକାଉଣ୍ଟ୍ ଆଡମିନ୍ ଅନୁମୋଦନ ଅପେକ୍ଷାରେ ଅଛି।',
  },
  'Logged out successfully': {
    hi: 'सफलतापूर्वक लॉग आउट किया गया',
    or: 'ସଫଳତାର ସହ ଲଗ୍ ଆଉଟ୍ ହୋଇଛି',
  },
  'Authentication required. Missing session token.': {
    hi: 'प्रमाणीकरण आवश्यक है। सत्र टोकन अनुपलब्ध है।',
    or: 'ପ୍ରମାଣୀକରଣ ଆବଶ୍ୟକ। ସେସନ୍ ଟୋକନ୍ ମିଳୁନାହିଁ।',
  },
  'Camp name must be at least 3 characters': {
    hi: 'शिविर का नाम कम से कम 3 वर्णों का होना चाहिए',
    or: 'ଶିବିର ନାମ ଅତିକମରେ 3 ଟି ଅକ୍ଷର ହେବା ଉଚିତ',
  },
  'Capacity must be greater than zero': {
    hi: 'क्षमता शून्य से अधिक होनी चाहिए',
    or: 'କ୍ଷମତା ଶୂନରୁ ଅଧିକ ହେବା ଆବଶ୍ୟକ',
  },
  'Coordinates outside valid Bhubaneswar municipal boundary': {
    hi: 'निर्देशांक वैध भुवनेश्वर नगर निगम सीमा से बाहर हैं',
    or: 'ଅକ୍ଷାଂଶ/ଦ୍ରାଘିମା ଭୁବନେଶ୍ୱର ମ୍ୟୁନିସିପାଲ୍ ସୀମା ବାହାରେ ଅଛି',
  },
  'Government relief camp created and verified successfully': {
    hi: 'सरकारी राहत शिविर सफलतापूर्वक बनाया और सत्यापित किया गया',
    or: 'ସରକାରୀ ରିଲିଫ୍ ଶିବିର ସଫଳତାର ସହ ପ୍ରସ୍ତୁତ ଏବଂ ଯାଞ୍ଚ ହୋଇଛି',
  },
  'Occupied capacity cannot exceed total capacity': {
    hi: 'अधिकृत क्षमता कुल क्षमता से अधिक नहीं हो सकती',
    or: 'ଅଧିକୃତ ସଂଖ୍ୟା ମୋଟ କ୍ଷମତାଠାରୁ ଅଧିକ ହୋଇପାରିବ ନାହିଁ',
  },
  'Camp updated successfully': {
    hi: 'शिविर सफलतापूर्वक अपडेट किया गया',
    or: 'ଶିବିର ସଫଳତାର ସହ ଅପଡେଟ୍ ହୋଇଛି',
  },
  'No changes requested': {
    hi: 'कोई बदलाव का अनुरोध नहीं किया गया',
    or: 'କୌଣସି ପରିବର୍ତ୍ତନ ଅନୁରୋଧ କରାଯାଇ ନାହିଁ',
  },
  'Unauthorized': {
    hi: 'अनधिकृत',
    or: 'ଅନଧିକୃତ',
  },
  'Forbidden': {
    hi: 'प्रतिबंधित',
    or: 'ନିଷେଧ',
  },
  'Description is required': {
    hi: 'विवरण आवश्यक है',
    or: 'ବିବରଣୀ ପ୍ରଦାନ କରିବା ଆବଶ୍ୟକ',
  },
  'Failed to request password recovery. Please verify your email.': {
    hi: 'पासवर्ड पुनर्प्राप्ति अनुरोध विफल रहा। कृपया अपना ईमेल सत्यापित करें।',
    or: 'ପାସୱାର୍ଡ ପୁନରୁଦ୍ଧାର ଅନୁରୋଧ ବିଫଳ ହେଲା। ଦୟାକରି ଆପଣଙ୍କ ଇମେଲ୍ ଯାଞ୍ଚ କରନ୍ତୁ।',
  },
  'Invalid or expired recovery link. Please request a new password reset.': {
    hi: 'अमान्य या समाप्त हो चुका रिकवरी लिंक। कृपया एक नया पासवर्ड रीसेट का अनुरोध करें।',
    or: 'ଅବୈଧ କିମ୍ବା ସମୟ ସମାପ୍ତ ହୋଇଥିବା ଲିଙ୍କ୍। ଦୟାକରି ଏକ ନୂତନ ପାସୱାର୍ଡ ରିସେଟ୍ ଅନୁରୋଧ କରନ୍ତୁ।',
  },
  'Please enter a valid email address.': {
    hi: 'कृपया एक मान्य ईमेल पता दर्ज करें।',
    or: 'ଦୟାକରି ଏକ ବୈଧ ଇମେଲ୍ ଠିକଣା ପ୍ରବେଶ କରନ୍ତୁ।',
  },
  'Unable to process recovery request. Please verify your internet connection and email address.': {
    hi: 'पुनर्प्राप्ति अनुरोध संसाधित करने में असमर्थ। कृपया अपना इंटरनेट कनेक्शन और ईमेल पता सत्यापित करें।',
    or: 'ପୁନରୁଦ୍ଧାର ଅନୁରୋଧ ପ୍ରକ୍ରିୟାକରଣ କରିବାରେ ଅସମର୍ଥ। ଦୟାକରି ଆପଣଙ୍କ ଇଣ୍ଟରନେଟ୍ ସଂଯୋଗ ଏବଂ ଇମେଲ୍ ଯାଞ୍ଚ କରନ୍ତୁ।',
  },
  'Invalid or missing password recovery link parameters. Please request a new link.': {
    hi: 'पासवर्ड पुनर्प्राप्ति लिंक पैरामीटर अमान्य या अनुपलब्ध हैं। कृपया एक नया लिंक अनुरोध करें।',
    or: 'ପାସୱାର୍ଡ ପୁନରୁଦ୍ଧାର ଲିଙ୍କ୍ ମିଳୁନାହିଁ କିମ୍ବା ଅବୈଧ ଅଛି। ଦୟାକରି ଏକ ନୂତନ ଲିଙ୍କ୍ ଅନୁରୋଧ କରନ୍ତୁ।',
  },
  'Invalid or expired password recovery link. Please request a new link.': {
    hi: 'अमान्य या समाप्त पासवर्ड पुनर्प्राप्ति लिंक। कृपया एक नया लिंक अनुरोध करें।',
    or: 'ଅବୈଧ କିମ୍ବା ମିଆଦ ପୂରିଯାଇଥିବା ଲିଙ୍କ୍। ଦୟାକରି ଏକ ନୂତନ ଲିଙ୍କ୍ ଅନୁରୋଧ କରନ୍ତୁ।',
  },
  'Password must be at least 8 characters long.': {
    hi: 'पासवर्ड कम से कम 8 वर्णों का होना चाहिए।',
    or: 'ପାସୱାର୍ଡ ଅତିକମରେ 8 ଟି ଅକ୍ଷର ହେବା ଆବଶ୍ୟକ।',
  },
  'Passwords do not match. Please re-enter matching passwords.': {
    hi: 'पासवर्ड मेल नहीं खाते। कृपया समान पासवर्ड पुनः दर्ज करें।',
    or: 'ପାସୱାର୍ଡ ମେଳ ଖାଉନାହିଁ। ଦୟାକରି ସମାନ ପାସୱାର୍ଡ ପୁନର୍ବାର ପ୍ରବେଶ କରନ୍ତୁ।',
  },
  'Failed to reset password. The recovery link may have expired or already been used.': {
    hi: 'पासवर्ड रीसेट करने में विफल। रिकवरी लिंक समाप्त हो चुका हो सकता है या पहले ही उपयोग किया जा चुका है।',
    or: 'ପାସୱାର୍ଡ ରିସେଟ୍ ବିଫଳ ହେଲା। ପୁନରୁଦ୍ଧାର ଲିଙ୍କ୍ ଅବଧି ସରିଯାଇଛି କିମ୍ବା ପୂର୍ବରୁ ବ୍ୟବହୃତ ହୋଇଛି।',
  },
  'Disaster observation reported by citizen.': {
    hi: 'नागरिक द्वारा दर्ज आपदा अवलोकन।',
    or: 'ନାଗରିକଙ୍କ ଦ୍ୱାରା ଦାଖଲ କରାଯାଇଥିବା ବିପର୍ଯ୍ୟୟ ବିବରଣୀ।',
  },
  'Demo Citizen': {
    hi: 'डेमो नागरिक',
    or: 'ଡେମୋ ନାଗରିକ',
  },
  'Facility surrounded by 1.1m floodwaters from Gangua Nallah breach. Diverted to SUM Ultimate Camp Annex.': {
    hi: 'गंगुआ नाले के टूटने से 1.1 मीटर बाढ़ के पानी से परिसर घिरा हुआ है। सम अल्टीमेट कैंप एनेक्स में डायवर्ट किया गया।',
    or: 'ଗଙ୍ଗୁଆ ନାଳ ବନ୍ଧ ଭାଙ୍ଗିବା ଯୋଗୁଁ 1.1 ମିଟର ବନ୍ୟା ଜଳରେ ଘେରି ରହିଛି। ସମ୍ ଅଲ୍ଟିମେଟ୍ କ୍ୟାମ୍ପ ଆନେକ୍ସକୁ ସ୍ଥାନାନ୍ତରିତ କରାଯାଇଛି।',
  },
  'User is in a safe, low-risk area.': {
    hi: 'उपयोगकर्ता सुरक्षित, कम जोखिम वाले क्षेत्र में है।',
    or: 'ଉପଭୋକ୍ତା ନିରାପଦ ଓ କମ୍ ବିପଦପୂର୍ଣ୍ଣ ଅଞ୍ଚଳରେ ଅଛନ୍ତି।',
  },
  'No active hazard data recorded for this zone.': {
    hi: 'इस क्षेत्र के लिए कोई सक्रिय आपदा डेटा दर्ज नहीं है।',
    or: 'ଏହି ଅଞ୍ଚଳ ପାଇଁ କୌଣସି ସକ୍ରିୟ ବିପଦ ତଥ୍ୟ ନାହିଁ।',
  },
  'View More Details': {
    hi: 'अधिक विवरण देखें',
    or: 'ଅଧିକ ବିବରଣୀ ଦେଖନ୍ତୁ',
  },
};

export function getPhraseTranslation(
  phrase: string,
  lang: Language = 'en'
): string | undefined {
  if (lang === 'en') return phrase;
  const entry = PHRASES[phrase];
  if (!entry) return undefined;
  return entry[lang];
}
