import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap,
  BarChart2,
  Shield,
  FileText,
  Clock,
  Smartphone,
  Github,
  Twitter,
  Linkedin,
  Facebook,
  Mail,
  ChevronRight,
  ArrowRight,
  Star,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import LinkButton from '../components/LinkButton'
import { motion, useInView } from 'motion/react'

const Home = () => {
  const featuresRef = useRef(null)
  const howItWorksRef = useRef(null)
  const testimonialsRef = useRef(null)

  // Define scroll handler functions
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  const scrollToTestimonials = () => {
    testimonialsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // UseInView for scroll-triggered animations
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.3 })
  const howItWorksInView = useInView(howItWorksRef, { once: true, amount: 0.3 })
  const testimonialsInView = useInView(testimonialsRef, {
    once: true,
    amount: 0.3,
  })

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.3, yoyo: Infinity },
    },
  }

  // Testimonial data
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'HR Director, TechCorp',
      content:
        'AI Quiz has revolutionized our hiring process. The adaptive testing saves us 40% of screening time while improving candidate quality.',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      rating: 5,
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Professor, State University',
      content:
        'The skill gap analysis is incredibly accurate. My students get personalized feedback that helps them focus their studies effectively.',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      rating: 5,
    },
    {
      id: 3,
      name: 'David Wilson',
      role: 'Candidate, Software Engineer',
      content:
        'Finally an assessment that adapts to my skill level! The questions were challenging but fair, and the feedback was actually useful.',
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      rating: 4,
    },
  ]

  // Features data
  const features = [
    {
      title: 'Adaptive MCQs',
      description:
        'AI-generated questions that adapt to candidate skill level in real-time.',
      icon: <Zap className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />,
    },
    {
      title: 'Skill Gap Analysis',
      description:
        'Comprehensive reports showing strengths and areas for improvement.',
      icon: (
        <BarChart2 className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
      ),
    },
    {
      title: 'Secure Proctoring',
      description: 'AI-powered cheating detection with facial recognition.',
      icon: <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />,
    },
    {
      title: 'Detailed Reports',
      description: 'Actionable insights with visual data representations.',
      icon: (
        <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
      ),
    },
    {
      title: 'Time Efficient',
      description: '50% faster assessments with same accuracy.',
      icon: <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />,
    },
    {
      title: 'Mobile Friendly',
      description: 'Fully responsive design works on any device.',
      icon: (
        <Smartphone className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
      ),
    },
  ]

  // Steps data
  const steps = [
    {
      number: 1,
      title: 'Submit Profile',
      description: 'Candidate uploads resume or profile',
    },
    {
      number: 2,
      title: 'Skill Analysis',
      description: 'AI identifies skill gaps and strengths',
    },
    {
      number: 3,
      title: 'Adaptive Quiz',
      description: 'Personalized questions based on skill level',
    },
    {
      number: 4,
      title: 'Get Results',
      description: 'Detailed report with actionable insights',
    },
  ]

  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <Navbar
        scrollToFeatures={scrollToFeatures}
        scrollToHowItWorks={scrollToHowItWorks}
        scrollToTestimonials={scrollToTestimonials}
      />

      {/* Hero Section */}
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="text-center">
          <motion.h1
            className="font-mono text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Intelligent MCQ Generation <br />& Assessment Platform
          </motion.h1>
          <motion.p
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Revolutionizing recruitment and education with AI-powered adaptive
            testing, skill gap analysis, and secure proctoring.
          </motion.p>

          <motion.div
            className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {user ? (
              <motion.div variants={itemVariants}>
                <LinkButton
                  to="/candidate/dashboard"
                  variant="primary"
                  className="flex items-center gap-2 justify-center"
                  whileHover="hover"
                  variants={buttonVariants}
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </LinkButton>
              </motion.div>
            ) : (
              <>
                <motion.div variants={itemVariants}>
                  <LinkButton
                    to="/candidate/signup"
                    variant="primary"
                    className="flex items-center gap-2 justify-center"
                    whileHover="hover"
                    variants={buttonVariants}
                  >
                    Get Started as Candidate <ArrowRight className="w-4 h-4" />
                  </LinkButton>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <LinkButton
                    to="/recruiter/login"
                    variant="bordered"
                    className="text-indigo-600 dark:text-indigo-300 border-indigo-600 dark:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900"
                    whileHover="hover"
                    variants={buttonVariants}
                  >
                    Recruiter Login <ChevronRight className="w-4 h-4" />
                  </LinkButton>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div
        id="features"
        className="py-16 bg-indigo-50 dark:bg-gray-900"
        ref={featuresRef}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            animate={featuresInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to transform your assessment process
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-mono font-medium text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* How It Works Section */}
      <div
        id="how-it-works"
        className="py-16 bg-white dark:bg-gray-800"
        ref={howItWorksRef}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            animate={howItWorksInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Simple steps to better assessments
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={howItWorksInView ? 'visible' : 'hidden'}
          >
            {steps.map((step) => (
              <motion.div
                key={step.number}
                className="text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 dark:text-indigo-300 font-bold text-xl">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div
        id="testimonials"
        className="py-16 bg-indigo-50 dark:bg-gray-900"
        ref={testimonialsRef}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            animate={testimonialsInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              What Our Users Say
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Don't just take our word for it
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={testimonialsInView ? 'visible' : 'hidden'}
          >
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">
                  "{testimonial.content}"
                </p>
                <div className="mt-4 flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  {[...Array(5 - testimonial.rating)].map((_, i) => (
                    <Star
                      key={i + testimonial.rating}
                      className="w-5 h-5 text-gray-300 dark:text-gray-600"
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        className="py-16 bg-indigo-600 dark:bg-indigo-800 text-white"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-3xl font-bold mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Ready to Transform Your Assessments?
          </motion.h2>
          <motion.p
            className="text-xl mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Join thousands of organizations using AI Quiz to make better hiring
            and education decisions.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <Link
                to="/recruiter/login"
                className="px-6 py-3 rounded-md text-sm font-medium text-indigo-600 dark:text-indigo-300 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
                whileHover="hover"
                variants={buttonVariants}
              >
                Request Demo <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Link
                to="/candidate/signup"
                className="px-6 py-3 rounded-md text-sm font-medium text-white bg-indigo-800 dark:bg-indigo-900 hover:bg-indigo-700 dark:hover:bg-indigo-800 flex items-center justify-center gap-2"
                whileHover="hover"
                variants={buttonVariants}
              >
                Try for Free <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="bg-gray-900 dark:bg-gray-950 text-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-300 tracking-wider uppercase mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#features"
                    className="text-gray-300 dark:text-gray-200 hover:text-white"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-gray-300 dark:text-gray-200 hover:text-white"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-gray-300 dark:text-gray-200 hover:text-white"
                  >
                    Testimonials
                  </a>
                </li>
              </ul>
            </motion.div>
            <motion.div variants={itemVariants}>
              <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-300 tracking-wider uppercase mb-4">
                Connect
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-300 dark:text-gray-200 hover:text-white flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 dark:text-gray-200 hover:text-white flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" /> Contact
                  </a>
                </li>
              </ul>
            </motion.div>
          </motion.div>
          <motion.div
            className="mt-12 pt-8 border-t border-gray-800 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p
              className="text-gray-400 dark:text-gray-300 text-sm"
              variants={itemVariants}
            >
              © {new Date().getFullYear()} AI Quiz. All rights reserved.
            </motion.p>
            <motion.div
              className="mt-4 md:mt-0 flex space-x-6"
              variants={containerVariants}
            >
              <motion.a
                href="#"
                className="text-gray-400 dark:text-gray-300 hover:text-white"
                variants={itemVariants}
                whileHover={{ scale: 1.2 }}
              >
                <span className="sr-only">GitHub</span>
                <Github className="h-6 w-6" />
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  )
}

export default Home
