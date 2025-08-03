import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Learning Profile
    skillLevel: 'beginner',
    learningGoals: [],
    interests: [],
    learningStyle: 'visual',
    timeCommitment: 30
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addGoal = (e) => {
    if (e.key === 'Enter' && goalInput.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        learningGoals: [...prev.learningGoals, goalInput.trim()]
      }));
      setGoalInput('');
    }
  };

  const removeGoal = (index) => {
    setFormData(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.filter((_, i) => i !== index)
    }));
  };

  const addInterest = (e) => {
    if (e.key === 'Enter' && interestInput.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }));
      setInterestInput('');
    }
  };

  const removeInterest = (index) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      handleNext();
      return;
    }
    
    setIsLoading(true);
    
    try {
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        learningGoals: formData.learningGoals,
        skillLevel: formData.skillLevel,
        interests: formData.interests,
        preferences: {
          learningStyle: formData.learningStyle,
          timeCommitment: parseInt(formData.timeCommitment)
        }
      };

      const result = await register(registrationData);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Your Account</h1>
          <p>Step {step} of 2: {step === 1 ? 'Basic Information' : 'Learning Preferences'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.general && (
            <div className="error-banner">
              {errors.general}
            </div>
          )}

          {step === 1 ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? 'error' : ''}
                    placeholder="Enter your first name"
                    disabled={isLoading}
                  />
                  {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? 'error' : ''}
                    placeholder="Enter your last name"
                    disabled={isLoading}
                  />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={errors.username ? 'error' : ''}
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="Create a password"
                  disabled={isLoading}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="skillLevel">Current Skill Level</label>
                <select
                  id="skillLevel"
                  name="skillLevel"
                  value={formData.skillLevel}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="beginner">Beginner - Just starting out</option>
                  <option value="intermediate">Intermediate - Some experience</option>
                  <option value="advanced">Advanced - Highly experienced</option>
                </select>
              </div>

              <div className="form-group">
                <label>Learning Goals</label>
                <div className="tags-input">
                  {formData.learningGoals.map((goal, index) => (
                    <span key={index} className="tag">
                      {goal}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => removeGoal(index)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="tag-input"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={addGoal}
                    placeholder="Type a goal and press Enter"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Interests</label>
                <div className="tags-input">
                  {formData.interests.map((interest, index) => (
                    <span key={index} className="tag">
                      {interest}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => removeInterest(index)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="tag-input"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={addInterest}
                    placeholder="Type an interest and press Enter"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="learningStyle">Preferred Learning Style</label>
                <select
                  id="learningStyle"
                  name="learningStyle"
                  value={formData.learningStyle}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="visual">Visual - Learn through images and diagrams</option>
                  <option value="auditory">Auditory - Learn through listening</option>
                  <option value="kinesthetic">Kinesthetic - Learn through hands-on experience</option>
                  <option value="reading">Reading/Writing - Learn through text</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="timeCommitment">Daily Time Commitment (minutes)</label>
                <select
                  id="timeCommitment"
                  name="timeCommitment"
                  value={formData.timeCommitment}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {step === 2 && (
              <button
                type="button"
                onClick={handleBack}
                className="auth-submit-btn"
                style={{ background: '#6c757d' }}
                disabled={isLoading}
              >
                Back
              </button>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              {isLoading ? (
                <span className="loading-spinner">
                  🔄 Creating account...
                </span>
              ) : step === 1 ? (
                'Next Step'
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;