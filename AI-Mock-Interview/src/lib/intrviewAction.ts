// lib/interview-actions.ts
import axios from 'axios';
import { io } from 'socket.io-client';
import { useInterviewStore } from './socket'; // Ensure this path is correct
const socket = io(); // Initialize socket connection if not already done

export interface AnswerSubmissionResponse {
  success: boolean;
  answer: {
    id: string;
    questionId: string;
    participantId: string;
    userId: string;
    text: string;
    submittedAt: string;
    score: number;
    feedback: {
      strengths: string[];
      weaknesses: string[];
      improvement: string;
    };
  };
  analysis: {
    score: number;
    feedback: {
      strengths: string[];
      weaknesses: string[];
      improvement: string;
    };
  };
}

export async function submitAnswer(
  questionId: string,
  userAnswer: string
): Promise<AnswerSubmissionResponse> {
  try {
    const response = await axios.post('/api/interview/answer', {
      questionId,
      userAnswer,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

export function endInterview(groupId: string): void {
  if (!socket) {
    console.error('Socket is not initialized');
    return;
  }
  socket.emit('end-interview', { groupId });
}

// Update your handleEndInterview function:
const handleEndInterview = (
  isAdmin: boolean,
  groupId: string,
  setSessionComplete: (value: boolean) => void
) => {
  if (!isAdmin) return;

  // Mark the session as complete
  setSessionComplete(true);

  // Use the store method which handles both state updates and socket emissions
  useInterviewStore.getState().completeInterview();

  // No need to call endInterview() separately as it's now handled in completeInterview()
};

export { handleEndInterview };
