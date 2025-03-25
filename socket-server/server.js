// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://ai-mock-interview-ten-omega.vercel.app/',
  methods: ['GET', 'POST'],
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://ai-mock-interview-ten-omega.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store active interview sessions and their timers
const activeInterviews = new Map();
const userToRoom = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle explicit room joining for scoreboards
  socket.on('join-group', (groupId) => {
    console.log(`Socket ${socket.id} joining group ${groupId} for score updates`);
    socket.join(groupId);

    // Send current scores if available
    const interview = activeInterviews.get(groupId);
    if (interview) {
      // Make sure scores exist and initialize if not
      if (!interview.scores) {
        interview.scores = {};
        activeInterviews.set(groupId, interview);
      }

      // Always send the complete scores object
      socket.emit('score-update', interview.scores);
      console.log(`Sent initial scores to new connection in group ${groupId}:`, interview.scores);
    } else {
      // Create an empty interview object with scores
      const newInterview = { scores: {} };
      activeInterviews.set(groupId, newInterview);
      socket.emit('score-update', {});
      console.log(`Created new interview for group ${groupId}`);
    }
  });

  // Join interview group room
  socket.on('join-interview', ({ groupId, userId, username }) => {
    console.log(`User ${username} (${userId}) joined interview group ${groupId}`);

    // Add user to the room
    socket.join(groupId);
    userToRoom.set(socket.id, { groupId, userId, username }); // Store username as well

    // Initialize scores if not already done
    const interview = activeInterviews.get(groupId) || { scores: {} };
    if (!interview.scores) {
      interview.scores = {};
    }

    // Initialize user score if they don't have one
    if (!interview.scores[userId]) {
      interview.scores[userId] = {
        score: 0,
        name: username || `User ${userId.substring(0, 8)}`
      };
    }

    // Store/update the interview
    activeInterviews.set(groupId, interview);

    // Broadcast updated scores to everyone in the room
    io.to(groupId).emit('score-update', interview.scores);
    console.log(`Updated scores after user joined ${groupId}:`, interview.scores);

    // Notify others in the room
    socket.to(groupId).emit('user-joined', {
      userId,
      username,
      socketId: socket.id
    });

    // Send currently active users in this room
    const roomSockets = io.sockets.adapter.rooms.get(groupId);
    if (roomSockets) {
      const usersInRoom = [];
      // Collect all users in the room with their details
      for (const socketId of roomSockets) {
        const userDetails = userToRoom.get(socketId);
        if (userDetails) {
          usersInRoom.push({
            userId: userDetails.userId,
            username: userDetails.username,
            socketId
          });
        } else {
          usersInRoom.push({ socketId });
        }
      }
      socket.emit('room-users', usersInRoom);
    }

    // If interview is already in progress, send the current question and remaining time
    if (interview && interview.inProgress) {
      socket.emit('interview-in-progress', {
        currentQuestionIndex: interview.currentQuestionIndex,
        question: interview.questions[interview.currentQuestionIndex],
        remainingTime: interview.endTime - Date.now(),
        totalQuestions: interview.questions.length
      });
    }
  });

  // Host starts the interview
  socket.on('start-interview', ({ groupId, questions }) => {
    console.log(`Starting interview for group ${groupId} with ${questions.length} questions`);

    // Create a new interview session or update existing one
    const existingInterview = activeInterviews.get(groupId) || {};
    const interview = {
      ...existingInterview,
      questions,
      currentQuestionIndex: 0,
      startTime: Date.now(),
      endTime: Date.now() + (questions[0].timeLimit * 1000),
      inProgress: true,
      answers: new Map(), // Store user answers
      timers: {}, // Store timer objects
      scores: existingInterview.scores || {} // Keep existing scores or initialize
    };

    activeInterviews.set(groupId, interview);

    // Send first question to all users in the room
    io.to(groupId).emit('question-started', {
      questionIndex: 0,
      question: questions[0],
      totalQuestions: questions.length,
      timeLimit: questions[0].timeLimit
    });

    // Start timer for the current question
    startQuestionTimer(groupId, questions[0].timeLimit);
  });

  // Handle user submitting an answer
  socket.on('submit-answer', ({ groupId, userId, questionIndex, answer, score }) => {
    console.log(`User ${userId} submitted answer for question ${questionIndex} in group ${groupId}`);

    const interview = activeInterviews.get(groupId);
    if (!interview) return;

    // Store the user's answer
    if (!interview.answers.has(questionIndex)) {
      interview.answers.set(questionIndex, new Map());
    }
    interview.answers.get(questionIndex).set(userId, answer);

    // Update user's score if provided
    if (score !== undefined) {
      if (!interview.scores) {
        interview.scores = {};
      }

      if (!interview.scores[userId]) {
        // If this is a new user, initialize with name
        const userDetails = Array.from(userToRoom.entries())
          .find(([_, details]) => details.userId === userId);

        const username = userDetails ? userDetails[1].username : `User ${userId.substring(0, 8)}`;

        interview.scores[userId] = {
          score: score,
          name: username
        };
      } else {
        // Update existing user's score
        interview.scores[userId].score = score;
      }

      // Emit updated scores to everyone in the room
      io.to(groupId).emit('score-update', interview.scores);
      console.log(`Emitted score update for ${groupId}:`, interview.scores);
    }

    // Notify all users that this user has submitted
    io.to(groupId).emit('user-submitted', {
      userId,
      questionIndex
    });

    // Check if all users have submitted
    checkAllSubmitted(groupId, questionIndex);
  });

  // Dedicated score update event
  socket.on('update-score', ({ groupId, userId, score, name }) => {
    console.log(`Updating score for user ${userId} in group ${groupId} to ${score}`);

    const interview = activeInterviews.get(groupId) || { scores: {} };
    if (!interview.scores) {
      interview.scores = {};
    }

    interview.scores[userId] = {
      score: score,
      name: name || interview.scores[userId]?.name || `User ${userId.substring(0, 8)}`
    };

    activeInterviews.set(groupId, interview);

    // Emit to all clients in the room
    io.to(groupId).emit('score-update', interview.scores);
    console.log(`Emitted score update to room ${groupId}:`, interview.scores);
  });

  // Jump to next question manually (for admin/host)
  socket.on('next-question', ({ groupId }) => {
    const interview = activeInterviews.get(groupId);
    if (!interview || !interview.inProgress) return;

    // Clear existing timer
    clearTimeout(interview.timers.questionTimer);

    // Move to next question
    moveToNextQuestion(groupId);
  });

  // Handle interview end from client
  socket.on('end-interview', ({ groupId }) => {
    console.log(`Host ended interview for group ${groupId}`);
    endInterview(groupId);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const userRoom = userToRoom.get(socket.id);
    if (userRoom) {
      const { groupId, userId } = userRoom;
      console.log(`User ${userId} disconnected from group ${groupId}`);

      // Notify others in the room
      socket.to(groupId).emit('user-left', {
        userId,
        socketId: socket.id
      });

      userToRoom.delete(socket.id);
    }
  });
});

