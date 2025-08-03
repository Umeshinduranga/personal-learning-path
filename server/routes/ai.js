const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const LearningPath = require('../models/LearningPath');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize AI clients
const genAI = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// @route   POST /api/ai/generate-path
// @desc    Generate personalized learning path using AI
// @access  Private
router.post('/generate-path', auth, async (req, res) => {
  try {
    const { topic, goals, timeCommitment, currentLevel } = req.body;
    const user = req.user;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    // Create prompt based on user preferences and input
    const prompt = `Create a comprehensive learning path for "${topic}" with the following requirements:

User Profile:
- Current Level: ${currentLevel || user.skillLevel}
- Learning Goals: ${goals || user.learningGoals.join(', ')}
- Time Commitment: ${timeCommitment || user.preferences?.timeCommitment || 30} minutes per day
- Learning Style: ${user.preferences?.learningStyle || 'visual'}
- Interests: ${user.interests.join(', ')}

Please structure the response as a JSON object with the following format:
{
  "title": "Learning Path Title",
  "description": "Brief description of what the learner will achieve",
  "category": "Primary category",
  "difficulty": "beginner/intermediate/advanced",
  "estimatedDuration": total_minutes,
  "tags": ["tag1", "tag2", "tag3"],
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "learningOutcomes": ["outcome1", "outcome2", "outcome3"],
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "order": 1,
      "estimatedDuration": module_minutes,
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Lesson description",
          "content": "Detailed lesson content",
          "type": "video/article/quiz/exercise/project",
          "duration": lesson_minutes,
          "order": 1,
          "resources": [
            {
              "title": "Resource Title",
              "url": "https://example.com",
              "type": "video/article/tool"
            }
          ]
        }
      ]
    }
  ]
}

Make sure the path is practical, well-structured, and appropriate for the user's level and goals.`;

    let aiResponse;

    try {
      // Try Google AI first
      if (genAI) {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiResponse = response.text();
      } 
      // Fallback to OpenAI
      else if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert educational content creator. Create comprehensive, structured learning paths in JSON format."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000
        });
        aiResponse = completion.choices[0].message.content;
      } else {
        // Fallback: Generate a basic learning path structure
        aiResponse = JSON.stringify({
          title: `Learn ${topic}`,
          description: `Comprehensive learning path for mastering ${topic}`,
          category: "General",
          difficulty: currentLevel || user.skillLevel,
          estimatedDuration: (timeCommitment || 30) * 30, // 30 days estimate
          tags: [topic.toLowerCase(), currentLevel || user.skillLevel],
          prerequisites: [],
          learningOutcomes: [
            `Understand the fundamentals of ${topic}`,
            `Apply ${topic} concepts in practical scenarios`,
            `Build confidence in ${topic} skills`
          ],
          modules: [
            {
              title: `Introduction to ${topic}`,
              description: `Get started with ${topic} basics`,
              order: 1,
              estimatedDuration: (timeCommitment || 30) * 7,
              lessons: [
                {
                  title: `What is ${topic}?`,
                  description: `Overview and introduction to ${topic}`,
                  content: `Learn the fundamental concepts and principles of ${topic}.`,
                  type: "article",
                  duration: timeCommitment || 30,
                  order: 1,
                  resources: [
                    {
                      title: `${topic} Documentation`,
                      url: "https://example.com",
                      type: "article"
                    }
                  ]
                }
              ]
            }
          ]
        });
      }

      // Parse and validate AI response
      let pathData;
      try {
        // Extract JSON from response if it's wrapped in markdown or other text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
        pathData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('Invalid AI response format');
      }

      // Create learning path
      const learningPath = new LearningPath({
        ...pathData,
        createdBy: user._id,
        aiGenerated: true,
        isPublic: false // Make it private initially
      });

      await learningPath.save();
      await learningPath.populate('createdBy', 'username firstName lastName');

      res.status(201).json({
        message: 'AI-generated learning path created successfully',
        learningPath
      });

    } catch (aiError) {
      console.error('AI generation error:', aiError);
      res.status(500).json({ 
        message: 'Error generating learning path with AI',
        error: aiError.message 
      });
    }

  } catch (error) {
    console.error('Generate path error:', error);
    res.status(500).json({ message: 'Server error generating learning path' });
  }
});

