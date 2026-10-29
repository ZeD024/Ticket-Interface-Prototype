/* Static data for the prototype: metro network, known places and UI text.
   Coordinates are approximate; fares and timings are realistic but made up. */

const LINES = {
  blue: {
    color: '#2563eb',
    name: { en: 'Blue line', gu: 'બ્લુ લાઇન', hi: 'ब्लू लाइन' },
    stations: [
      'thaltej-gam', 'thaltej', 'doordarshan', 'gurukul', 'gujarat-uni', 'commerce',
      'stadium', 'ohc', 'shahpur', 'gheekanta', 'kalupur', 'kankaria-east',
      'apparel-park', 'amraiwadi', 'rabari', 'vastral', 'nirant', 'vastral-gam'
    ]
  },
  red: {
    color: '#dc2626',
    name: { en: 'Red line', gu: 'રેડ લાઇન', hi: 'रेड लाइन' },
    stations: [
      'motera', 'sabarmati', 'aec', 'sabarmati-rly', 'ranip', 'vadaj', 'vijay-nagar',
      'usmanpura', 'ohc', 'gandhigram', 'paldi', 'shreyas', 'rajiv-nagar', 'jivraj', 'apmc'
    ]
  }
};

// icon = pictogram shown until real landmark photos are added (photo: 'img/stations/<id>.jpg')
const STATIONS = {
  'thaltej-gam':   { en: 'Thaltej Gam', gu: 'થલતેજ ગામ', hi: 'थलतेज गाम', lat: 23.0530, lng: 72.5035, icon: '🏘️' },
  'thaltej':       { en: 'Thaltej', gu: 'થલતેજ', hi: 'थलतेज', lat: 23.0490, lng: 72.5185, icon: '🛍️' },
  'doordarshan':   { en: 'Doordarshan Kendra', gu: 'દૂરદર્શન કેન્દ્ર', hi: 'दूरदर्शन केंद्र', lat: 23.0478, lng: 72.5290, icon: '📡' },
  'gurukul':       { en: 'Gurukul Road', gu: 'ગુરુકુળ રોડ', hi: 'गुरुकुल रोड', lat: 23.0470, lng: 72.5385, icon: '📚' },
  'gujarat-uni':   { en: 'Gujarat University', gu: 'ગુજરાત યુનિવર્સિટી', hi: 'गुजरात यूनिवर्सिटी', lat: 23.0452, lng: 72.5470, icon: '🎓' },
  'commerce':      { en: 'Commerce Six Roads', gu: 'કોમર્સ છ રસ્તા', hi: 'कॉमर्स छह रास्ता', lat: 23.0410, lng: 72.5555, icon: '🏫' },
  'stadium':       { en: 'Stadium', gu: 'સ્ટેડિયમ', hi: 'स्टेडियम', lat: 23.0385, lng: 72.5635, icon: '🏟️' },
  'ohc':           { en: 'Old High Court', gu: 'જૂની હાઈકોર્ટ', hi: 'पुराना हाई कोर्ट', lat: 23.0385, lng: 72.5725, icon: '⚖️', interchange: true },
  'shahpur':       { en: 'Shahpur', gu: 'શાહપુર', hi: 'शाहपुर', lat: 23.0352, lng: 72.5835, icon: '🌉' },
  'gheekanta':     { en: 'Gheekanta', gu: 'ઘીકાંટા', hi: 'घीकांटा', lat: 23.0305, lng: 72.5905, icon: '🏪' },
  'kalupur':       { en: 'Kalupur Railway Station', gu: 'કાલુપુર રેલવે સ્ટેશન', hi: 'कालूपुर रेलवे स्टेशन', lat: 23.0265, lng: 72.6005, icon: '🚆',
                     alias: ['Ahmedabad railway station', 'Ahmedabad junction', 'Kalupur', 'અમદાવાદ રેલવે સ્ટેશન', 'કાલુપુર', 'अहमदाबाद रेलवे स्टेशन', 'कालूपुर'] },
  'kankaria-east': { en: 'Kankaria East', gu: 'કાંકરિયા પૂર્વ', hi: 'कांकरिया पूर्व', lat: 23.0160, lng: 72.6105, icon: '🎡' },
  'apparel-park':  { en: 'Apparel Park', gu: 'એપેરલ પાર્ક', hi: 'अपैरल पार्क', lat: 23.0150, lng: 72.6220, icon: '👕' },
  'amraiwadi':     { en: 'Amraiwadi', gu: 'અમરાઈવાડી', hi: 'अमराईवाडी', lat: 23.0135, lng: 72.6330, icon: '🏠' },
  'rabari':        { en: 'Rabari Colony', gu: 'રબારી કોલોની', hi: 'रबारी कॉलोनी', lat: 23.0100, lng: 72.6440, icon: '🐄' },
  'vastral':       { en: 'Vastral', gu: 'વસ્ત્રાલ', hi: 'वस्त्राल', lat: 23.0065, lng: 72.6545, icon: '🏢' },
  'nirant':        { en: 'Nirant Cross Road', gu: 'નિરાંત ચાર રસ્તા', hi: 'निरांत चार रास्ता', lat: 23.0035, lng: 72.6645, icon: '🚦' },
  'vastral-gam':   { en: 'Vastral Gam', gu: 'વસ્ત્રાલ ગામ', hi: 'वस्त्राल गाम', lat: 23.0010, lng: 72.6735, icon: '🏘️' },

  'motera':        { en: 'Motera Stadium', gu: 'મોટેરા સ્ટેડિયમ', hi: 'मोटेरा स्टेडियम', lat: 23.0915, lng: 72.5945, icon: '🏏' },
  'sabarmati':     { en: 'Sabarmati', gu: 'સાબરમતી', hi: 'साबरमती', lat: 23.0840, lng: 72.5900, icon: '🏞️' },
  'aec':           { en: 'AEC', gu: 'એઈસી', hi: 'एईसी', lat: 23.0770, lng: 72.5860, icon: '⚡' },
  'sabarmati-rly': { en: 'Sabarmati Railway Station', gu: 'સાબરમતી રેલવે સ્ટેશન', hi: 'साबरमती रेलवे स्टेशन', lat: 23.0710, lng: 72.5825, icon: '🚆' },
  'ranip':         { en: 'Ranip', gu: 'રાણીપ', hi: 'राणीप', lat: 23.0650, lng: 72.5785, icon: '🚌' },
  'vadaj':         { en: 'Vadaj', gu: 'વાડજ', hi: 'वाडज', lat: 23.0595, lng: 72.5755, icon: '🛺' },
  'vijay-nagar':   { en: 'Vijay Nagar', gu: 'વિજય નગર', hi: 'विजय नगर', lat: 23.0540, lng: 72.5730, icon: '🏡' },
  'usmanpura':     { en: 'Usmanpura', gu: 'ઉસ્માનપુરા', hi: 'उस्मानपुरा', lat: 23.0470, lng: 72.5710, icon: '🌳' },
  'gandhigram':    { en: 'Gandhigram', gu: 'ગાંધીગ્રામ', hi: 'गांधीग्राम', lat: 23.0290, lng: 72.5705, icon: '🚉' },
  'paldi':         { en: 'Paldi', gu: 'પાલડી', hi: 'पालड़ी', lat: 23.0185, lng: 72.5655, icon: '🏛️' },
  'shreyas':       { en: 'Shreyas', gu: 'શ્રેયસ', hi: 'श्रेयस', lat: 23.0085, lng: 72.5600, icon: '🛤️' },
  'rajiv-nagar':   { en: 'Rajiv Nagar', gu: 'રાજીવ નગર', hi: 'राजीव नगर', lat: 22.9995, lng: 72.5565, icon: '🏘️' },
  'jivraj':        { en: 'Jivraj Park', gu: 'જીવરાજ પાર્ક', hi: 'जीवराज पार्क', lat: 22.9910, lng: 72.5535, icon: '🌳' },
  'apmc':          { en: 'APMC', gu: 'એપીએમસી', hi: 'एपीएमसी', lat: 22.9825, lng: 72.5505, icon: '🥬' }
};

