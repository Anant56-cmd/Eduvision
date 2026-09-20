import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
    return null;
  }
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

export const generateCourseSummary = async (courseTitle: string, description: string, lessons: any[]) => {
  const ai = getAI();
  if (!ai) throw new Error("AI Assistant is not configured.");
  const lessonTitles = lessons.map(l => l.title).join(", ");
  const prompt = `
    Summarize the following e-learning course for a student. 
    Provide a concise overview of what they will learn and the key takeaways.
    
    Course Title: ${courseTitle}
    Description: ${description}
    Lessons: ${lessonTitles}
    
    Format the response in a professional, encouraging tone. Use bullet points for key takeaways.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate AI summary.");
  }
};

const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>?/gm, '');
};

export const generateQuizQuestions = async (lessonTitle: string, content: string) => {
  const ai = getAI();
  if (!ai) throw new Error("AI Assistant is not configured.");
  
  const cleanContent = stripHtml(content).trim() || "General course content";
  
  const prompt = `
    Create 3 multiple-choice questions for a quiz based on the following lesson content.
    
    Lesson Title: ${lessonTitle}
    Content: ${cleanContent}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) {
      console.error("Gemini returned empty response");
      return [];
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON response:", text);
      throw new Error("Invalid AI response format");
    }
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    throw error;
  }
};

export const askLearningAssistant = async (question: string, context: string) => {
  const ai = getAI();
  if (!ai) throw new Error("AI Assistant is not configured.");
  const prompt = `
    You are a helpful learning assistant for Nova Academy. 
    Answer the student's question based on the following context (lesson content or course info).
    If the answer is not in the context, use your general knowledge but stay relevant to the topic.
    
    Context: ${context}
    Student Question: ${question}
    
    Keep the answer concise, encouraging, and clear.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Assistant Error:", error);
    throw new Error("Failed to get response from AI assistant.");
  }
};
