const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  content: String,
  type: {
    type: String,
    enum: ['video', 'article', 'quiz', 'exercise', 'project'],
    required: true
  },
  duration: Number, // in minutes
  resources: [{
    title: String,
    url: String,
    type: String
  }],
  order: {
    type: Number,
    required: true
  }
});

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  lessons: [lessonSchema],
  order: {
    type: Number,
    required: true
  },
  estimatedDuration: Number // in minutes
});

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedLessons: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    completedAt: {
      type: Date,
      default: Date.now
    },
    score: Number // for quizzes
  }],
  currentModule: {
    type: Number,
    default: 0
  },
  currentLesson: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
});

const learningPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  tags: [String],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  estimatedDuration: {
    type: Number,
    required: true // total duration in minutes
  },
  modules: [moduleSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  enrollments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: progressSchema
  }],
  prerequisites: [String],
  learningOutcomes: [String],
  aiGenerated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
learningPathSchema.index({ category: 1, difficulty: 1 });
learningPathSchema.index({ tags: 1 });
learningPathSchema.index({ 'rating.average': -1 });

// Method to get user's progress
learningPathSchema.methods.getUserProgress = function(userId) {
  const enrollment = this.enrollments.find(e => e.userId.toString() === userId.toString());
  return enrollment ? enrollment.progress : null;
};

// Method to calculate completion percentage
learningPathSchema.methods.getCompletionPercentage = function(userId) {
  const progress = this.getUserProgress(userId);
  if (!progress) return 0;
  
  const totalLessons = this.modules.reduce((total, module) => total + module.lessons.length, 0);
  const completedLessons = progress.completedLessons.length;
  
  return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
};

module.exports = mongoose.model('LearningPath', learningPathSchema);