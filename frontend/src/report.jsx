import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  CheckCircle,
  BarChart2,
  Star,
  BookOpen,
  TrendingUp,
  Download,
  Home,
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Navbar from './components/Navbar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Report = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const userId = new URLSearchParams(window.location.search).get('user_id');
    fetch(`http://localhost:5000/api/candidate/report/${attemptId}?user_id=${userId}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setReport(data))
      .catch((error) => {
        console.error('Error fetching report:', error);
        setErrorMessage(`Failed to load report: ${error.message}`);
      });
  }, [attemptId]);

  const downloadReport = () => {
    const input = document.getElementById('report-section');
    if (!input) return;

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Assessment_Report_${attemptId}.pdf`);
    });
  };

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-red-700 text-lg">{errorMessage}</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="text-gray-700 text-lg">Loading...</div>
      </div>
    );
  }

  const { candidate_report, total_questions, job_title, company } = report;
  const totalAttempted = Object.values(candidate_report).reduce(
    (sum, stats) => sum + stats.questions_attempted,
    0
  );
  const totalCorrect = Object.values(candidate_report).reduce(
    (sum, stats) => sum + stats.correct_answers,
    0
  );
  const overallAccuracy =
    totalAttempted > 0 ? ((totalCorrect / totalAttempted) * 100).toFixed(2) : 0;

  const chartData = {
    labels: Object.keys(candidate_report).map((skill) => skill.replace('_', ' ')),
    datasets: [
      {
        label: 'Accuracy (%)',
        data: Object.values(candidate_report).map((stats) => stats.accuracy_percent),
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(79, 70, 229, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      title: {
        display: true,
        text: 'Skill-wise Accuracy',
        font: { size: 16, weight: 'bold' },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: { backgroundColor: '#1f2937', titleFont: { size: 12 } },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Accuracy (%)', font: { size: 12 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      x: {
        title: { display: true, text: 'Skills', font: { size: 12 } },
        grid: { display: false },
      },
    },
    animation: { duration: 1000, easing: 'easeInOutQuad' },
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar userType="candidate" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-indigo-600" />
          Assessment Report
        </h1>
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-200 mb-8" id="report-section">
          <p className="text-green-700 text-sm font-medium mb-6 flex items-center gap-2">
            <Star className="w-4 h-4 text-indigo-600" />
            Report for {job_title} at {company}
          </p>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                Performance Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 p-5 rounded-md border border-gray-200 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Questions Attempted
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {totalAttempted} / {total_questions}
                  </p>
                </div>
                <div className="bg-indigo-50 p-5 rounded-md border border-gray-200 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    Correct Answers
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {totalCorrect}
                  </p>
                </div>
                <div className="bg-indigo-50 p-5 rounded-md border border-gray-200 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    Overall Accuracy
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {overallAccuracy}%
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Skill-wise Breakdown
              </h3>
              <div className="space-y-4">
                {Object.entries(candidate_report).map(([skill, stats]) => (
                  <div
                    key={skill}
                    className="bg-white p-5 rounded-md border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 text-indigo-600" />
                      {skill.replace('_', ' ')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <p className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          Questions Attempted: {stats.questions_attempted}
                        </p>
                        <p className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-indigo-600" />
                          Correct Answers: {stats.correct_answers}
                        </p>
                      </div>
                      <div>
                        <p className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-indigo-600" />
                          Accuracy: {stats.accuracy_percent}%
                        </p>
                        <p className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-indigo-600" />
                          Performance Band:{' '}
                          <span className="capitalize">{stats.final_band}</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-in-out"
                          style={{ width: `${stats.accuracy_percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                Performance Visualization
              </h3>
              <div className="bg-white p-5 rounded-md border border-gray-200">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Insights & Recommendations
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                {Object.entries(candidate_report).map(([skill, stats]) => (
                  <li key={skill} className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-indigo-600 mt-1" />
                    <span>
                      <span className="font-semibold">
                        {skill.replace('_', ' ')}:
                      </span>{' '}
                      {stats.accuracy_percent >= 80
                        ? `Excellent performance! Consider advanced roles requiring ${skill.replace(
                            '_',
                            ' '
                          )}.`
                        : stats.accuracy_percent >= 50
                        ? `Good effort. Review ${skill.replace(
                            '_',
                            ' '
                          )} concepts to boost your score.`
                        : `Focus on ${skill.replace(
                            '_',
                            ' '
                          )} fundamentals to improve your performance.`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              onClick={downloadReport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 gap-2"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
            <button
              onClick={() => navigate('/candidate/dashboard')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;