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
        className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 h-[42rem] w-[56rem] overflow-y-auto mb-6 relative"
      >
        {messages.map((msg, index) => (
          <div
            key={`message-${index}`}
            className={`mb-4 flex ${
              msg.type === 'bot' ? 'justify-start' : 'justify-end'
            } animate-slide-in`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-md text-sm ${
                msg.type === 'bot'
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-gray-700 dark:text-gray-200'
                  : 'bg-indigo-100 dark:bg-indigo-800/30 text-gray-900 dark:text-gray-200'
              }`}
            >
              {renderContent(msg.content)}
              {msg.options && (
                <div className="mt-2 space-y-2">
                  {msg.options.map((option, optIndex) => (
                    <label
                      key={`option-${msg.mcqId}-${optIndex}`}
                      className="flex items-start cursor-pointer p-2 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors"
                      style={{ maxWidth: '100%' }}
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
                        className="h-4 w-4 text-indigo-600 dark:text-indigo-300 focus:ring-indigo-600 border-gray-300 dark:border-gray-600 mt-1"
                        disabled={isLoading}
                      />
                      <span
                        className="ml-2 text-gray-700 dark:text-gray-200 break-words"
                        style={{ maxWidth: '90%' }}
                      >
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
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-700 dark:text-gray-200">
            <BookOpen className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-300" />
            Waiting for the first question...
          </div>
        )}
      </div>
      {currentQuestion && (
        <form
          onSubmit={handleAnswerSubmit}
          className="flex justify-end space-x-3"
        >
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !userAnswer}
            className="flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Answer
          </Button>
          <Button
            type="button"
            onClick={endAssessment}
            variant="secondary"
            disabled={isLoading}
            className="flex items-center justify-center gap-2"
          >
            <StopCircle className="w-4 h-4" />
            End Assessment
          </Button>
        </form>
      )}
    </>
  )
}

export default AssessmentMessages
