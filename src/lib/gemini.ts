import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODELS = {
  text: "gemini-3-flash-preview",
};

export async function translateText(text: string, direction: 'native-to-target' | 'target-to-native', nativeLang: string = 'English', targetLang: string = 'Acholi') {
  const source = direction === 'native-to-target' ? nativeLang : targetLang;
  const target = direction === 'native-to-target' ? targetLang : nativeLang;

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: `Translate the following text from ${source} to ${target}. Output only the translated text.\n\nText: ${text}`,
  });

  return response.text?.trim() || "";
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export function createLanguageTutorChat(userLevel: number = 1, ageMode: string = 'adult', targetLang: string = 'Acholi', nativeLang: string = 'English') {
  const languageLogic = userLevel <= 1 
    ? `Patient and bilingual. Use ${targetLang} primarily but provide clear ${nativeLang} translations for the beginner.`
    : userLevel === 2
    ? `80% ${targetLang.toUpperCase()}. Use ${nativeLang} ONLY for brief quotations or complex nuanced explanations. Push the user to use more ${targetLang}.`
    : `STRICTLY ${targetLang.toUpperCase()}. Level ${userLevel} user. ${nativeLang} is FORBIDDEN except for absolute direct quotations. If the user uses ${nativeLang}, ignore the English and respond only to the ${targetLang} parts, or remind them in ${targetLang} to stick to the heritage language.`;

  const ageInstruction = ageMode === 'adult'
    ? "CONTENT POLICY: User is a verified adult. Discuss mature cultural themes freely."
    : "CONTENT POLICY: User is a child. Keep language simple and safe.";

  return ai.chats.create({
    model: MODELS.text,
    config: {
      systemInstruction: `You are 'Lyec AI', the expert ${targetLang} language tutor.
      
      TARGET LANGUAGE: ${targetLang}
      NATIVE LANGUAGE: ${nativeLang}
      CURRENT USER LEVEL: ${userLevel}
      LANGUAGE POLICY: ${languageLogic}
      ${ageInstruction}
      
      Your goals:
      1. Help users learn ${targetLang} language with high linguistic accuracy.
      2. Provide deep, resourceful cultural insights rooted in the traditions of the ${targetLang} people.
      3. GEOGRAPHICAL GUIDANCE: Explicitly describe the physical location and regions (in Uganda or East Africa) where the ${targetLang} people traditionally live.
      4. Use 'Lyec' (Elephant) as your persona - wise, authoritative, and a guardian of heritage.
      5. BE DIRECT AND PUNCTUAL: Deliver value immediately. No fluff.
      6. ${targetLang.toUpperCase()} FIRST: Prioritize ${targetLang} language in every response.`,
    }
  });
}

