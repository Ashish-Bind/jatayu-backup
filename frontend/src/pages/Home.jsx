import React, { useRef, useState } from 'react'
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
  Check,
} from 'lucide-react'
import Navbar from '../components/Navbar'

const LandingPage = () => {
  const featuresRef = useRef(null)
  const testimonialsRef = useRef(null)
  const howItWorksRef = useRef(null)

  const scrollToFeatures = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToTestimonials = () => {
    if (testimonialsRef.current) {
      testimonialsRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToHowItWorks = () => {
    if (howItWorksRef.current) {
      howItWorksRef.current.scrollIntoView({ behavior: 'smooth' })
    }
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
      icon: <Zap className="w-8 h-8 text-indigo-600" />,
    },
    {
      title: 'Skill Gap Analysis',
      description:
        'Comprehensive reports showing strengths and areas for improvement.',
      icon: <BarChart2 className="w-8 h-8 text-indigo-600" />,
    },
    {
      title: 'Secure Proctoring',
      description: 'AI-powered cheating detection with facial recognition.',
      icon: <Shield className="w-8 h-8 text-indigo-600" />,
    },
    {
      title: 'Detailed Reports',
      description: 'Actionable insights with visual data representations.',
      icon: <FileText className="w-8 h-8 text-indigo-600" />,
    },
    {
      title: 'Time Efficient',
      description: '50% faster assessments with same accuracy.',
      icon: <Clock className="w-8 h-8 text-indigo-600" />,
    },
    {
      title: 'Mobile Friendly',
      description: 'Fully responsive design works on any device.',
      icon: <Smartphone className="w-8 h-8 text-indigo-600" />,
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

  // Partners data
  // const partners = [
  //   {
  //     name: 'Tech University',
  //     logo: 'https://via.placeholder.com/150x60?text=Tech+Uni',
  //   },
  //   {
  //     name: 'Global Bank',
  //     logo: 'https://via.placeholder.com/150x60?text=Global+Bank',
  //   },
  //   {
  //     name: 'Innovate Corp',
  //     logo: 'https://via.placeholder.com/150x60?text=Innovate',
  //   },
  //   {
  //     name: 'State College',
  //     logo: 'https://via.placeholder.com/150x60?text=State+College',
  //   },
  // ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navbar
        scrollToFeatures={scrollToFeatures}
        scrollToHowItWorks={scrollToHowItWorks}
        scrollToTestimonials={scrollToTestimonials}
      />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="text-center">
          <h1 className="font-mono text-4xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Intelligent MCQ Generation <br />& Assessment Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Revolutionizing recruitment and education with AI-powered adaptive
            testing, skill gap analysis, and secure proctoring.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/candidate/signup"
              className="font-mono px-6 py-3 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              Get Started as Candidate <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/recruiter/login"
              className="font-mono px-6 py-3 rounded-md text-sm font-medium text-indigo-600 bg-white border border-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-2"
            >
              Recruiter Login <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {/* 
          <div className="mt-8">
            <img
              src="https://via.placeholder.com/800x450?text=AI+Quiz+Dashboard+Preview"
              alt="Dashboard preview"
              className="rounded-lg shadow-xl mx-auto border border-gray-200"
            />
          </div> */}
        </div>
      </div>

      {/* Partners Section */}
      {/* <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm uppercase text-gray-500 font-semibold tracking-wide mb-8">
            Trusted by leading organizations worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {partners.map((partner, index) => (
              <div key={index} className="flex justify-center">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-12 object-contain opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* Features Section */}
      <div id="features" className="py-16 bg-indigo-50" ref={featuresRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to transform your assessment process
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-mono font-medium text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-16 bg-white" ref={howItWorksRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to better assessments
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 font-bold text-xl">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div
        id="testimonials"
        className="py-16 bg-indigo-50"
        ref={testimonialsRef}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              What Our Users Say
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
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
                      className="w-5 h-5 text-gray-300"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Assessments?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of organizations using AI Quiz to make better hiring
            and education decisions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/recruiter/login"
              className="px-6 py-3 rounded-md text-sm font-medium text-indigo-600 bg-white hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              Request Demo <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/candidate/signup"
              className="px-6 py-3 rounded-md text-sm font-medium text-white bg-indigo-800 hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              Try for Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#features"
                    className="text-gray-300 hover:text-white"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-gray-300 hover:text-white"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-gray-300 hover:text-white"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
                Resources
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Guides
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
                Connect
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    <Twitter className="w-4 h-4" /> Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" /> Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} AI Quiz. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">GitHub</span>
                <Github className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
