
export interface DictionaryEntry {
  word: string;
  translation: string;
  pronunciation: string;
  language: 'Acholi' | 'English';
  examples: { acholi: string; english: string }[];
}

export const LOCAL_DICTIONARY: DictionaryEntry[] = [
  {
    word: 'Lyec',
    translation: 'Elephant',
    pronunciation: 'Lyeh-ch',
    language: 'Acholi',
    examples: [
      { acholi: 'Lyec tye i lum.', english: 'The elephant is in the bush.' },
      { acholi: 'Lyec dongo matek.', english: 'The elephant is very big.' }
    ]
  },
  {
    word: 'Amot',
    translation: 'Greeting / I greet',
    pronunciation: 'Ah-moht',
    language: 'Acholi',
    examples: [
      { acholi: 'Amotwu ducu.', english: 'I greet you all.' }
    ]
  },
  {
    word: 'Kop ango',
    translation: 'How are you? / What is the news?',
    pronunciation: 'Kohp ah-ngoh',
    language: 'Acholi',
    examples: [
      { acholi: 'Kop ango, lamin-na?', english: 'How are you, my sister?' }
    ]
  },
  {
    word: 'Kop pe',
    translation: 'I am fine / No news',
    pronunciation: 'Kohp peh',
    language: 'Acholi',
    examples: [
      { acholi: 'Kop pe, tye maber.', english: 'I am fine, everything is good.' }
    ]
  },
  {
    word: 'Wot maber',
    translation: 'Safe journey',
    pronunciation: 'Woht mah-behr',
    language: 'Acholi',
    examples: [
      { acholi: 'Wot maber i yo.', english: 'Have a safe journey on the road.' }
    ]
  },
  {
    word: 'Camat',
    translation: 'Food',
    pronunciation: 'Chah-maht',
    language: 'Acholi',
    examples: [
      { acholi: 'Camat tye maber.', english: 'The food is good.' }
    ]
  },
  {
    word: 'Dek',
    translation: 'Sauce / Stew',
    pronunciation: 'Dehk',
    language: 'Acholi',
    examples: [
      { acholi: 'Dek malakwang mit.', english: 'Malakwang stew is delicious.' }
    ]
  }
];
