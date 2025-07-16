import React from 'react'
import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import { BookOpen, User, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const CandidateOverview = () => {
  const { user } = useAuth()
  const { theme } = useContext(ThemeContext)

  const mockCourses = [
    { id: 1, title: 'UI/UX Design', progress: '2/8', image: '/ux-design.jpg' },
    { id: 2, title: 'Branding', progress: '3/8', image: '/branding.jpg' },
    { id: 3, title: 'Front End', progress: '6/12', image: '/frontend.jpg' },
  ]

  const mockLesson = {
    mentor: 'Padhang Satrio',
    date: '2/16/2004',
    title: 'Understand of UI/UX Design',
  }

  const mockMentors = [
    { id: 1, name: 'Padhang Satrio', isMentor: true },
    { id: 2, name: 'Zakir Horizontal', isMentor: true },
    { id: 3, name: 'Leonardo Samsul', isMentor: true },
  ]

  return (
    <>
      <Navbar />
      <div
        className={`min-h-screen transition-colors duration-300 max-w-7xl mx-auto bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex`}
      >
        {/* Sidebar */}
        <div className="w-64 p-6 space-y-4">
          <h1 className="text-2xl font-bold text-indigo-600">Course</h1>
          <nav className="space-y-2">
            {[
              'Dashboard',
              'Inbox',
              'Lesson',
              'Task',
              'Group',
              'Friends',
              'Settings',
              'Logout',
            ].map((item) => (
              <button
                key={item}
                className="w-full text-left p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                {item}
              </button>
            ))}
          </nav>
          <div>
            <h3 className="text-sm font-medium">Friends</h3>
            {['Bagas Mahpie', 'Sir Dandy', 'Jhon Tosan'].map(
              (friend, index) => (
                <div key={index} className="flex items-center gap-2 p-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full" />
                  <span>{friend}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-6 rounded-lg mb-6 text-center">
            <h2 className="text-xl font-semibold">
              Sharpen Your Skills with Professional Online Courses
            </h2>
            <button className="mt-4 px-4 py-2 bg-black text-white rounded">
              Join Now
            </button>
          </div>

          {/* Continue Watching */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Continue Watching
            </h3>
            <div className="flex gap-4 overflow-x-auto">
              {mockCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex-shrink-0"
                >
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-32 h-20 object-cover rounded mb-2"
                  />
                  <p className="text-sm font-medium">{course.title}</p>
                  <p className="text-xs text-gray-500">{course.progress}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Your Lesson */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Your Lesson
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-300 rounded-full" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {mockLesson.mentor}
                </p>
                <p className="text-xs text-gray-500">{mockLesson.date}</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {mockLesson.title}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-64 p-6 space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {user?.name || 'Jason Ranti'}
            </h3>
            <p className="text-xs text-indigo-600">32% Complete</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Good Morning {user?.name || 'Jason'} 🔥
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Your Mentor
            </h3>
            {mockMentors.map((mentor) => (
              <div key={mentor.id} className="flex items-center gap-2 p-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full" />
                <span className="text-gray-900 dark:text-gray-100">
                  {mentor.name}
                </span>
                <button className="ml-auto text-indigo-600 hover:text-indigo-800">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default CandidateOverview
