import React from 'react';
import { useParams } from 'react-router-dom';

const LearningPath = () => {
  const { id } = useParams();

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Learning Path Details</h1>
      <p>This is a placeholder for the learning path detail page for path ID: {id}</p>
    </div>
  );
};

export default LearningPath;