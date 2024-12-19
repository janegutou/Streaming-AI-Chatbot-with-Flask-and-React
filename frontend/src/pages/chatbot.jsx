import React, { useState, useEffect, useRef } from 'react';
import { FaTrash } from 'react-icons/fa'; 
import { marked } from 'marked';

const Chatbot = () => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [streamingAnswer, setStreamingAnswer] = useState('');

  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const chatEndRef = useRef(null);

   // initialize session_id when the app loads
  useEffect(() => {
    const initiateSession = async () => {
      try {
        const session_id = localStorage.getItem('session_id');
        if (session_id) {
          setSessionId(session_id);
        } else {
          await refreshSession();
        }
      } catch (error) {
        console.error('Failed to start session', error);
      }
    };
    initiateSession();
  }, []);

  // trigger scroll when streaming answer changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingAnswer]); 

  // request API to refresh session when want to start a new chat
  const refreshSession = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/refresh_session', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to start session.');
      }
      const data = await response.json();
      const session_id = data.session_id;
      setSessionId(session_id);
      localStorage.setItem('session_id', session_id);
      setChatHistory([]);
    } catch (error) {
      console.error('Error during session start:', error);
      throw error;
    }
  };

  // request API to get AI response
  const streamSubmit = async () => {    
    // start streaming via EventSource
    setIsStreaming(true);
    setStreamingAnswer('');
    let localstreamingAnswer = ''; 

    // add a placeholder for the AI response
    setChatHistory((prevHistory) => [
      ...prevHistory,
      { question: question, answer: '' }, 
    ]);

    const eventSource = new EventSource(`http://127.0.0.1:5000/api/stream?session_id=${sessionId}&question=${question}`); // sending parameters to the API endpoint in the URL

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();

        // Update the last chat message with the final answer
        setChatHistory((prevHistory) => {
          const updatedHistory = [...prevHistory];
          updatedHistory[updatedHistory.length - 1].answer = localstreamingAnswer;
          return updatedHistory;
        });

        setIsStreaming(false);
        setQuestion('');
        return;
      }

      localstreamingAnswer += event.data;
      setStreamingAnswer(localstreamingAnswer);

    };

    eventSource.onerror = function(error) {
      console.error('Stream error:', error);
      eventSource.close();
      setIsStreaming(false);
    };
  };
    
  
  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      <header className='p-8'>
        <h1 className="text-2xl font-bold mb-4 text-gray-600">Generative AI ChatBot with Streaming Response</h1>
        <hr className="border-t border-gray-300 mb-2" />
      </header>
      <div className="flex flex-col flex-grow pb-4 pr-8 pl-8"> 
        <div className='max-w-7xl'> 
          {/* question section */}
          <div className="mb-2">  
            <h2 className="text-lg font-bold text-blue-500 pt-4 pb-2 flex">Enter Your Question</h2>
            <div className="flex space-x-2 items-start">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                style={{ height: '80px' }} 
                rows={1} 
              />
              <button
                onClick={streamSubmit}
                className="mt-1 mb-4 inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-m font-medium rounded-md text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{ height: '80px' }}
              >
                Submit
              </button>
            </div>
          </div>
          {/* chat history */}
          <div className='mb-2'>
            <h2 className="text-lg font-bold text-blue-500 pt-4 pb-2 flex items-center justify-between">
              <span>Chat History</span>
              <button
                onClick={refreshSession}
                className="p-2 text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaTrash size={15} />
              </button>
            </h2>
            <div className="mt-1 border border-gray-300 rounded-md shadow-sm min-h-48 max-h-[800px] overflow-y-auto p-2 space-y-4">               
              <div className="relative">
                <div className='p-6 pt-8 space-y-4'>
                  {chatHistory.map((chat, index) => (
                    <div key={index} className="mb-2">
                      <div className="text-blue-600 font-semibold">You:</div>
                      <div className="p-2 mt-1 bg-blue-50 rounded-md">{chat.question}</div>
                      <div className="text-gray-600 font-semibold mt-2">AI:</div>
                      <div className="p-2 mt-1 bg-gray-100 rounded-md">
                        {isStreaming && index === chatHistory.length - 1 ? (
                          <>
                            {streamingAnswer ? (
                              <div dangerouslySetInnerHTML={{__html: marked(streamingAnswer)}} />
                            ) : (
                              <div className="text-gray-500 italic">Loading...</div>
                            )}
                          </>
                        ) : (
                          <div dangerouslySetInnerHTML={{__html: marked(chat.answer)}} />
                        )
                        }
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} /> {/* Invisible div that always stays at the bottom of the chat */}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-300 mt-4 text-right">
              <span>Session ID: </span>
              <span className="font-mono">{sessionId || "Loading..."}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
