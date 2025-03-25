const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
console.log(apiKey);
const genAI = new GoogleGenerativeAI(apiKey);

// Create models - one for text-only and one for multimodal
const textModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const visionModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Using the same model for both text and vision
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Start a regular text-based chat session
export const chatSession = textModel.startChat({
  generationConfig,
});

// Function to handle multimodal analysis with video
export const analyzeWithVideo = async (videoBase64, textPrompt) => {
  try {
    // Prepare the prompt parts with both text and video
    const prompt = {
      contents: [
        {
          parts: [
            { text: textPrompt },
            {
              inline_data: {
                mime_type: "video/webm",
                data: videoBase64.split(",")[1] // Remove the data URL prefix if present
              }
            }
          ]
        }
      ]
    };

    // Generate content from the vision model
    const result = await visionModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in video analysis:", error);
    throw error;
  }
};

// Function to convert Blob to base64 (client-side utility)
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};