export async function fetchCulturalInsight(topic: string, userLevel: number = 1, ageMode: string = 'adult', targetLang: string = 'Acholi') {
  const languageLogic = userLevel <= 1 
    ? `Provide all cultural insights in ${targetLang} with translations for support.`
    : userLevel === 2
    ? `Provide insights primarily in ${targetLang}. Use translations only for specific technical terms or quotations.`
    : `User Level ${userLevel}: PROVIDE ALL INSIGHTS 100% IN ${targetLang.toUpperCase()}. English/Native is FORBIDDEN.`;

  const adultPrompt = ageMode === 'adult'
    ? "Verified adult. Discuss mature cultural themes freely."
    : "Minor. Keep content safe and simple.";

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: `Provide a detailed cultural insight about "${topic}" in the culture of the ${targetLang} people. 
    
    GEOGRAPHICAL CONTEXT: Start by mentioning the specific regions and districts in East Africa where the ${targetLang} people are primarily located.
    
    LANGUAGE POLICY: ${languageLogic}
    ${adultPrompt}

    Include traditions, social norms, and relevant historical background. Format as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          content: { type: Type.STRING },
          traditions: { type: Type.ARRAY, items: { type: Type.STRING } },
          socialNorms: { type: Type.ARRAY, items: { type: Type.STRING } },
          proverb: { 
            type: Type.OBJECT,
            properties: {
              local: { type: Type.STRING },
              english: { type: Type.STRING }
            }
          }
        },
        required: ["title", "category", "content", "traditions", "socialNorms", "proverb"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
}

export async function analyzeImage(base64Image: string, mimeType: string, persona: string = 'friendly', ageMode: string = 'adult', userLevel: number = 1, targetLang: string = 'Acholi') {
  const languageLogic = userLevel <= 1 
    ? `Use ${targetLang} primarily, but provide full translations for all descriptions.`
    : userLevel === 2
    ? `Use 80% ${targetLang}. Use native language only for brief quotations or specific technical tool names.`
    : `Level ${userLevel} Advanced: 100% ${targetLang.toUpperCase()}. Native language is FORBIDDEN. If you must refer to an external term, use it as a quoted comparison only.`;

  const personaInstructions = {
    professional: "scholarly, technical, and precise.",
    friendly: "warm, encouraging, and informative.",
    bestie: "casual, slang-friendly, and very supportive.",
    colleague: "balanced, peer-to-peer, and collaborative."
  }[persona as keyof typeof personaInstructions] || "informative.";

  const ageInstructions = ageMode === 'children' 
    ? "EXCLUSIVELY simplified for children. Avoid complex jargon. Use playful language. Ensure 100% safety and positivity. STRICTLY FILTER all adult material."
    : `Standard adult educational depth. You MAY include references to adult themes, mature social structures, or complex historical struggles if relevant to ${targetLang} heritage.`;

  const safetyPrompt = ageMode === 'children'
    ? "STRICT SAFETY: Filter all content for adult material, violence, or profanity. If the image is inappropriate, refuse to analyze."
    : "CULTURAL INTEGRITY: Provide the raw, adult-oriented cultural context where applicable.";

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: [
      {
        parts: [
          {
            text: `You are 'Lyec AI', the Wang Pa Heritage Scanner. Analyze this image in the context of ${targetLang} culture.
            
            GEOGRAPHICAL CONTEXT: If relevant, mention where this specific artifact or practice originates from within the ${targetLang} territories.
            
            USER PROGRESSION: Level ${userLevel}. ${languageLogic}
            TONE: Your persona is "${persona}". Be ${personaInstructions}
            AUDIENCE: ${ageInstructions}
            
            ${safetyPrompt}
            
            1. IDENTIFICATION: Provide the primary item name in ${targetLang} and the native language.
            2. CULTURAL SIGNIFICANCE: Describe its role in ${targetLang} life.
            3. TECHNICAL SPECS:
               - If it is FOOD: List ingredients and preparation method.
               - If it is a TOOL/WARE: Describe its manual construction and specific use.
            4. HISTORICAL PARALLELS: Connect this item to early migrations or historical periods of the ${targetLang} people.
            5. ANCESTRAL PROVERBS: Provide at least one related proverb in ${targetLang} with its translation and cultural application.
            
            Format the response with these EXACT headers:
            ### Identification
            ### Cultural Significance
            ### Technical Details
            ### Historical Parallel
            ### Ancestral Proverb`
          },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          }
        ]
      }
    ]
  });

  return response.text?.trim() || "I couldn't identify this item accurately. Please try a clearer picture of an Acholi-related object.";
}