// The station this kiosk stands in.
const KIOSK_STATION = 'kalupur';

// Colour-coded platforms. Footstep stickers of the same colour on the station floor
// lead passengers to each platform. At the interchange the Red line uses 3 and 4.
const PLATFORMS = {
  1: { color: '#111827', ink: '#ffffff' },  // black
  2: { color: '#ffffff', ink: '#111827' },  // white
  3: { color: '#facc15', ink: '#111827' },  // yellow
  4: { color: '#f97316', ink: '#ffffff' }   // orange
};

// Well-known places that are not stations. Stations are searchable too.
const PLACES = [
  { en: 'Sabarmati Ashram', gu: 'સાબરમતી આશ્રમ', hi: 'साबरमती आश्रम', lat: 23.0607, lng: 72.5807, icon: '🕊️', alias: ['Gandhi Ashram', 'ગાંધી આશ્રમ', 'गांधी आश्रम'] },
  { en: 'Kankaria Lake', gu: 'કાંકરિયા તળાવ', hi: 'कांकरिया झील', lat: 23.0063, lng: 72.6012, icon: '🎡', alias: ['Kankaria', 'કાંકરિયા', 'कांकरिया', 'कांकरिया तालाब', 'कांकरिया लेक'] },
  { en: 'Sidi Saiyyed Mosque', gu: 'સીદી સૈયદની જાળી', hi: 'सीदी सैयद मस्जिद', lat: 23.0270, lng: 72.5810, icon: '🕌', alias: ['Sidi Saiyed', 'Sidi Saiyyed ni Jali', 'સીદી સૈયદ', 'सीदी सैयद की जाली'] },
  { en: 'Bhadra Fort', gu: 'ભદ્રનો કિલ્લો', hi: 'भद्र किला', lat: 23.0240, lng: 72.5805, icon: '🏰', alias: ['Bhadra', 'Bhadrakali temple', 'ભદ્ર', 'ભદ્રકાળી', 'भद्र', 'भद्रकाली'] },
  { en: 'Jama Masjid', gu: 'જામા મસ્જિદ', hi: 'जामा मस्जिद', lat: 23.0237, lng: 72.5878, icon: '🕌' },
  { en: 'Manek Chowk', gu: 'માણેક ચોક', hi: 'माणेक चौक', lat: 23.0240, lng: 72.5900, icon: '🍢' },
  { en: 'Law Garden', gu: 'લૉ ગાર્ડન', hi: 'लॉ गार्डन', lat: 23.0262, lng: 72.5584, icon: '🌳', alias: ['લો ગાર્ડન'] },
  { en: 'IIM Ahmedabad', gu: 'આઈઆઈએમ અમદાવાદ', hi: 'आईआईएम अहमदाबाद', lat: 23.0322, lng: 72.5351, icon: '🎓', alias: ['IIM', 'IIMA', 'આઈઆઈએમ', 'आईआईएम'] },
  { en: 'Vastrapur Lake', gu: 'વસ્ત્રાપુર તળાવ', hi: 'वस्त्रापुर झील', lat: 23.0386, lng: 72.5276, icon: '🦆', alias: ['Vastrapur', 'વસ્ત્રાપુર', 'वस्त्रापुर'] },
  { en: 'Science City', gu: 'સાયન્સ સિટી', hi: 'साइंस सिटी', lat: 23.0790, lng: 72.4950, icon: '🔭' },
  { en: 'Sabarmati Riverfront', gu: 'સાબરમતી રિવરફ્રન્ટ', hi: 'साबरमती रिवरफ्रंट', lat: 23.0300, lng: 72.5770, icon: '🏞️', alias: ['Riverfront', 'રિવરફ્રન્ટ', 'रिवरफ्रंट'] },
  { en: 'Atal Bridge', gu: 'અટલ બ્રિજ', hi: 'अटल ब्रिज', lat: 23.0235, lng: 72.5760, icon: '🌉' },
  { en: 'ISKCON Temple', gu: 'ઇસ્કોન મંદિર', hi: 'इस्कॉन मंदिर', lat: 23.0265, lng: 72.5075, icon: '🛕', alias: ['ISKCON', 'ઇસ્કોન', 'इस्कॉन'] },
  { en: 'Palladium Mall', gu: 'પેલેડિયમ મોલ', hi: 'पैलेडियम मॉल', lat: 23.0498, lng: 72.5163, icon: '🛍️', alias: ['Palladium', 'પેલેડિયમ', 'पैलेडियम'] },
  { en: 'Ahmedabad One Mall', gu: 'અમદાવાદ વન મોલ', hi: 'अहमदाबाद वन मॉल', lat: 23.0400, lng: 72.5310, icon: '🛍️', alias: ['Alpha One', 'Alpha One Mall', 'આલ્ફા વન', 'अल्फा वन'] },
  { en: 'Himalaya Mall', gu: 'હિમાલયા મોલ', hi: 'हिमालया मॉल', lat: 23.0478, lng: 72.5355, icon: '🛍️' },
  { en: 'Civil Hospital', gu: 'સિવિલ હોસ્પિટલ', hi: 'सिविल अस्पताल', lat: 23.0540, lng: 72.6030, icon: '🏥', alias: ['Civil', 'સિવિલ', 'सिविल', 'सिविल हॉस्पिटल', 'Asarwa'] },
  { en: 'Zydus Hospital', gu: 'ઝાયડસ હોસ્પિટલ', hi: 'ज़ायडस अस्पताल', lat: 23.0560, lng: 72.5160, icon: '🏥', alias: ['Zydus', 'ઝાયડસ', 'ज़ायडस', 'जायडस'] },
  { en: 'Sola Civil Hospital', gu: 'સોલા સિવિલ હોસ્પિટલ', hi: 'सोला सिविल अस्पताल', lat: 23.0700, lng: 72.5150, icon: '🏥', alias: ['Sola Civil', 'સોલા', 'सोला'] },
  { en: 'Airport', gu: 'એરપોર્ટ', hi: 'हवाई अड्डा', lat: 23.0734, lng: 72.6266, icon: '✈️', alias: ['Ahmedabad airport', 'Sardar Vallabhbhai Patel Airport', 'एयरपोर्ट', 'વિમાનમથક'] },
  { en: 'Hutheesing Jain Temple', gu: 'હઠીસિંહના દેરાં', hi: 'हठीसिंह जैन मंदिर', lat: 23.0410, lng: 72.5905, icon: '🛕', alias: ['Hutheesing', 'હઠીસિંહ', 'हठीसिंह'] },
  { en: 'Shahibaug', gu: 'શાહીબાગ', hi: 'शाहीबाग', lat: 23.0500, lng: 72.5950, icon: '🏛️' },
  { en: 'Sardar Patel Memorial', gu: 'સરદાર પટેલ સ્મારક', hi: 'सरदार पटेल स्मारक', lat: 23.0460, lng: 72.5960, icon: '🏛️', alias: ['Sardar Patel National Memorial', 'Moti Shahi Mahal'] },
  { en: 'Dada Hari Stepwell', gu: 'દાદા હરિની વાવ', hi: 'दादा हरि की बावड़ी', lat: 23.0440, lng: 72.6050, icon: '🏛️', alias: ['Dada Hari ni Vav', 'Dada Hari', 'દાદા હરિ', 'दादा हरि'] },
  { en: 'Gujarat High Court', gu: 'ગુજરાત હાઈકોર્ટ', hi: 'गुजरात हाई कोर्ट', lat: 23.0790, lng: 72.5250, icon: '⚖️', alias: ['High Court', 'New High Court', 'હાઈકોર્ટ', 'हाई कोर्ट'] },
  { en: 'Nehru Bridge', gu: 'નહેરુ બ્રિજ', hi: 'नेहरू ब्रिज', lat: 23.0310, lng: 72.5800, icon: '🌉' },
  { en: 'Ellis Bridge', gu: 'એલિસ બ્રિજ', hi: 'एलिस ब्रिज', lat: 23.0240, lng: 72.5770, icon: '🌉' },
  { en: 'Income Tax Circle', gu: 'ઇન્કમ ટેક્સ સર્કલ', hi: 'इनकम टैक्स सर्कल', lat: 23.0425, lng: 72.5690, icon: '🏢', alias: ['Income Tax', 'ઇન્કમ ટેક્સ', 'इनकम टैक्स'] },
  { en: 'Navrangpura', gu: 'નવરંગપુરા', hi: 'नवरंगपुरा', lat: 23.0370, lng: 72.5600, icon: '🏙️' },
  { en: 'CG Road', gu: 'સી.જી. રોડ', hi: 'सी.जी. रोड', lat: 23.0300, lng: 72.5590, icon: '🛍️', alias: ['C G Road', 'સીજી રોડ', 'सीजी रोड'] },
  { en: 'Ashram Road', gu: 'આશ્રમ રોડ', hi: 'आश्रम रोड', lat: 23.0390, lng: 72.5720, icon: '🛣️' },
  { en: 'SG Highway', gu: 'એસ.જી. હાઇવે', hi: 'एस.जी. हाईवे', lat: 23.0400, lng: 72.5070, icon: '🛣️', alias: ['S G Highway', 'Sarkhej Gandhinagar Highway', 'એસજી હાઇવે', 'एसजी हाईवे'] },
  { en: 'Maninagar', gu: 'મણિનગર', hi: 'मणिनगर', lat: 22.9965, lng: 72.6035, icon: '🚉', alias: ['Maninagar railway station'] },
  { en: 'Geeta Mandir Bus Station', gu: 'ગીતા મંદિર બસ સ્ટેશન', hi: 'गीता मंदिर बस स्टेशन', lat: 23.0130, lng: 72.5935, icon: '🚌', alias: ['Geeta Mandir', 'ST stand', 'ગીતા મંદિર', 'એસટી સ્ટેન્ડ', 'गीता मंदिर'] },
  { en: 'Lal Darwaja', gu: 'લાલ દરવાજા', hi: 'लाल दरवाजा', lat: 23.0250, lng: 72.5800, icon: '🚌', alias: ['Lal Darwaza'] },
  { en: 'Teen Darwaja', gu: 'ત્રણ દરવાજા', hi: 'तीन दरवाजा', lat: 23.0235, lng: 72.5850, icon: '🏰', alias: ['Teen Darwaza', 'Three gates'] },
  { en: 'Relief Road', gu: 'રિલીફ રોડ', hi: 'रिलीफ रोड', lat: 23.0280, lng: 72.5870, icon: '🏪' },
  { en: 'Riverfront Flower Park', gu: 'ફ્લાવર પાર્ક', hi: 'फ्लावर पार्क', lat: 23.0180, lng: 72.5710, icon: '🌸', alias: ['Flower Park', 'Flower show'] },
  { en: 'Sanskar Kendra', gu: 'સંસ્કાર કેન્દ્ર', hi: 'संस्कार केंद्र', lat: 23.0170, lng: 72.5725, icon: '🏛️' },
  { en: 'National Institute of Design', gu: 'એનઆઈડી', hi: 'एनआईडी', lat: 23.0170, lng: 72.5690, icon: '🎨', alias: ['NID'] },
  { en: 'Gujarat Vidyapith', gu: 'ગુજરાત વિદ્યાપીઠ', hi: 'गुजरात विद्यापीठ', lat: 23.0475, lng: 72.5680, icon: '📚' },
  { en: 'Ahmedabad University', gu: 'અમદાવાદ યુનિવર્સિટી', hi: 'अहमदाबाद यूनिवर्सिटी', lat: 23.0380, lng: 72.5525, icon: '🎓' },
  { en: 'CEPT University', gu: 'સેપ્ટ યુનિવર્સિટી', hi: 'सेप्ट यूनिवर्सिटी', lat: 23.0395, lng: 72.5490, icon: '🎓', alias: ['CEPT', 'સેપ્ટ', 'सेप्ट'] },
  { en: 'Narendra Modi Stadium', gu: 'નરેન્દ્ર મોદી સ્ટેડિયમ', hi: 'नरेंद्र मोदी स्टेडियम', lat: 23.0918, lng: 72.5975, icon: '🏏', alias: ['Cricket stadium', 'Motera'] },
  { en: 'Bodakdev', gu: 'બોડકદેવ', hi: 'बोडकदेव', lat: 23.0420, lng: 72.5100, icon: '🏙️' },
  { en: 'Satellite', gu: 'સેટેલાઇટ', hi: 'सैटेलाइट', lat: 23.0280, lng: 72.5150, icon: '🏙️' },
  { en: 'Prahlad Nagar', gu: 'પ્રહલાદનગર', hi: 'प्रह्लादनगर', lat: 23.0120, lng: 72.5080, icon: '🏙️' },
  { en: 'Memnagar', gu: 'મેમનગર', hi: 'मेमनगर', lat: 23.0500, lng: 72.5330, icon: '🏘️' },
  { en: 'Ghatlodia', gu: 'ઘાટલોડિયા', hi: 'घाटलोडिया', lat: 23.0700, lng: 72.5400, icon: '🏘️' },
  { en: 'Chandkheda', gu: 'ચાંદખેડા', hi: 'चांदखेड़ा', lat: 23.1110, lng: 72.5850, icon: '🏘️' },
  { en: 'Nikol', gu: 'નિકોલ', hi: 'निकोल', lat: 23.0470, lng: 72.6680, icon: '🏘️' },
  { en: 'Bapunagar', gu: 'બાપુનગર', hi: 'बापूनगर', lat: 23.0350, lng: 72.6330, icon: '🏘️' },
  { en: 'Naroda', gu: 'નરોડા', hi: 'नरोडा', lat: 23.0700, lng: 72.6600, icon: '🏭' },
  { en: 'Odhav', gu: 'ઓઢવ', hi: 'ओढव', lat: 23.0240, lng: 72.6630, icon: '🏭' },
  { en: 'Vasna', gu: 'વાસણા', hi: 'वासणा', lat: 22.9980, lng: 72.5480, icon: '🏘️' },
  { en: 'Sarkhej Roza', gu: 'સરખેજ રોજા', hi: 'सरखेज रोजा', lat: 22.9940, lng: 72.5010, icon: '🕌', alias: ['Sarkhej'] },
  { en: 'Adalaj Stepwell', gu: 'અડાલજની વાવ', hi: 'अडालज की बावड़ी', lat: 23.1668, lng: 72.5806, icon: '🏛️', alias: ['Adalaj', 'અડાલજ', 'अडालज'] }
];

