import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("Missing Gemini API key. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Create models - one for text-only and one for multimodal
const textModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const visionModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Using the same model for both text and vision
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

// Start a regular text-based chat session
export const chatSession = textModel.startChat({
  generationConfig,
});

// Function to handle text-based content generation
export const generateContent = async (prompt) => {
  try {
    const result = await textModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in content generation:", error);
    throw error;
  }
};

// Function to handle multimodal analysis with video or image
export const analyzeMultimodalContent = async (prompt, fileBase64, fileType) => {
  try {
    const prompt = {
      contents: [
        {
          parts: [
            { text: prompt },
          ],
        },
      ],
    };

    // If file is provided, add it to the prompt
    if (fileBase64) {
      prompt.contents[0].parts.push({
        inline_data: {
          mime_type: fileType === 'video' ? "video/webm" : "image/jpeg",
          data: fileBase64.split(",")[1], // Remove the data URL prefix if present
        },
      });
    }

    // Use the vision model for multimodal content
    const result = await visionModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in multimodal content generation:", error);
    throw error;
  }
};

// Utility function to convert blob to base64
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result );
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};