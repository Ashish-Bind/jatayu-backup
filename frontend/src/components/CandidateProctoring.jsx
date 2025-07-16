import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Loader2 } from 'lucide-react';
import Navbar from './Navbar';
import Button from './Button';
import { downloadAsPDF } from '../utils/utils';

const CandidateProctoring = () => {
  const { candidateId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proctoringData, setProctoringData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'recruiter') {
      navigate('/recruiter/login');
      return;
    }

    setIsLoading(true);
    fetch(`http://localhost:5000/api/recruiter/analytics/candidate/${candidateId}/proctoring`, {
      credentials: 'include',
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch proctoring data');
        return response.json();
      })
      .then(data => setProctoringData(data))
      .catch(err => setError('Error fetching proctoring data: ' + err.message))
      .finally(() => setIsLoading(false));
  }, [user, navigate, candidateId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
        <Navbar />
        <div className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!proctoringData || !proctoringData.proctoring_data.length) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
        <Navbar />
        <div className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Proctoring Data for {proctoringData?.name || 'Candidate'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">No proctoring data available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Navbar />
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Proctoring Data for {proctoringData.name}
          </h1>
          {proctoringData.proctoring_data.map(data => (
            <div key={data.attempt_id} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Attempt for {data.job_title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Tab Switches:</strong> {data.tab_switches}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Fullscreen Warnings:</strong> {data.fullscreen_warnings}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Forced Termination:</strong> {data.forced_termination ? `Yes (${data.termination_reason})` : 'No'}
              </p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Remarks</h3>
                {data.remarks.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
                    {data.remarks.map((remark, index) => (
                      <li key={index}>{remark}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300">No remarks available.</p>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Snapshots</h3>
                {data.snapshots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    {data.snapshots.map((snapshot, index) => (
                      <div key={index} className="relative">
                        <img
                          src={`/static/uploads/${snapshot.path}`}
                          alt={`Snapshot ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <span className="absolute top-2 left-2 text-sm text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                          {snapshot.is_valid ? 'Valid' : 'Invalid'} - {snapshot.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300">No snapshots available.</p>
                )}
              </div>
            </div>
          ))}
          <Button
            variant="primary"
            onClick={() => downloadAsPDF(`proctoring-report-${candidateId}`, `Proctoring_Report_${candidateId}`)}
            className="mt-4"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Proctoring Report
          </Button>
          <div id={`proctoring-report-${candidateId}`} className="hidden">
            <h1>Proctoring Report for {proctoringData.name}</h1>
            {proctoringData.proctoring_data.map(data => (
              <div key={data.attempt_id}>
                <h2>Attempt for {data.job_title}</h2>
                <p>Tab Switches: {data.tab_switches}</p>
                <p>Fullscreen Warnings: {data.fullscreen_warnings}</p>
                <p>Forced Termination: {data.forced_termination ? `Yes (${data.termination_reason})` : 'No'}</p>
                <p>Remarks: {data.remarks.length ? data.remarks.join('; ') : 'None'}</p>
                <p>Snapshots: {data.snapshots.length}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProctoring;