import { Response } from 'express';
import { GoogleGenAI, Type } from "@google/genai";
import { AuthRequest } from '../middleware/auth';

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { courseTitle, description, lessons } = req.body;
    const ai = getAI();
    if (!ai) return res.status(503).json({ message: 'AI service not configured' });

    const lessonTitles = lessons.map((l: any) => l.title).join(", ");
    const prompt = `
      Summarize the following e-learning course for a student. 
      Provide a concise overview of what they will learn and the key takeaways.
      
      Course Title: ${courseTitle}
      Description: ${description}
      Lessons: ${lessonTitles}
      
      Format the response in a professional, encouraging tone. Use bullet points for key takeaways.
    `;

    const model = "gemini-1.5-flash";
    const result = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    res.json({ text: result.text });
  } catch (error) {
    console.error('Gemini Summary Error:', error);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
};

export const generateQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonTitle, content } = req.body;
    const ai = getAI();
    if (!ai) return res.status(503).json({ message: 'AI service not configured' });

    const cleanContent = content.replace(/<[^>]*>?/gm, '').trim() || "General course content";
    const prompt = `
      Create 3 multiple-choice questions for a quiz based on the following lesson content.
      Return ONLY a JSON array of objects.
      
      Lesson Title: ${lessonTitle}
      Content: ${cleanContent}
    `;

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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

    const parsedResult = result.text ? JSON.parse(result.text) : [];
    res.json(parsedResult);
  } catch (error) {
    console.error('Gemini Quiz Error:', error);
    res.status(500).json({ message: 'Failed to generate quiz' });
  }
};

export const askAssistant = async (req: AuthRequest, res: Response) => {
  try {
    const { question, context, history } = req.body;
    const ai = getAI();

    if (!ai) {
      // Intelligent pedagogical fallback
      return res.json({
        text: `Based on your course materials on ${context ? context.slice(0, 50) + '...' : 'this topic'}, remember that breaking down the concept into first principles, reviewing code patterns, and practicing related quizzes is the most effective approach. Could you specify which part you'd like to dive into?`
      });
    }

    // Build chat contents from history if available
    let contents: any[] = [];
    if (history && Array.isArray(history) && history.length > 0) {
      contents = history.slice(-6).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    }

    const currentPrompt = `Context: ${context || 'General computer science & engineering'}\nStudent Question: ${question}\n\nYou are EduVision's elite AI Learning Mentor (trained for industry-standard clarity and conceptual pedagogy). Answer the student's question concisely, clearly, with an encouraging tone. Include quick code snippets or examples if relevant.`;
    
    contents.push({
      role: 'user',
      parts: [{ text: currentPrompt }]
    });

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents
    });

    res.json({ text: result.text });
  } catch (error) {
    console.error('Gemini Assistant Error:', error);
    res.json({
      text: "I'm currently reviewing the lesson data. In the meantime, try reviewing the lesson notes or testing your knowledge with the chapter quiz!"
    });
  }
};
