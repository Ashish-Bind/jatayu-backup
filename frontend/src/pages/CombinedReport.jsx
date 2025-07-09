import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Briefcase, X, ChevronRight, Download } from 'lucide-react'
import Navbar from '../components/Navbar'
import { downloadAsPDF } from '../utils/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const CombinedReport = () => {
  const { job_id } = useParams()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/recruiter/combined-report/${job_id}`, {
        withCredentials: true,
      })
      .then((response) => {
        setReport(response.data)
      })
      .catch((error) => {
        console.error('Error fetching report:', error)
        setError(error.response?.data?.error || 'Failed to fetch report')
      })
  }, [job_id])

  const handleDownloadReport = () => {
    downloadAsPDF('report-section', `Combined_Report_${job_id}`)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 mb-6 rounded-md text-sm flex items-center gap-2"
            role="alert"
          >
            <X className="w-4 h-4" />
            {error}
          </div>
          <Link
            to="/recruiter/dashboard"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium text-sm"
          >
            Back to Dashboard
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    )
  }

  if (!report)
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-700 dark:text-gray-200 text-sm">
          Loading...
        </div>
      </div>
    )

  const chartData = {
    labels: report.candidates.map((candidate) => candidate.name),
    datasets: [
      {
        label: 'Pre-Assessment Score',
        data: report.candidates.map((candidate) => candidate.pre_score),
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
      {
        label: 'Post-Assessment Score',
        data: report.candidates.map((candidate) => candidate.post_score),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
      {
        label: 'Combined Score',
        data: report.candidates.map((candidate) => candidate.combined_score),
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
          },
          color: '#374151',
          colorDark: '#D1D5DB', // gray-300 for dark mode
        },
      },
      title: {
        display: true,
        text: `Combined Scores for ${report.job_title}`,
        font: {
          size: 18,
          weight: '600',
        },
        color: '#111827',
        colorDark: '#F3F4F6', // gray-100 for dark mode
        padding: {
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          color: '#374151',
          colorDark: '#D1D5DB',
        },
        grid: {
          color: '#E5E7EB',
          colorDark: '#4B5563', // gray-600 for dark mode
        },
      },
      x: {
        ticks: {
          color: '#374151',
          colorDark: '#D1D5DB',
        },
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Combined Report for {report.job_title}
        </h1>
        <div className="flex justify-between items-center mb-6">
          <Link
            to="/recruiter/dashboard"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium text-sm"
          >
            Back to Dashboard
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
          <button
            onClick={handleDownloadReport}
            className="flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 dark:focus:ring-offset-gray-800 gap-2"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>

        {report.candidates.length > 0 ? (
          <div id="report-section">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-8">
              <Bar data={chartData} options={chartOptions} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-8 overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                      Rank
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                      Name
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                      Email
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                      Status
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                      Pre-Score
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                      Post-Score
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                      Combined Score
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                      Questions Attempted
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                      Avg Time/Question (s)
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                      Final Bands
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.candidates.map((candidate) => (
                    <tr
                      key={candidate.candidate_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        {candidate.rank}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        {candidate.name}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        {candidate.email}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        {candidate.status}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        {candidate.pre_score}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        {candidate.post_score}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        {candidate.combined_score}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        {candidate.total_questions}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        {candidate.avg_time_per_question}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                        {Object.entries(candidate.final_bands).map(
                          ([skill, band]) => (
                            <span key={skill} className="mr-2">
                              {skill}: {band}
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.candidates.map((candidate) => (
                <div
                  key={candidate.candidate_id}
                  className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-md">
                      <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Rank {candidate.rank}: {candidate.name}
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-200">
                        Email: {candidate.email}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                    <p>Status: {candidate.status}</p>
                    <p>Pre-Assessment Score: {candidate.pre_score}</p>
                    <p>Post-Assessment Score: {candidate.post_score}</p>
                    <p>Combined Score: {candidate.combined_score}</p>
                    <p>Questions Attempted: {candidate.total_questions}</p>
                    <p>Avg Time/Question: {candidate.avg_time_per_question}s</p>
                    <p>
                      Final Bands:{' '}
                      {Object.entries(candidate.final_bands).map(
                        ([skill, band]) => (
                          <span key={skill} className="mr-2">
                            {skill}: {band}
                          </span>
                        )
                      )}
                    </p>
                    {candidate.description && <p>{candidate.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-700 dark:text-gray-200">
              No candidates found.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CombinedReport