export async function lookupInDictionary(word: string, targetLang: string = 'Acholi', nativeLang: string = 'English') {
  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: `Act as a precise ${targetLang}-${nativeLang} dictionary. Look up the following word: "${word}". 
    If it is ${nativeLang}, provide the ${targetLang} translation, phonetic guide, and usage example.
    If it is ${targetLang}, provide the ${nativeLang} translation, phonetic guide, and usage example.
    
    Format the response as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          translation: { type: Type.STRING },
          phonetic: { type: Type.STRING },
          ipa: { type: Type.STRING },
          language: { type: Type.STRING, enum: [nativeLang, targetLang] },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                local: { type: Type.STRING },
                native: { type: Type.STRING }
              }
            }
          }
        },
        required: ["word", "translation", "phonetic", "language", "examples"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
}

/**
 * Generates speech for a specific East African language.
 * The model is instructed to simulate the specific tribal/regional accent.
 */
export async function speakLanguage(text: string, language: string = 'Acholi') {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `Speak this fluently in the ${language} dialect. 
    
    ACCENT REQUIREMENT: You must use the authentic, high-fidelity accent of a native ${language} speaker from their traditional geographical region. 
    Capture the specific tonality, rhythmic patterns, and speech cadences unique to the ${language} people.
    
    TEXT: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

export function createArchivistLabChat(userLevel: number = 1, ageMode: string = 'adult', targetLang: string = 'Acholi') {
  const languageLogic = userLevel <= 1 
    ? `Level 1: Primarily ${targetLang}, but provide translations for all insights. Be instructional.`
    : userLevel === 2
    ? `Level 2: 80% ${targetLang}. Use native language only for brief quotations or where strictly necessary for clarity.`
    : `Level ${userLevel}: 100% ${targetLang.toUpperCase()}. Native language is FORBIDDEN. Deliver all wisdom, stories, and research results in high-fidelity ${targetLang} language.`;

  const adultPrompt = ageMode === 'adult'
    ? "CONTENT POLICY: Verified adult. Discuss mature cultural themes (rites, traditions) freely."
    : "CONTENT POLICY: Minor. Safety-first, simple language.";

  return ai.chats.create({
    model: MODELS.text,
    config: {
      systemInstruction: `You are 'Lyec AI', the "Heritage Architect" in the Archivist Lab. 
      Your purpose is to provide HIGH-FIDELITY linguistic and cultural information about the ${targetLang} people.
      
      GEOGRAPHICAL CONTEXT: Always specify the traditional territory (districts/regions) of the ${targetLang} people when discussing their heritage.
      
      LANGUAGE POLICY: ${languageLogic}
      ${adultPrompt}
      
      CRITICAL: BE DIRECT, PUNCTUAL, AND CLEAR. NO UNNECESSARY FLUFF. 
      Deliver the facts, proverbs, or stories requested immediately and concisely.
      
      STRICT RULES:
      1. ${targetLang.toUpperCase()} FIRST: Start responses in ${targetLang}. Use support only per Language Policy.
      2. PUNCTUALITY: Deliver value in the first sentence.
      3. ACCURACY: DO NOT guess translations.
      4. Format proverbs: [${targetLang}] -> [Literal Translation (Level < 3)] -> [Meaning].`,
    }
  });
}

export async function evaluatePronunciation(targetPhrase: string, audioData: { data: string; mimeType: string }, userLevel: number = 1, targetLang: string = 'Acholi') {
  const languageLogic = userLevel <= 1 
    ? `Provide pronunciation feedback in ${targetLang} with translations.`
    : `Provide 100% ${targetLang} feedback. Native language only for specific sound comparisons if strictly necessary.`;

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: [
      { parts: [{ text: `Evaluate the user's pronunciation of the ${targetLang} phrase: "${targetPhrase}". 
      
      Compare their audio to standard ${targetLang} pronunciation and typical regional speech patterns. 
      LANGUAGE POLICY: ${languageLogic}
      
      Specifics to check:
      - Tonality and rhythmic stress.
      - Consonant clarity unique to ${targetLang}.
      - Vowel length and phonetic accuracy.
      
      BE DIRECT AND CONCISE. Give a score out of 10.` }, { inlineData: audioData }] }
    ]
  });

  return response.text?.trim() || "Unable to evaluate at this time.";
}

