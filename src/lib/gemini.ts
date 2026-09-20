// Refactored to use backend AI proxy to keep API keys secure
import { api } from './api';

export const generateCourseSummary = async (courseTitle: string, description: string, lessons: any[]) => {
  try {
    const response = await api.post('/ai/summary', { courseTitle, description, lessons });
    return response.text;
  } catch (error) {
    console.error("AI Summary Error:", error);
    throw new Error("Failed to generate AI summary.");
  }
};

export const generateQuizQuestions = async (lessonTitle: string, content: string) => {
  try {
    return await api.post('/ai/quiz', { lessonTitle, content });
  } catch (error) {
    console.error("AI Quiz Error:", error);
    throw error;
  }
};

export const askLearningAssistant = async (question: string, context: string, history?: any[]) => {
  try {
    const response = await api.post('/ai/ask', { question, context, history });
    return response.text;
  } catch (error) {
    console.error("AI Assistant Error:", error);
    throw new Error("Failed to get response from AI assistant.");
  }
};