// @route   POST /api/ai/recommendations
// @desc    Get personalized learning path recommendations
// @access  Private
router.post('/recommendations', auth, async (req, res) => {
  try {
    const user = req.user;
    const { limit = 5 } = req.body;

    // Get user's completed and enrolled paths
    const userPaths = await LearningPath.find({
      'enrollments.userId': user._id
    });

    const completedCategories = [];
    const interests = user.interests || [];
    const skillLevel = user.skillLevel || 'beginner';

    // Analyze user's learning history
    userPaths.forEach(path => {
      const completion = path.getCompletionPercentage(user._id);
      if (completion > 70) {
        completedCategories.push(path.category);
      }
    });

    // Build recommendation query
    const recommendationQuery = {
      isPublic: true,
      'enrollments.userId': { $ne: user._id }, // Not already enrolled
    };

    // Include user interests and skill-appropriate paths
    if (interests.length > 0) {
      recommendationQuery.$or = [
        { category: { $in: interests } },
        { tags: { $in: interests } },
        { difficulty: skillLevel }
      ];
    }

    // Find recommended paths
    const recommendations = await LearningPath.find(recommendationQuery)
      .populate('createdBy', 'username firstName lastName')
      .sort({ 'rating.average': -1, createdAt: -1 })
      .limit(parseInt(limit));

    // Use AI to enhance recommendations if available
    if ((genAI || openai) && recommendations.length > 0) {
      try {
        const pathTitles = recommendations.map(p => p.title).join(', ');
        const prompt = `Based on a user with these characteristics:
- Skill Level: ${skillLevel}
- Interests: ${interests.join(', ')}
- Completed Categories: ${completedCategories.join(', ')}
- Learning Goals: ${user.learningGoals?.join(', ') || 'General skill development'}

Rank these learning paths in order of recommendation (1 being most recommended): ${pathTitles}

Provide a brief explanation for each ranking in JSON format:
{
  "rankings": [
    {
      "title": "Path Title",
      "rank": 1,
      "reason": "Why this path is recommended for this user"
    }
  ]
}`;

        let aiResponse;
        if (genAI) {
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          aiResponse = response.text();
        } else if (openai) {
          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 1000
          });
          aiResponse = completion.choices[0].message.content;
        }

        // Parse AI rankings
        const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const rankings = JSON.parse(jsonMatch[0]);
          
          // Apply AI rankings to recommendations
          const rankedRecommendations = rankings.rankings
            .map(ranking => {
              const path = recommendations.find(p => p.title === ranking.title);
              return path ? { ...path.toObject(), aiReason: ranking.reason, aiRank: ranking.rank } : null;
            })
            .filter(Boolean);

          return res.json({
            recommendations: rankedRecommendations,
            aiEnhanced: true
          });
        }
      } catch (aiError) {
        console.error('AI recommendation enhancement error:', aiError);
        // Continue with basic recommendations
      }
    }

    res.json({
      recommendations,
      aiEnhanced: false
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error getting recommendations' });
  }
});

// @route   POST /api/ai/study-plan
// @desc    Generate a personalized study plan
// @access  Private
router.post('/study-plan', auth, async (req, res) => {
  try {
    const user = req.user;
    const { pathId, targetDate, dailyTimeCommitment } = req.body;

    if (!pathId) {
      return res.status(400).json({ message: 'Learning path ID is required' });
    }

    const learningPath = await LearningPath.findById(pathId);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    const userProgress = learningPath.getUserProgress(user._id);
    const timeCommitment = dailyTimeCommitment || user.preferences?.timeCommitment || 30;
    
    // Calculate remaining content
    const totalLessons = learningPath.modules.reduce((total, module) => total + module.lessons.length, 0);
    const completedLessons = userProgress?.completedLessons?.length || 0;
    const remainingLessons = totalLessons - completedLessons;
    
    const estimatedRemainingTime = learningPath.estimatedDuration * (remainingLessons / totalLessons);
    const daysNeeded = Math.ceil(estimatedRemainingTime / timeCommitment);

    // Generate study plan structure
    const studyPlan = {
      pathTitle: learningPath.title,
      totalLessons,
      completedLessons,
      remainingLessons,
      estimatedRemainingTime,
      dailyTimeCommitment: timeCommitment,
      estimatedCompletionDays: daysNeeded,
      targetDate: targetDate ? new Date(targetDate) : new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000),
      dailySchedule: [],
      recommendations: []
    };

    // Create daily schedule
    let currentDate = new Date();
    let remainingTime = estimatedRemainingTime;
    let moduleIndex = userProgress?.currentModule || 0;
    let lessonIndex = userProgress?.currentLesson || 0;

    while (remainingTime > 0 && moduleIndex < learningPath.modules.length) {
      const module = learningPath.modules[moduleIndex];
      const dailyLessons = [];
      let dailyTime = 0;

      // Fill the day with lessons
      while (dailyTime < timeCommitment && lessonIndex < module.lessons.length) {
        const lesson = module.lessons[lessonIndex];
        const lessonTime = lesson.duration || 30;
        
        if (dailyTime + lessonTime <= timeCommitment + 15) { // Allow 15min flexibility
          dailyLessons.push({
            moduleTitle: module.title,
            lessonTitle: lesson.title,
            duration: lessonTime,
            type: lesson.type
          });
          dailyTime += lessonTime;
          remainingTime -= lessonTime;
          lessonIndex++;
        } else {
          break;
        }
      }

      // Move to next module if current is complete
      if (lessonIndex >= module.lessons.length) {
        moduleIndex++;
        lessonIndex = 0;
      }

      if (dailyLessons.length > 0) {
        studyPlan.dailySchedule.push({
          date: new Date(currentDate),
          lessons: dailyLessons,
          totalTime: dailyTime
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add AI-generated study tips if available
    if (genAI || openai) {
      try {
        const tipsPrompt = `Generate 3-5 study tips for someone learning "${learningPath.title}" with these characteristics:
- Learning style: ${user.preferences?.learningStyle || 'visual'}
- Skill level: ${user.skillLevel}
- Daily time commitment: ${timeCommitment} minutes
- Completion goal: ${daysNeeded} days

Provide practical, actionable tips in JSON format:
{
  "tips": ["tip1", "tip2", "tip3"]
}`;

        let aiResponse;
        if (genAI) {
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent(tipsPrompt);
          const response = await result.response;
          aiResponse = response.text();
        } else if (openai) {
          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: tipsPrompt }],
            temperature: 0.7,
            max_tokens: 500
          });
          aiResponse = completion.choices[0].message.content;
        }

        const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const tips = JSON.parse(jsonMatch[0]);
          studyPlan.recommendations = tips.tips || [];
        }
      } catch (aiError) {
        console.error('AI study tips error:', aiError);
      }
    }

    res.json({
      message: 'Study plan generated successfully',
      studyPlan
    });

  } catch (error) {
    console.error('Generate study plan error:', error);
    res.status(500).json({ message: 'Server error generating study plan' });
  }
});

module.exports = router;