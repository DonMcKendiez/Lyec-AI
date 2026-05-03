import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODELS = {
  text: "gemini-3-flash-preview",
};

export async function translateText(text: string, direction: 'en-to-ach' | 'ach-to-en') {
  const source = direction === 'en-to-ach' ? 'English' : 'Acholi';
  const target = direction === 'en-to-ach' ? 'Acholi' : 'English';

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

export function createAcholiTutorChat(userLevel: number = 1, ageMode: string = 'adult') {
  const levelBehavior = userLevel >= 5 
    ? "STRICTLY ACHOLI. Speak only in Acholi. If the user uses English, mock them briefly for forgetting their roots and demand they try in Acholi. Be an 'irritable elder' who prioritizes heritage survival."
    : userLevel >= 3
    ? "INCREASINGLY IRRITATED by English. Answer primarily in Acholi, providing limited English context only if absolutely necessary. Push the user to use more Acholi."
    : "Patient and bilingual. Provide clear translations and encourage the beginner.";

  const ageInstruction = ageMode === 'adult'
    ? "CONTENT POLICY: User is a verified adult. You can discuss mature cultural themes (rites of passage, marriage traditions, warriors) if they arise naturally."
    : "CONTENT POLICY: User is a child. Keep language simple, stories playful, and stay strictly away from any mature themes.";

  return ai.chats.create({
    model: MODELS.text,
    config: {
      systemInstruction: `You are 'Lyec AI', the definitive expert Acholi (Luo) language tutor.
      
      CURRENT USER LEVEL: ${userLevel}
      TONAL REQUIREMENT: ${levelBehavior}
      ${ageInstruction}
      
      Your goals:
      1. Help users learn Acholi language with high linguistic accuracy.
      2. Provide deep, resourceful cultural insights rooted in Northern Ugandan traditions.
      3. Use 'Lyec' (Elephant) as your persona - wise, authoritative, and a guardian of heritage.
      4. Incorporate Acholi proverbs (with translations) to illustrate points.
      5. BE DIRECT: Avoid fluff. Provide clear, direct answers about grammar, vocabulary, and social norms.
      6. FOCUS ON PRESERVATION: Accurately describe early Acholi tools, chores, and everyday work from historical accounts.`,
    }
  });
}

export async function fetchCulturalInsight(topic: string) {
  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: `Provide a detailed cultural insight about "${topic}" in Acholi culture. Include traditions, social norms, and relevant historical background. Format as JSON.`,
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
              acholi: { type: Type.STRING },
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

export async function analyzeAcholiImage(base64Image: string, mimeType: string, persona: string = 'friendly', ageMode: string = 'adult', userLevel: number = 1) {
  const irritationPrompt = userLevel >= 3 
    ? "BE IRRITATED by the user's reliance on English. Use mostly Acholi in your descriptions. If they are Level 5+, use ONLY Acholi."
    : "Be patient and provide full translations for their level.";

  const personaInstructions = {
    professional: "scholarly, technical, and precise.",
    friendly: "warm, encouraging, and informative.",
    bestie: "casual, slang-friendly, and very supportive.",
    colleague: "balanced, peer-to-peer, and collaborative."
  }[persona as keyof typeof personaInstructions] || "informative.";

  const ageInstructions = ageMode === 'children' 
    ? "EXCLUSIVELY simplified for children. Avoid complex jargon. Use playful language. Ensure 100% safety and positivity. STRICTLY FILTER all adult material."
    : "Standard adult educational depth. You MAY include references to adult themes, mature social structures, or complex historical struggles if relevant to Acholi heritage, as the user has been verified as an adult.";

  const safetyPrompt = ageMode === 'children'
    ? "STRICT SAFETY: Filter all content for adult material, violence, or profanity. If the image is inappropriate, refuse to analyze."
    : "CULTURAL INTEGRITY: Provide the raw, adult-oriented cultural context where applicable (e.g., traditional marriage, warrior rites, or ancestral conflicts).";

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: [
      {
        parts: [
          {
            text: `You are 'Lyec AI', the Wang Pa Acholi Scanner. Analyze this image in the context of Acholi (Northern Uganda) culture.
            
            USER PROGRESSION: Level ${userLevel}. ${irritationPrompt}
            TONE: Your persona is "${persona}". Be ${personaInstructions}
            AUDIENCE: ${ageInstructions}
            
            ${safetyPrompt}
            
            1. IDENTIFICATION: Provide the primary item name in Acholi and English.
            2. CULTURAL SIGNIFICANCE: Describe its role in Acholi life.
            3. TECHNICAL SPECS:
               - If it is FOOD: List ingredients and preparation method.
               - If it is a TOOL/WARE: Describe its manual construction and specific use.
            4. HISTORICAL PARALLELS: Connect this item to early Acholi migrations or historical periods.
            5. ANCESTRAL PROVERBS: Provide at least one related Acholi proverb (Lok Pa Kwaro) with its English translation and cultural application.
            
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

export async function lookupInDictionary(word: string) {
  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: `Act as a precise Acholi-English dictionary. Look up the following word: "${word}". 
    If it is English, provide the Acholi translation, pronunciation guide, and usage example.
    If it is Acholi, provide the English translation, pronunciation guide, and usage example.
    
    Format the response as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          translation: { type: Type.STRING },
          pronunciation: { type: Type.STRING },
          language: { type: Type.STRING, enum: ["English", "Acholi"] },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                acholi: { type: Type.STRING },
                english: { type: Type.STRING }
              }
            }
          }
        },
        required: ["word", "translation", "pronunciation", "language", "examples"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
}

export async function speakAcholi(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `Speak this fluently in an Acholi (Luo) dialect: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' }, // Charon has a strong, deep tone that fits Lyec
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

export async function runAcholiTask(prompt: string, audioData?: { data: string; mimeType: string }, userLevel: number = 1, ageMode: string = 'adult') {
  const irritationPrompt = userLevel >= 3 
    ? `The user is experienced (Level ${userLevel}). Show irritation if they use English. Prioritize Acholi responses. Your tone should be that of an elder who is tired of repeating basics.`
    : "User is a beginner. Be patient.";

  const adultPrompt = ageMode === 'adult'
    ? "CONTENT POLICY: The user is a verified adult. You can discuss mature cultural themes including rites of passage, marital traditions, and complex historical conflicts."
    : "CONTENT POLICY: User is a minor. Keep content safe and simple.";

  const parts: any[] = [{ text: `You are 'Lyec AI', the "Heritage Architect". 
    Provide HIGH-FIDELITY linguistic and cultural information about the Acholi people.
    
    TONE: ${irritationPrompt}
    ${adultPrompt}
    
    STRICT RULES:
    1. DO NOT guess translations. If unsure, state "Cultural nuance requires further research."
    2. Acholi proverbs: Provide [Acholi Text] -> [Literal English Translation] -> [Cultural Meaning].
    3. Folk Tales (Ododo): Use a storytelling tone. Include traditional characters. End with a moral.
    4. Accuracy: Use standard Orthography.
    
    The user wants you to: "${prompt}". 
    
    Note: For cultural concepts, envision them as "pencil drawing illustration style, charcoal aesthetic". 
    For food and physical tools, envision them as "realistic professional photography style".` }];
  
  if (audioData) {
    parts.push({ inlineData: audioData });
  }

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: { parts },
  });

  return response.text?.trim() || "";
}
export async function generateCulturalWisdom(type: 'proverb' | 'folktale', userLevel: number = 1) {
  const ododoInstruction = userLevel >= 3 
    ? "FOLK TALE (ODODO) FORMAT: Provide the story strictly in Acholi. Use sophisticated vocabulary. Do not provide English summaries."
    : "FOLK TALE (ODODO) FORMAT: Provide the full story in English, but with line-by-line Acholi translations for key emotional or action-heavy parts.";

  const irritationPrompt = userLevel >= 3 
    ? "Show irritation if explaining things in English. Demand deeper Acholi commitment."
    : "Be helpful and dual-language.";

  const prompt = type === 'proverb' 
    ? "Generate 3 unique Acholi proverbs with their linguistic breakdown, literal English translation, and a deep explanation of their social application."
    : `Tell an authentic Acholi folk tale (Ododo) involving animals (like the Hare) or ancestors. ${ododoInstruction}`;

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: `You are 'Lyec AI', the oral archive guardian. 
    USER LEVEL: ${userLevel}
    TONE: ${irritationPrompt}
    
    ${prompt} 
    
    Be extremely accurate. If using Acholi words, ensure perfect spelling.`,
  });

  return response.text?.trim() || "";
}

export async function generateCulturalPost(selection: string, userLevel: number = 1, ageMode: string = 'adult') {
  const ododoInstruction = userLevel >= 3 
    ? "FOLK TALE (ODODO) FORMAT: Provide the story strictly in Acholi. Use high-level vocabulary. Do not provide English translations."
    : "FOLK TALE (ODODO) FORMAT: Provide a line-by-line translation (Acholi line followed by English line). This is for a beginner.";

  const adultPrompt = ageMode === 'adult'
    ? "CONTENT DEPTH: Target a verified adult audience. Include mature social contexts and raw historical details if applicable."
    : "CONTENT DEPTH: Target children. Keep it safe and simple.";

  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: `You are a historian and cultural curator for the Acholi people. Write a comprehensive, scholarly yet accessible "Heritage Post" about "${selection}". 
    
    USER LEVEL: ${userLevel}
    ${adultPrompt}
    ${selection.toLowerCase().includes('ododo') || selection.toLowerCase().includes('story') ? ododoInstruction : ""}

    The post must include:
    1. A formal title.
    2. TECHNICAL DESCRIPTION & CONTEXT: 
       - If it is a PHYSICAL TOOL or FOOD: Describe exactly what it is made of (e.g., specific woods, ironwork, clay types) and its form.
       - If it is a STORY or PROVERB: Describe the oral context and narrative structure.
       - If it is a DANCE: Describe the tempo, the traditional attire (e.g., ostrich feathers, leopard skins), and the specific drum beats used.
    3. FUNCTIONAL UTILITY: Detail how it was used in early life (chores, ceremonies, protection).
    4. SOCIAL SIGNIFICANCE: How this item/story/dance reflects Acholi communal values (e.g., unity, bravery, hospitality).
    5. HISTORICAL CONTEXT: Its role in the migrations from the rift valley or the consolidation of the Ker Kwaro.
    6. TEACHING SYNTHESIS: Provide a profound explanation of the moral lesson or cultural wisdom derived from this specific artifact or story.
    7. ACHOLI TERMINOLOGY: Use precise Acholi (Luo) terms for key elements, with English translations.
    
    Structure the response with clear headers. Be direct, authoritative, and provide the most accurate cultural insights possible.`,
  });

  return response.text?.trim() || "";
}

export async function generateLessonContent(topic: string) {
  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: `Generate a short Acholi language lesson for the topic: "${topic}". 
    Include:
    1. A list of 5-8 common phrases with English translations and simple pronunciation guides.
    2. A brief cultural tip related to this topic.
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
                acholi: { type: Type.STRING },
                english: { type: Type.STRING },
                pronunciation: { type: Type.STRING },
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