// Start timer for a question
function startQuestionTimer(groupId, timeLimit) {
  const interview = activeInterviews.get(groupId);
  if (!interview) return;

  // Clear any existing timers to prevent duplicates
  if (interview.timers.questionTimer) {
    clearTimeout(interview.timers.questionTimer);
  }

  interview.timers.questionTimer = setTimeout(() => {
    // Time's up for current question
    io.to(groupId).emit('time-up', {
      questionIndex: interview.currentQuestionIndex
    });

    // Give a short break before moving to next question
    if (interview.timers.breakTimer) {
      clearTimeout(interview.timers.breakTimer);
    }

    interview.timers.breakTimer = setTimeout(() => {
      moveToNextQuestion(groupId);
    }, 3000); // 3-second break between questions

  }, timeLimit * 1000);
}

// Move to the next question
function moveToNextQuestion(groupId) {
  const interview = activeInterviews.get(groupId);
  if (!interview || !interview.inProgress) return;

  interview.currentQuestionIndex++;

  // Check if we've reached the end of questions
  if (interview.currentQuestionIndex >= interview.questions.length) {
    endInterview(groupId);
    return;
  }

  // Set up for the next question
  const nextQuestion = interview.questions[interview.currentQuestionIndex];
  interview.startTime = Date.now();
  interview.endTime = Date.now() + (nextQuestion.timeLimit * 1000);

  // Send next question to all users
  io.to(groupId).emit('question-started', {
    questionIndex: interview.currentQuestionIndex,
    question: nextQuestion,
    totalQuestions: interview.questions.length,
    timeLimit: nextQuestion.timeLimit
  });

  // Start timer for the next question
  startQuestionTimer(groupId, nextQuestion.timeLimit);
}

// End the interview session
function endInterview(groupId) {
  const interview = activeInterviews.get(groupId);
  if (!interview) return;

  interview.inProgress = false;

  // Clear any active timers
  if (interview.timers.questionTimer) {
    clearTimeout(interview.timers.questionTimer);
  }
  if (interview.timers.breakTimer) {
    clearTimeout(interview.timers.breakTimer);
  }

  // Compile all answers and results
  const results = {
    questions: interview.questions,
    answers: interview.answers ? Array.from(interview.answers).map(([questionIndex, userAnswers]) => ({
      questionIndex,
      answers: Array.from(userAnswers).map(([userId, answer]) => ({
        userId,
        answer
      }))
    })) : [],
    scores: interview.scores || {}
  };

  // Send results to all users
  io.to(groupId).emit('interview-ended', results);

  // Send final score update
  io.to(groupId).emit('score-update', interview.scores || {});

  // Keep results for some time before clearing
  setTimeout(() => {
    activeInterviews.delete(groupId);
  }, 3600000); // Store for 1 hour
}

// Check if all users have submitted answers
function checkAllSubmitted(groupId, questionIndex) {
  const interview = activeInterviews.get(groupId);
  if (!interview) return;

  const roomSockets = io.sockets.adapter.rooms.get(groupId);
  if (!roomSockets) return;

  const totalUsers = roomSockets.size;
  const answeredUsers = interview.answers.has(questionIndex) ?
    interview.answers.get(questionIndex).size : 0;

  // If all users have submitted, move to next question
  if (answeredUsers >= totalUsers) {
    // Clear the question timer
    if (interview.timers.questionTimer) {
      clearTimeout(interview.timers.questionTimer);
    }

    // Notify that all users have submitted
    io.to(groupId).emit('all-submitted', {
      questionIndex
    });

    // Clear any existing break timer to prevent duplicates
    if (interview.timers.breakTimer) {
      clearTimeout(interview.timers.breakTimer);
    }

    // Set a break timer before moving to the next question
    interview.timers.breakTimer = setTimeout(() => {
      moveToNextQuestion(groupId);
    }, 3000); // 3-second break between questions
  }
}

// Server health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

module.exports = server; // Export for testing
