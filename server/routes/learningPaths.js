const express = require('express');
const LearningPath = require('../models/LearningPath');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/learning-paths
// @desc    Get all public learning paths with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, search, sort = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;
    
    // Build filter query
    const filter = { isPublic: true };
    
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort query
    const sortQuery = {};
    sortQuery[sort] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const learningPaths = await LearningPath.find(filter)
      .populate('createdBy', 'username firstName lastName')
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LearningPath.countDocuments(filter);

    res.json({
      learningPaths,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNextPage: skip + learningPaths.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get learning paths error:', error);
    res.status(500).json({ message: 'Server error fetching learning paths' });
  }
});

// @route   GET /api/learning-paths/categories
// @desc    Get all available categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await LearningPath.distinct('category', { isPublic: true });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// @route   GET /api/learning-paths/my-paths
// @desc    Get user's enrolled learning paths
// @access  Private
router.get('/my-paths', auth, async (req, res) => {
  try {
    const learningPaths = await LearningPath.find({
      'enrollments.userId': req.user._id
    }).populate('createdBy', 'username firstName lastName');

    // Add progress information
    const pathsWithProgress = learningPaths.map(path => {
      const progress = path.getUserProgress(req.user._id);
      const completionPercentage = path.getCompletionPercentage(req.user._id);
      
      return {
        ...path.toObject(),
        userProgress: progress,
        completionPercentage
      };
    });

    res.json(pathsWithProgress);
  } catch (error) {
    console.error('Get user paths error:', error);
    res.status(500).json({ message: 'Server error fetching user paths' });
  }
});

// @route   GET /api/learning-paths/:id
// @desc    Get single learning path
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const learningPath = await LearningPath.findById(req.params.id)
      .populate('createdBy', 'username firstName lastName');

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    // If user is authenticated, include their progress
    let userProgress = null;
    let completionPercentage = 0;
    
    if (req.user) {
      userProgress = learningPath.getUserProgress(req.user._id);
      completionPercentage = learningPath.getCompletionPercentage(req.user._id);
    }

    res.json({
      ...learningPath.toObject(),
      userProgress,
      completionPercentage
    });
  } catch (error) {
    console.error('Get learning path error:', error);
    res.status(500).json({ message: 'Server error fetching learning path' });
  }
});

// @route   POST /api/learning-paths
// @desc    Create new learning path
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const learningPath = new LearningPath({
      ...req.body,
      createdBy: req.user._id
    });

    await learningPath.save();
    await learningPath.populate('createdBy', 'username firstName lastName');

    res.status(201).json({
      message: 'Learning path created successfully',
      learningPath
    });
  } catch (error) {
    console.error('Create learning path error:', error);
    res.status(500).json({ message: 'Server error creating learning path' });
  }
});

// @route   PUT /api/learning-paths/:id
// @desc    Update learning path
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const learningPath = await LearningPath.findById(req.params.id);

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    // Check if user is the creator
    if (learningPath.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this learning path' });
    }

    const updatedPath = await LearningPath.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username firstName lastName');

    res.json({
      message: 'Learning path updated successfully',
      learningPath: updatedPath
    });
  } catch (error) {
    console.error('Update learning path error:', error);
    res.status(500).json({ message: 'Server error updating learning path' });
  }
});

// @route   DELETE /api/learning-paths/:id
// @desc    Delete learning path
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const learningPath = await LearningPath.findById(req.params.id);

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    // Check if user is the creator
    if (learningPath.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this learning path' });
    }

    await LearningPath.findByIdAndDelete(req.params.id);

    res.json({ message: 'Learning path deleted successfully' });
  } catch (error) {
    console.error('Delete learning path error:', error);
    res.status(500).json({ message: 'Server error deleting learning path' });
  }
});

// @route   POST /api/learning-paths/:id/enroll
// @desc    Enroll in a learning path
// @access  Private
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const learningPath = await LearningPath.findById(req.params.id);

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    // Check if already enrolled
    const existingEnrollment = learningPath.enrollments.find(
      enrollment => enrollment.userId.toString() === req.user._id.toString()
    );

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this learning path' });
    }

    // Add enrollment
    learningPath.enrollments.push({
      userId: req.user._id,
      progress: {
        userId: req.user._id,
        completedLessons: [],
        currentModule: 0,
        currentLesson: 0,
        totalTimeSpent: 0,
        lastAccessed: new Date()
      }
    });

    await learningPath.save();

    res.json({ message: 'Successfully enrolled in learning path' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error enrolling in learning path' });
  }
});

// @route   POST /api/learning-paths/:id/unenroll
// @desc    Unenroll from a learning path
// @access  Private
router.post('/:id/unenroll', auth, async (req, res) => {
  try {
    const learningPath = await LearningPath.findById(req.params.id);

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    // Remove enrollment
    learningPath.enrollments = learningPath.enrollments.filter(
      enrollment => enrollment.userId.toString() !== req.user._id.toString()
    );

    await learningPath.save();

    res.json({ message: 'Successfully unenrolled from learning path' });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({ message: 'Server error unenrolling from learning path' });
  }
});

// @route   POST /api/learning-paths/:id/progress
// @desc    Update lesson progress
// @access  Private
router.post('/:id/progress', auth, async (req, res) => {
  try {
    const { lessonId, moduleIndex, lessonIndex, timeSpent, score } = req.body;
    const learningPath = await LearningPath.findById(req.params.id);

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    // Find user's enrollment
    const enrollment = learningPath.enrollments.find(
      e => e.userId.toString() === req.user._id.toString()
    );

    if (!enrollment) {
      return res.status(400).json({ message: 'Not enrolled in this learning path' });
    }

    // Update progress
    const progress = enrollment.progress;
    
    // Check if lesson already completed
    const existingCompletion = progress.completedLessons.find(
      lesson => lesson.lessonId.toString() === lessonId
    );

    if (!existingCompletion) {
      progress.completedLessons.push({
        lessonId,
        completedAt: new Date(),
        score
      });
    }

    // Update current position if this is the next lesson
    if (moduleIndex >= progress.currentModule && lessonIndex >= progress.currentLesson) {
      progress.currentModule = moduleIndex;
      progress.currentLesson = lessonIndex + 1;
      
      // Move to next module if at end of current module
      if (progress.currentLesson >= learningPath.modules[moduleIndex].lessons.length) {
        progress.currentModule = moduleIndex + 1;
        progress.currentLesson = 0;
      }
    }

    progress.totalTimeSpent += timeSpent || 0;
    progress.lastAccessed = new Date();

    await learningPath.save();

    const completionPercentage = learningPath.getCompletionPercentage(req.user._id);

    res.json({
      message: 'Progress updated successfully',
      progress,
      completionPercentage
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Server error updating progress' });
  }
});

module.exports = router;