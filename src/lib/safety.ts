const PROFANITY_LIST = [
  'profanity1', // Add real ones if needed, but keeping it generic for now
  'profanity2',
  'inappropriate'
];

export function filterProfanity(text: string): string {
  let filtered = text;
  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}

export function hasProfanity(text: string): boolean {
  return PROFANITY_LIST.some(word => text.toLowerCase().includes(word.toLowerCase()));
}
