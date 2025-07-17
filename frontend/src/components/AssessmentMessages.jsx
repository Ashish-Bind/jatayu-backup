import React from 'react'
import { BookOpen, Send, StopCircle } from 'lucide-react'
import Button from '../components/Button'
import { preventCopyPaste, renderContent } from '../utils/utils'

const AssessmentMessages = ({
  messages,
  isLoading,
  currentQuestion,
  userAnswer,
  handleOptionSelect,
  handleAnswerSubmit,
  endAssessment,
  chatContainerRef,
}) => {
  return (
    <>
      <div
        ref={chatContainerRef}
        onCopy={(e) => preventCopyPaste(e, () => {})}
        onPaste={(e) => preventCopyPaste(e, () => {})}
        onCut={(e) => preventCopyPaste(e, () => {})}
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-6 rounded-lg shadow-inner border border-indigo-200 dark:border-indigo-800 h-[calc(100vh-24rem)] overflow-y-auto mb-6"
      >
        {messages.map((msg, index) => (
          <div
            key={`message-${index}`}
            className={`mb-6 flex ${
              msg.type === 'bot' ? 'justify-start' : 'justify-end'
            }`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-lg text-base ${
                msg.type === 'bot'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-gray-800 dark:text-gray-100 shadow-md'
                  : 'bg-indigo-200 dark:bg-indigo-800/50 text-gray-900 dark:text-gray-100 shadow-md'
              } transition-all duration-300 hover:shadow-lg`}
            >
              {renderContent(msg.content)}
              {msg.options && (
                <div className="mt-4 space-y-3">
                  {msg.options.map((option, optIndex) => (
                    <label
                      key={`option-${msg.mcqId}-${optIndex}`}
                      className="flex items-center p-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-700/30 transition-colors cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question-${msg.mcqId}`}
                        value={option.value || (optIndex + 1).toString()}
                        checked={
                          userAnswer ===
                          (option.value || (optIndex + 1).toString())
                        }
                        onChange={() =>
                          handleOptionSelect(
                            option.value || (optIndex + 1).toString()
                          )
                        }
                        className="w-5 h-5 text-indigo-600 dark:text-indigo-300 focus:ring-indigo-600 border-gray-300 dark:border-gray-600"
                        disabled={isLoading}
                      />
                      <span className="ml-3 text-base text-gray-800 dark:text-gray-100">
                        {option.label || `${optIndex + 1}. ${option}`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {!messages.length && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-base text-gray-600 dark:text-gray-300">
            <BookOpen className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-300" />
            Waiting for the first question...
          </div>
        )}
      </div>
      {currentQuestion && (
        <form
          onSubmit={handleAnswerSubmit}
          className="flex justify-end space-x-4"
        >
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !userAnswer}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-md"
          >
            <Send className="w-5 h-5" />
            Submit Answer
          </Button>
          <Button
            type="button"
            onClick={endAssessment}
            variant="secondary"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-md"
          >
            <StopCircle className="w-5 h-5" />
            End Assessment
          </Button>
        </form>
      )}
    </>
  )
}

export default AssessmentMessages