// UI text. Numbers stay in Latin digits, as on Ahmedabad Metro fare displays.
const T = {
  appName:     { en: 'Ahmedabad Metro', gu: 'અમદાવાદ મેટ્રો', hi: 'अहमदाबाद मेट्रो' },
  greet:       { en: 'Namaste!', gu: 'નમસ્તે!', hi: 'नमस्ते!' },
  greetSub:    { en: 'Welcome to Ahmedabad Metro', gu: 'અમદાવાદ મેટ્રોમાં આપનું સ્વાગત છે', hi: 'अहमदाबाद मेट्रो में आपका स्वागत है' },
  whereTo:     { en: 'Where do you want to go?', gu: 'તમારે ક્યાં જવું છે?', hi: 'आपको कहाँ जाना है?' },
  speakHint:   { en: 'Say the name of any place', gu: 'કોઈપણ જગ્યાનું નામ બોલો', hi: 'किसी भी जगह का नाम बोलिए' },
  orTap:       { en: 'or touch a station on the map', gu: 'અથવા નકશા પર સ્ટેશનને સ્પર્શ કરો', hi: 'या नक्शे पर स्टेशन को छुएँ' },
  listening:   { en: 'Listening…', gu: 'સાંભળી રહ્યા છીએ…', hi: 'सुन रहे हैं…' },
  speaking:    { en: 'Listen…', gu: 'સાંભળો…', hi: 'सुनिए…' },
  tapToSpeak:  { en: 'Tap to speak', gu: 'બોલવા માટે દબાવો', hi: 'बोलने के लिए दबाएँ' },
  searching:   { en: 'Finding the place…', gu: 'જગ્યા શોધી રહ્યા છીએ…', hi: 'जगह खोज रहे हैं…' },
  notFound:    { en: 'Sorry, we could not find that place. Please try again.', gu: 'માફ કરશો, આ જગ્યા મળી નહીં. ફરી પ્રયાસ કરો.', hi: 'माफ़ कीजिए, यह जगह नहीं मिली। फिर से कोशिश करें।' },
  noMic:       { en: 'Voice is not available on this device.', gu: 'આ મશીન પર અવાજ ઉપલબ્ધ નથી.', hi: 'इस मशीन पर आवाज़ उपलब्ध नहीं है।' },
  micBlocked:  { en: 'The microphone is blocked.', gu: 'માઇક્રોફોન બંધ છે.', hi: 'माइक्रोफ़ोन बंद है।' },
  micSilent:   { en: 'No sound from the microphone', gu: 'માઇક્રોફોનમાંથી અવાજ આવતો નથી', hi: 'माइक्रोफ़ोन से आवाज़ नहीं आ रही' },
  noMicDevice: { en: 'No microphone found.', gu: 'માઇક્રોફોન મળ્યો નથી.', hi: 'माइक्रोफ़ोन नहीं मिला।' },
  voiceNet:    { en: 'Voice needs internet. Please check the connection.', gu: 'અવાજ માટે ઇન્ટરનેટ જરૂરી છે.', hi: 'आवाज़ के लिए इंटरनेट ज़रूरी है।' },
  pickStation: { en: 'Choose a station', gu: 'સ્ટેશન પસંદ કરો', hi: 'स्टेशन चुनें' },
  nearPlace:   { en: 'Stations near', gu: 'નજીકનાં સ્ટેશન', hi: 'नज़दीकी स्टेशन' },
  youAreHere:  { en: 'You are here', gu: 'તમે અહીં છો', hi: 'आप यहाँ हैं' },
  alreadyHere: { en: 'You are already at this station', gu: 'તમે આ જ સ્ટેશન પર છો', hi: 'आप इसी स्टेशन पर हैं' },
  change:      { en: 'Change train', gu: 'ટ્રેન બદલો', hi: 'ट्रेन बदलें' },
  getOff:      { en: 'Get off', gu: 'ઊતરો', hi: 'उतरें' },
  stops:       { en: 'stops', gu: 'સ્ટેશન', hi: 'स्टेशन' },
  stop:        { en: 'stop', gu: 'સ્ટેશન', hi: 'स्टेशन' },
  min:         { en: 'min', gu: 'મિનિટ', hi: 'मिनट' },
  km:          { en: 'km', gu: 'કિમી', hi: 'किमी' },
  m:           { en: 'm', gu: 'મી', hi: 'मी' },
  walk:        { en: 'Walk', gu: 'ચાલીને', hi: 'पैदल' },
  cab:         { en: 'Auto / cab', gu: 'ઓટો / કેબ', hi: 'ऑटो / कैब' },
  gate:        { en: 'Gate', gu: 'ગેટ', hi: 'गेट' },
  nextTrain:   { en: 'Next train', gu: 'આગામી ટ્રેન', hi: 'अगली ट्रेन' },
  totalTime:   { en: 'Total time', gu: 'કુલ સમય', hi: 'कुल समय' },
  perPerson:   { en: 'per person', gu: 'એક વ્યક્તિ', hi: 'प्रति व्यक्ति' },
  howMany:     { en: 'How many tickets?', gu: 'કેટલી ટિકિટ?', hi: 'कितने टिकट?' },
  total:       { en: 'Total', gu: 'કુલ', hi: 'कुल' },
  pay:         { en: 'Pay', gu: 'ચૂકવો', hi: 'भुगतान करें' },
  back:        { en: 'Back', gu: 'પાછળ', hi: 'पीछे' },
  platform:    { en: 'Platform', gu: 'પ્લેટફોર્મ', hi: 'प्लेटफ़ॉर्म' },
  scanQR:      { en: 'Scan with any UPI app', gu: 'કોઈપણ UPI એપથી સ્કેન કરો', hi: 'किसी भी UPI ऐप से स्कैन करें' },
  insertCash:  { en: 'Put cash in the slot', gu: 'રોકડા પૈસા ખાનામાં નાખો', hi: 'नकद पैसे खाँचे में डालें' },
  or:          { en: 'or', gu: 'અથવા', hi: 'या' },
  waiting:     { en: 'Waiting for payment…', gu: 'ચુકવણીની રાહ જોઈએ છીએ…', hi: 'भुगतान का इंतज़ार…' },
  received:    { en: 'Received', gu: 'મળ્યા', hi: 'मिले' },
  paid:        { en: 'Payment done!', gu: 'ચુકવણી થઈ ગઈ!', hi: 'भुगतान हो गया!' },
  paidUpi:     { en: 'Paid by UPI', gu: 'UPI થી ચૂકવ્યા', hi: 'UPI से भुगतान' },
  paidCash:    { en: 'Paid in cash', gu: 'રોકડા ચૂકવ્યા', hi: 'नकद भुगतान' },
  printing:    { en: 'Your ticket is being printed…', gu: 'તમારી ટિકિટ છપાઈ રહી છે…', hi: 'आपका टिकट छप रहा है…' },
  done:        { en: 'Done', gu: 'પૂરું', hi: 'हो गया' },
  home:        { en: 'Start again', gu: 'ફરી શરૂ કરો', hi: 'फिर से शुरू करें' }
};

const LANGS = [
  { code: 'gu', symbol: 'અ', label: 'ગુજરાતી', speech: 'gu-IN' },
  { code: 'hi', symbol: 'अ', label: 'हिंदी', speech: 'hi-IN' },
  { code: 'en', symbol: 'Aa', label: 'English', speech: 'en-IN' }
];
