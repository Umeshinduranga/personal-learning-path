import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Personalized Learning Paths
            <span className="hero-subtitle">Powered by AI</span>
          </h1>
          <p className="hero-description">
            Discover your potential with AI-generated learning paths tailored to your goals, 
            skill level, and learning style. Track your progress and achieve mastery faster.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <Link to="/browse" className="btn btn-primary">
                  Browse Learning Paths
                </Link>
                <Link to="/ai-generator" className="btn btn-secondary">
                  Generate AI Path
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Get Started Free
                </Link>
                <Link to="/browse" className="btn btn-secondary">
                  Explore Paths
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="learning-visualization">
            <div className="node node-1">📚</div>
            <div className="node node-2">🎯</div>
            <div className="node node-3">🚀</div>
            <div className="connection con-1"></div>
            <div className="connection con-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Our Platform?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Recommendations</h3>
              <p>Our AI analyzes your learning style and goals to create personalized paths that maximize your learning efficiency.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Visualize your learning journey with detailed analytics and progress charts to stay motivated and on track.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Goal-Oriented Learning</h3>
              <p>Set specific learning objectives and receive structured paths designed to help you achieve them efficiently.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Achievement System</h3>
              <p>Earn badges and track milestones as you complete lessons and master new skills.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Learn anywhere, anytime with our responsive design that works perfectly on all devices.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Community Driven</h3>
              <p>Share your learning paths with others and discover curated content from the community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create Your Profile</h3>
                <p>Tell us about your learning goals, current skill level, and preferred learning style.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Get AI Recommendations</h3>
                <p>Our AI generates personalized learning paths or browse community-created paths.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Learn & Progress</h3>
                <p>Follow your path, complete lessons, and track your progress with detailed analytics.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Achieve Mastery</h3>
                <p>Complete your learning goals and continue with advanced paths or new skills.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Start Your Learning Journey?</h2>
          <p>Join thousands of learners who have transformed their skills with our AI-powered platform.</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-primary btn-large">
              Start Learning Today
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;