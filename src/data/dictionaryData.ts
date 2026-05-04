
export interface DictionaryEntry {
  word: string;
  translation: string;
  phonetic: string;
  ipa?: string;
  language: 'Acholi' | 'English';
  examples: { acholi: string; english: string }[];
}

export const LOCAL_DICTIONARY: DictionaryEntry[] = [
  {
    word: 'Lyec',
    translation: 'Elephant',
    phonetic: 'Lyeh-ch',
    ipa: '/ljetʃ/',
    language: 'Acholi',
    examples: [
      { acholi: 'Lyec tye i lum.', english: 'The elephant is in the bush.' },
      { acholi: 'Lyec dongo matek.', english: 'The elephant is very big.' }
    ]
  },
  {
    word: 'Amot',
    translation: 'Greeting / I greet',
    phonetic: 'Ah-moht',
    ipa: '/aˈmot/',
    language: 'Acholi',
    examples: [
      { acholi: 'Amotwu ducu.', english: 'I greet you all.' }
    ]
  },
  {
    word: 'Kop ango',
    translation: 'How are you? / What is the news?',
    phonetic: 'Kohp ah-ngoh',
    ipa: '/kop aŋgo/',
    language: 'Acholi',
    examples: [
      { acholi: 'Kop ango, lamin-na?', english: 'How are you, my sister?' }
    ]
  },
  {
    word: 'Kop pe',
    translation: 'I am fine / No news',
    phonetic: 'Kohp peh',
    ipa: '/kop pe/',
    language: 'Acholi',
    examples: [
      { acholi: 'Kop pe, tye maber.', english: 'I am fine, everything is good.' }
    ]
  },
  {
    word: 'Wot maber',
    translation: 'Safe journey',
    phonetic: 'Woht mah-behr',
    ipa: '/wot maˈber/',
    language: 'Acholi',
    examples: [
      { acholi: 'Wot maber i yo.', english: 'Have a safe journey on the road.' }
    ]
  },
  {
    word: 'Camat',
    translation: 'Food',
    phonetic: 'Chah-maht',
    ipa: '/caˈmat/',
    language: 'Acholi',
    examples: [
      { acholi: 'Camat tye maber.', english: 'The food is good.' }
    ]
  },
  {
    word: 'Dek',
    translation: 'Sauce / Stew',
    phonetic: 'Dehk',
    ipa: '/dek/',
    language: 'Acholi',
    examples: [
      { acholi: 'Dek malakwang mit.', english: 'Malakwang stew is delicious.' }
    ]
  }
];
