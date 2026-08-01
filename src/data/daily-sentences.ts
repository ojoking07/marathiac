export interface DailySentence {
  english: string;
  marathi: string;
  pronunciation: string;
}

export interface DailySentenceGroup {
  id: string;
  title: string;
  emoji: string;
  blurb: string;
  sentences: DailySentence[];
}

export const DAILY_SENTENCE_GROUPS: DailySentenceGroup[] = [
  {
    id: "greetings",
    title: "Greetings and polite words",
    emoji: "👋",
    blurb: "The first sentences every Alphabet Commander learns — say them out loud each morning.",
    sentences: [
      { english: "Good morning!", marathi: "सुप्रभात!", pronunciation: "/गुड मॉर्निंग/" },
      { english: "Good afternoon, teacher.", marathi: "नमस्कार, शिक्षक.", pronunciation: "/गुड आफ्टरनून, टीचर/" },
      { english: "How are you?", marathi: "तू कसा आहेस?", pronunciation: "/हाऊ आर यू/" },
      { english: "I am fine, thank you.", marathi: "मी ठीक आहे, धन्यवाद.", pronunciation: "/आय ॲम फाइन, थँक यू/" },
      { english: "What is your name?", marathi: "तुझे नाव काय आहे?", pronunciation: "/व्हॉट इज युअर नेम/" },
      { english: "My name is Riya.", marathi: "माझे नाव रिया आहे.", pronunciation: "/माय नेम इज रिया/" },
      { english: "Please help me.", marathi: "कृपया मला मदत कर.", pronunciation: "/प्लीज हेल्प मी/" },
      { english: "I am sorry.", marathi: "मला माफ कर.", pronunciation: "/आय ॲम सॉरी/" },
      { english: "See you tomorrow.", marathi: "उद्या भेटू.", pronunciation: "/सी यू टुमॉरो/" },
    ],
  },
  {
    id: "classroom",
    title: "Classroom sentences",
    emoji: "🏫",
    blurb: "Use these with your teacher and your friends during the Alphabet Commanders class.",
    sentences: [
      { english: "May I come in?", marathi: "मी आत येऊ का?", pronunciation: "/मे आय कम इन/" },
      { english: "I did my homework.", marathi: "मी माझा गृहपाठ केला.", pronunciation: "/आय डिड माय होमवर्क/" },
      { english: "I do not understand this word.", marathi: "मला हा शब्द समजला नाही.", pronunciation: "/आय डू नॉट अंडरस्टँड धिस वर्ड/" },
      { english: "Please say it again.", marathi: "कृपया पुन्हा सांगा.", pronunciation: "/प्लीज से इट अगेन/" },
      { english: "What does this word mean?", marathi: "या शब्दाचा अर्थ काय आहे?", pronunciation: "/व्हॉट डज धिस वर्ड मीन/" },
      { english: "I know the answer.", marathi: "मला उत्तर माहीत आहे.", pronunciation: "/आय नो द आन्सर/" },
      { english: "May I drink water?", marathi: "मी पाणी पिऊ का?", pronunciation: "/मे आय ड्रिंक वॉटर/" },
      { english: "I am writing a sentence.", marathi: "मी एक वाक्य लिहीत आहे.", pronunciation: "/आय ॲम रायटिंग अ सेंटन्स/" },
      { english: "The class starts at ten.", marathi: "वर्ग दहा वाजता सुरू होतो.", pronunciation: "/द क्लास स्टार्ट्स ॲट टेन/" },
    ],
  },
  {
    id: "home",
    title: "At home and household chores",
    emoji: "🏠",
    blurb: "Everyday sentences you can practise with your family after school.",
    sentences: [
      { english: "I am hungry.", marathi: "मला भूक लागली आहे.", pronunciation: "/आय ॲम हंग्री/" },
      { english: "The food is very tasty.", marathi: "जेवण खूप चविष्ट आहे.", pronunciation: "/द फूड इज व्हेरी टेस्टी/" },
      { english: "I am washing the dishes.", marathi: "मी भांडी धुत आहे.", pronunciation: "/आय ॲम वॉशिंग द डिशेस/" },
      { english: "Please close the door.", marathi: "कृपया दार बंद कर.", pronunciation: "/प्लीज क्लोज द डोअर/" },
      { english: "I fill water from the well.", marathi: "मी विहिरीतून पाणी भरतो.", pronunciation: "/आय फिल वॉटर फ्रॉम द वेल/" },
      { english: "My mother is cooking rice.", marathi: "माझी आई भात शिजवत आहे.", pronunciation: "/माय मदर इज कुकिंग राइस/" },
      { english: "I sweep the floor every day.", marathi: "मी रोज जमीन झाडतो.", pronunciation: "/आय स्वीप द फ्लोअर एव्हरी डे/" },
      { english: "I go to sleep at nine.", marathi: "मी नऊ वाजता झोपतो.", pronunciation: "/आय गो टू स्लीप ॲट नाइन/" },
    ],
  },
  {
    id: "village",
    title: "Water, village and nature",
    emoji: "🌊",
    blurb: "Sentences about clean water and daily village life — the heart of US Kids 4 Water.",
    sentences: [
      { english: "Clean water keeps us healthy.", marathi: "स्वच्छ पाणी आपल्याला निरोगी ठेवते.", pronunciation: "/क्लीन वॉटर कीप्स अस हेल्दी/" },
      { english: "We must not waste water.", marathi: "आपण पाणी वाया घालवू नये.", pronunciation: "/वी मस्ट नॉट वेस्ट वॉटर/" },
      { english: "It is raining today.", marathi: "आज पाऊस पडत आहे.", pronunciation: "/इट इज रेनिंग टुडे/" },
      { english: "The river is near my village.", marathi: "नदी माझ्या गावाजवळ आहे.", pronunciation: "/द रिव्हर इज निअर माय व्हिलेज/" },
      { english: "I walk to school every morning.", marathi: "मी रोज सकाळी शाळेत चालत जातो.", pronunciation: "/आय वॉक टू स्कूल एव्हरी मॉर्निंग/" },
      { english: "The farmers grow rice here.", marathi: "इथे शेतकरी भात पिकवतात.", pronunciation: "/द फार्मर्स ग्रो राइस हिअर/" },
    ],
  },
];

export const DAILY_SENTENCE_COUNT = DAILY_SENTENCE_GROUPS.reduce(
  (n, g) => n + g.sentences.length,
  0,
);
