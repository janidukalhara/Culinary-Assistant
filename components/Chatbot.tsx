import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { TRANSLATION_LANGUAGES } from '../constants';
import { translateTexts } from '../services/geminiService';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onMessagesUpdate: (messages: ChatMessage[]) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading, onMessagesUpdate }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
        setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, isLoading]);
  
  useEffect(() => {
    if (selectedLanguage === 'en' || !messages.length || !isOpen) return;

    const doTranslate = async () => {
      const indicesToTranslate: number[] = [];
      messages.forEach((msg, index) => {
        if (!msg.translations?.[selectedLanguage]) {
          indicesToTranslate.push(index);
        }
      });

      if (indicesToTranslate.length === 0) return;

      const targetLanguage = TRANSLATION_LANGUAGES.find(l => l.code === selectedLanguage);
      if (!targetLanguage) return;

      setIsTranslating(true);
      try {
        const textsToTranslate = indicesToTranslate.map(i => messages[i].text);
        const translatedTexts = await translateTexts(textsToTranslate, targetLanguage.name);

        const newMessages = [...messages]; // Create a mutable copy
        translatedTexts.forEach((translatedText, i) => {
          const originalMessageIndex = indicesToTranslate[i];
          // Only update if translation is successful and different
          if (translatedText && translatedText !== newMessages[originalMessageIndex].text) {
            if (!newMessages[originalMessageIndex].translations) {
              newMessages[originalMessageIndex].translations = {};
            }
            newMessages[originalMessageIndex].translations![selectedLanguage] = translatedText;
          }
        });
        onMessagesUpdate(newMessages);

      } catch (error) {
        console.error("Failed to translate chat:", error);
      } finally {
        setIsTranslating(false);
      }
    };

    doTranslate();
  }, [selectedLanguage, messages, onMessagesUpdate, isOpen]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] max-w-md h-[70vh] max-h-[600px] z-50 flex flex-col shadow-2xl rounded-xl">
      <div className="bg-dark-card rounded-t-xl p-4 flex justify-between items-center gap-4">
        <h3 className="text-xl font-bold text-brand-primary flex-shrink-0">Culinary Chatbot</h3>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="bg-dark-surface text-light-text text-sm px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary w-full min-w-0"
          aria-label="Select language for chat translation"
        >
          {TRANSLATION_LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
        <button onClick={onClose} className="text-subtle-text hover:text-light-text">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-grow bg-dark-bg p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-sm p-3 rounded-lg ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-dark-surface text-light-text'}`}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.translations?.[selectedLanguage] || msg.text}</p>
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-dark-surface">
                    <h4 className="text-xs font-bold text-subtle-text mb-2">Sources</h4>
                    <ul className="space-y-1">
                      {msg.groundingChunks.map((chunk, i) => (
                        chunk.web && (
                          <li key={i}>
                            <a 
                              href={chunk.web.uri} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-brand-primary hover:underline block truncate"
                              title={chunk.web.title || chunk.web.uri}
                            >
                              {i + 1}. {chunk.web.title || chunk.web.uri}
                            </a>
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length -1].role === 'user' && (
            <div className="flex justify-start">
              <div className="max-w-xs md:max-w-sm p-3 rounded-lg bg-dark-surface text-light-text">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-subtle-text rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-subtle-text rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-subtle-text rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          {isTranslating && (
            <div className="text-center text-subtle-text text-sm py-2">Translating...</div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-dark-card p-4 rounded-b-xl border-t border-dark-surface">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a cooking question..."
            className="w-full bg-dark-surface text-light-text px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="bg-brand-primary text-white p-2 rounded-full hover:bg-brand-secondary disabled:bg-dark-surface disabled:cursor-not-allowed transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;