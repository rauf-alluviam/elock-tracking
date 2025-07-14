import React from 'react';
import { useParams } from 'react-router-dom';
import ElockGPSOperation from '../components/ElockGPSOperation';

const ElockGPSOperationPage = () => {
  const { elockNo } = useParams();
  return (
    <div className="min-h-screen bg-gray-50">
      <ElockGPSOperation isOpen={true} onClose={() => {}} elockNo={elockNo} />
    </div>
  );
};

export default ElockGPSOperationPage;