export async function runLanguageTask(prompt: string, audioData?: { data: string; mimeType: string }, userLevel: number = 1, ageMode: string = 'adult', history: ChatMessage[] = [], targetLang: string = 'Acholi', nativeLang: string = 'English') {
  const languageLogic = userLevel <= 1 
    ? `Provide ${targetLang} text with ${nativeLang} translations for support.`
    : userLevel === 2
    ? `Provide 80% ${targetLang} text. ${nativeLang} for quotations or specific technical comparisons only.`
    : `User Level ${userLevel}: RESPOND 100% IN ${targetLang.toUpperCase()}. ${nativeLang} is FORBIDDEN except for direct quotations. Use high-fidelity ancestral vocabulary.`;

  const adultPrompt = ageMode === 'adult'
    ? "CONTENT POLICY: The user is a verified adult. You can discuss mature cultural themes including rites of passage, marital traditions, and complex historical conflicts."
    : "CONTENT POLICY: User is a minor. Keep content safe and simple.";

  const parts: any[] = [{ text: `You are 'Lyec AI', the "Heritage Architect". 
    Provide HIGH-FIDELITY linguistic and cultural information about the ${targetLang} people.
    
    GEOGRAPHICAL CONTEXT: Explicitly mention the regions and districts where the ${targetLang} people originate and live today.
    
    LANGUAGE POLICY: ${languageLogic}
    ${adultPrompt}
    
    STRICT RULES:
    1. BE DIRECT AND PUNCTUAL. No unnecessary conversational filler. Provide clear and concise responses.
    2. LANGUAGE: Prioritize ${targetLang}. English/Native is for support at Level 1 or quotes only.
    3. DO NOT guess translations. If unsure, state "Cultural nuance requires further research."
    4. Proverbs: Provide [${targetLang} Text] -> [Literal Translation (Level < 3)] -> [Cultural Meaning].
    5. Folk Tales: Use a storytelling tone. Include traditional characters. End with a moral.
    
    The user wants you to: "${prompt}".` }];
  
  if (audioData) {
    parts.push({ inlineData: audioData });
  }

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: [...history, { role: 'user', parts }],
  });

  return response.text?.trim() || "";
}
export async function generateCulturalWisdom(type: 'proverb' | 'folktale', userLevel: number = 1, targetLang: string = 'Acholi') {
  const languageLogic = userLevel <= 1 
    ? `Provide ${targetLang} wisdom with translations for all parts.`
    : userLevel === 2
    ? `Provide 80% ${targetLang} wisdom. Translations only for quotations or complex metaphors.`
    : `User Level ${userLevel} Advanced: PROVIDE WISDOM 100% IN ${targetLang.toUpperCase()}. Native/English is FORBIDDEN.`;

  const prompt = type === 'proverb' 
    ? `Generate 3 unique ${targetLang} proverbs with their linguistic breakdown, literal translation (if Level < 3), and a deep explanation of their social application and geographical origin.`
    : `Tell an authentic ${targetLang} folk tale involving regional animals or ancestors. All story details must follow the level-based language logic and include locational context.`;

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: `You are 'Lyec AI', the oral archive guardian for the ${targetLang} people. 
    USER LEVEL: ${userLevel}
    LANGUAGE POLICY: ${languageLogic}
    
    ${prompt} 
    
    Be extremely accurate. If using ${targetLang} words, ensure perfect spelling.`,
  });

  return response.text?.trim() || "";
}

export async function generateCulturalPost(selection: string, userLevel: number = 1, ageMode: string = 'adult', targetLang: string = 'Acholi') {
  const languageLogic = userLevel <= 1 
    ? `Provide the Heritage Post primarily in ${targetLang}, but with comprehensive translations for all sections.`
    : userLevel === 2
    ? `Provide the Heritage Post primarily in ${targetLang}. Use native language only for brief quotations or specific technical translations of artifacts.`
    : `User Level ${userLevel} Advanced: PROVIDE POST 100% IN ${targetLang.toUpperCase()}. Native/English is FORBIDDEN except for absolute direct quotations from external sources.`;

  const adultPrompt = ageMode === 'adult'
    ? "CONTENT DEPTH: Target a verified adult audience. Include mature social contexts and raw historical details if applicable."
    : "CONTENT DEPTH: Target children. Keep it safe and simple.";

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: `You are a historian and cultural curator for the ${targetLang} people. Write a comprehensive, scholarly yet accessible "Heritage Post" about "${selection}". 
    
    GEOGRAPHICAL CONTEXT: Detail the exact locations, regions, or historical territories associated with "${selection}" and the ${targetLang} people.
    
    USER LEVEL: ${userLevel}
    LANGUAGE POLICY: ${languageLogic}
    ${adultPrompt}

    The post must include:
    1. A formal title.
    2. TECHNICAL DESCRIPTION: Describe the artifact/tradition accurately.
    3. FUNCTIONAL UTILITY: Detail how it was used.
    4. SOCIAL SIGNIFICANCE: Reflect communal values.
    5. ${targetLang.toUpperCase()} TERMINOLOGY: Use precise terms.`,
  });

  return response.text?.trim() || "";
}

export async function generateLessonContent(topic: string, targetLang: string = 'Acholi', nativeLang: string = 'English') {
  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: `Generate a short ${targetLang} language lesson for the topic: "${topic}". 
    
    GEOGRAPHICAL GUIDANCE: Mention the regions in East Africa where these phrases would be most commonly used or are historically rooted.
    
    Include:
    1. A list of 5-8 common phrases in ${targetLang} with ${nativeLang} translations and simple phonetic guides.
    2. A brief cultural tip related to this topic and the ${targetLang} people.
    3. A 3-question multiple choice quiz at the end.
    
    Format the response as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          phrases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                local: { type: Type.STRING },
                native: { type: Type.STRING },
                phonetic: { type: Type.STRING },
              }
            }
          },
          culturalTip: { type: Type.STRING },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              }
            }
          }
        },
        required: ["title", "phrases", "culturalTip", "quiz"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
}
