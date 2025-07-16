import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Send, 
  Trash2, 
  Ban, 
  Loader2,
  Download,
  Eye,
  BarChart2,
  Filter
} from 'lucide-react';
import Navbar from './components/Navbar';
import Button from './components/Button';
import LinkButton from './components/LinkButton';
import { downloadAsPDF, formatDate } from './utils/utils';
import Chart from 'chart.js/auto';

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [shortlistedCandidates, setShortlistedCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filterJobId, setFilterJobId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const chartRef = React.useRef(null);
  const chartInstanceRef = React.useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'recruiter') {
      navigate('/recruiter/login');
      return;
    }

    // Fetch candidates
    fetch(`http://localhost:5000/api/recruiter/analytics/candidates${filterJobId ? `?job_id=${filterJobId}` : ''}${filterStatus ? `&status=${filterStatus}` : ''}`, {
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch candidates');
        return response.json();
      })
      .then((data) => {
        setCandidates(data);
        updateChart(data);
      })
      .catch((err) => setError('Error fetching candidates: ' + err.message));

    // Fetch jobs
    fetch('http://localhost:5000/api/recruiter/analytics/jobs', {
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch jobs');
        return response.json();
      })
      .then((data) => setJobs(data))
      .catch((err) => setError('Error fetching jobs: ' + err.message));
  }, [user, navigate, filterJobId, filterStatus]);

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  const updateChart = (candidates) => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    const ctx = chartRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: candidates.map(c => c.name),
        datasets: [{
          label: 'Assessment Score',
          data: candidates.map(c => c.total_score || 0),
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        }],
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Score (%)' } },
          x: { title: { display: true, text: 'Candidates' } },
        },
      },
    });
  };

  const handleBlockCandidate = async (candidateId, reason) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/recruiter/analytics/candidate/block/${candidateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to block candidate');
      setCandidates(candidates.map(c => 
        c.candidate_id === candidateId ? { ...c, status: 'blocked', block_reason: reason } : c
      ));
      setMessage('Candidate blocked successfully.');
    } catch (err) {
      setError('Error blocking candidate: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendJob = async (jobId, reason) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/recruiter/analytics/job/suspend/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to suspend job');
      setJobs(jobs.map(j => 
        j.job_id === jobId ? { ...j, status: 'suspended', suspension_reason: reason } : j
      ));
      setMessage('Job suspended successfully.');
    } catch (err) {
      setError('Error suspending job: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/recruiter/analytics/job/delete/${jobId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete job');
      setJobs(jobs.filter(j => j.job_id !== jobId));
      setMessage('Job deleted successfully.');
    } catch (err) {
      setError('Error deleting job: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShortlistCandidate = (candidateId) => {
    setShortlistedCandidates(prev => 
      prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleSendEmails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/recruiter/analytics/shortlist/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ candidate_ids: shortlistedCandidates }),
      });
      if (!response.ok) throw new Error('Failed to send emails');
      setMessage('Emails sent to shortlisted candidates.');
      setShortlistedCandidates([]);
    } catch (err) {
      setError('Error sending emails: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = (candidateId) => {
    downloadAsPDF(`candidate-report-${candidateId}`, `Candidate_Report_${candidateId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Navbar />
      <div className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <BarChart2 className="w-8 h-8 mr-2 text-indigo-600 dark:text-indigo-300" />
            Recruitment Analytics
          </h1>

          {error && (
            <div className="mb-6 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-6 p-3 rounded-md bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300 text-sm">
              {message}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Filter by Job
              </label>
              <select
                value={filterJobId}
                onChange={(e) => setFilterJobId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-800 dark:text-gray-200 text-sm"
              >
                <option value="">All Jobs</option>
                {jobs.map(job => (
                  <option key={job.job_id} value={job.job_id}>{job.job_title}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-indigo-600 focus:border-indigo-600 dark:bg-gray-800 dark:text-gray-200 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart2 className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-300" />
              Candidate Performance
            </h2>
            <canvas ref={chartRef} className="max-w-full" />
          </div>

          {/* Candidates Table */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-300" />
              Candidates
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Proctoring</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {candidates.map(candidate => (
                    <tr key={candidate.candidate_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        <LinkButton
                          to={`/recruiter/candidate/${candidate.candidate_id}`}
                          variant="link"
                          className="text-indigo-600 dark:text-indigo-300"
                        >
                          {candidate.name}
                        </LinkButton>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {candidate.job_title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {candidate.total_score ? candidate.total_score.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        <Button
                          variant="link"
                          onClick={() => navigate(`/recruiter/candidate/${candidate.candidate_id}/proctoring`)}
                          className="text-indigo-600 dark:text-indigo-300"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {candidate.status === 'blocked' ? `Blocked: ${candidate.block_reason || 'No reason provided'}` : 'Active'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <input
                          type="checkbox"
                          checked={shortlistedCandidates.includes(candidate.candidate_id)}
                          onChange={() => handleShortlistCandidate(candidate.candidate_id)}
                          className="mr-2"
                        />
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const reason = prompt('Enter reason for blocking:');
                            if (reason) handleBlockCandidate(candidate.candidate_id, reason);
                          }}
                          disabled={candidate.status === 'blocked' || isLoading}
                          className="mr-2"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Block
                        </Button>
                        <Button
                          variant="link"
                          onClick={() => handleDownloadReport(candidate.candidate_id)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Report
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={handleSendEmails}
                disabled={shortlistedCandidates.length === 0 || isLoading}
              >
                <Send className="w-4 h-4 mr-2" />
                Notify Shortlisted
              </Button>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Briefcase className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-300" />
              Job Postings
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {jobs.map(job => (
                    <tr key={job.job_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{job.job_title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{job.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{formatDate(job.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {job.status === 'suspended' ? `Suspended: ${job.suspension_reason || 'No reason provided'}` : 'Active'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const reason = prompt('Enter reason for suspension:');
                            if (reason) handleSuspendJob(job.job_id, reason);
                          }}
                          disabled={job.status === 'suspended' || isLoading}
                          className="mr-2"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Suspend
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this job?')) {
                              handleDeleteJob(job.job_id);
                            }
                          }}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reports Download */}
          <div className="mt-8 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-300" />
              Reports
            </h2>
            <Button
              variant="primary"
              onClick={() => downloadAsPDF('analytics-report', 'Analytics_Report')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Analytics Report
            </Button>
            <div id="analytics-report" className="hidden">
              <h1>Analytics Report</h1>
              <p>Total Candidates: {candidates.length}</p>
              <p>Total Jobs: {jobs.length}</p>
              <p>Shortlisted Candidates: {shortlistedCandidates.length}</p>
              <h2>Candidate Details</h2>
              <ul>
                {candidates.map(c => (
                  <li key={c.candidate_id}>
                    {c.name} - Score: {c.total_score ? c.total_score.toFixed(2) : 'N/A'}% - Status: {c.status}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;