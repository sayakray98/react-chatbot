import React, { useState, useRef, useEffect } from 'react';
import logoimg from '../images/logonew.png';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isImageOpen, setIsImageOpen] = useState(false);
    const chatContainerRef = useRef(null);
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');

    // Fetch and Extract PDF Text - Removed since backend handles PDF text extraction
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ text: "How can we help you today?", type: 'bot' }]);
            setIsTyping(true);

            setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, { text: "Please tell your name?", type: 'bot' }]);
            }, 3000);
        }
    }, [isOpen, messages.length]);

    // Handle Send Message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input) return;

        setMessages(prev => [...prev, { text: input, type: 'user' }]);
        setInput('');
        setIsTyping(true);

        setTimeout(async () => {
            setIsTyping(false);
            let responseText = await askQuestionFromApi(input); // Change function name
            setMessages(prev => [...prev, { text: responseText, type: 'bot' }]);
        }, 1000);
    };

    // Function to send the question to the backend and get the answer
    const askQuestionFromApi = async (query) => {
        try {
            const response = await fetch(`http://localhost:5000/ask-question?question=${encodeURIComponent(query)}`);
            if (response.ok) {
                const { answer } = await response.json();
                return answer || "Sorry, I couldn't find an answer for that.";
            } else {
                throw new Error('Failed to fetch answer.');
            }
        } catch (error) {
            console.error(error);
            return "An error occurred while fetching the answer.";
        }
    };

    // Toggle Chatbot Visibility
    const toggleChatbot = () => {
        setIsOpen(!isOpen);
        setIsImageOpen(!isImageOpen);
    };

    return (
        <>
            <div className="chatbot-toggle" onClick={toggleChatbot}>
                <i className="fa-solid fa-robot"></i>
            </div>
            <div className={`chatbot-togglen ${isImageOpen ? 'newimg' : 'newimgclosed'}`}>
                <img src={logoimg} alt="Chatbot Logo" />
            </div>
            <div className={`chatbot ${isOpen ? 'open' : ''}`}>
                {isOpen && (
                    <div className="chatbot-container" ref={chatContainerRef}>
                        <div className="messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message ${msg.type}`}>
                                    {msg.text}
                                </div>
                            ))}
                            {isTyping && (
                                <div className="message bot">
                                    <div className="typing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleSendMessage} className="input-area">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your question"
                            />
                            <button type="submit">Send</button>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
};

export default Chatbot;
