import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bot, Copy, Bookmark, Trash2, Plus, Clock, CheckCircle, Menu, X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import './AiChatPage.css';
import { getAllowedChapters, getAiChats, saveAiChat, deleteAiChat, getBookmarkedAiChats, bookmarkAiChat, removeBookmarkAiChat } from '../services/aiChatService';
import { processAiChatQuery } from '../services/llmService';

const LOADING_MESSAGES = [
  "Scanning the Academics...",
  "Locating the chapter...",
  "Finding more relevant info...",
  "Analyzing verified textbook data...",
  "Synthesizing your answer..."
];

const preprocessLaTeX = (content) => {
  if (!content) return '';
  return content
    .replace(/\\\[/g, '$$$$')
    .replace(/\\\]/g, '$$$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');
};

function SolverLoading() {
  const [msgIdx, setMsgIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="solver-loading-container">
      <div className="solver-spinner-wrapper">
        <div className="solver-pulse-ring"></div>
        <div className="solver-pulse-ring delay"></div>
        <Bot size={50} className="solver-spinner-icon" />
      </div>
      <h3 className="solver-loading-text">{LOADING_MESSAGES[msgIdx]}</h3>
      <p className="solver-loading-subtext">The Smart Solver is working on your doubt...</p>
    </div>
  );
}

export default function AiChatPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('history');
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [allowedChapters, setAllowedChapters] = useState([]);
  
  const [currentChat, setCurrentChat] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    loadData();
  }, [currentUser]);

  async function loadData() {
    try {
      const [hist, bkmk, chaps] = await Promise.all([
        getAiChats(currentUser.phone),
        getBookmarkedAiChats(currentUser.phone),
        getAllowedChapters()
      ]);
      setHistory(hist);
      setBookmarks(bkmk);
      setAllowedChapters(chaps);
    } catch (err) {
      console.error("Error loading chat data:", err);
    }
  }

  useEffect(() => {
    document.body.classList.add('ai-chat-active');
    return () => {
      document.body.classList.remove('ai-chat-active');
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setIsLoading(true);
    setCurrentChat({ id: 'temp', userMessage: userMsg, aiResponse: null });
    
    try {
      const response = await processAiChatQuery(userMsg, allowedChapters);
      
      const savedChat = await saveAiChat(currentUser.phone, userMsg, response);
      if (savedChat) {
        setCurrentChat(savedChat);
        const freshHistory = await getAiChats(currentUser.phone);
        setHistory(freshHistory);
      } else {
        setCurrentChat({ userMessage: userMsg, aiResponse: response });
      }
    } catch (err) {
      setCurrentChat({ userMessage: userMsg, aiResponse: "An error occurred: " + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBookmark = async (chat) => {
    try {
      const isBookmarked = bookmarks.some(b => b.id === chat.id);
      if (isBookmarked) {
        await removeBookmarkAiChat(currentUser.phone, chat.id);
        setBookmarks(prev => prev.filter(b => b.id !== chat.id));
      } else {
        await bookmarkAiChat(currentUser.phone, chat);
        setBookmarks(prev => [chat, ...prev]);
      }
    } catch (err) {
      alert("Failed to bookmark: " + err.message);
    }
  };

  const handleDeleteHistory = async (chatId) => {
    if (!window.confirm("Delete this doubt?")) return;
    try {
      await deleteAiChat(currentUser.phone, chatId);
      setHistory(prev => prev.filter(c => c.id !== chatId));
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const renderSidebarItem = (chat, isBookmarkTab = false) => {
    const isActive = currentChat?.id === chat.id;
    return (
      <div 
        key={chat.id} 
        className={`ai-history-card ${isActive ? 'active' : ''}`}
        onClick={() => {
          setCurrentChat(chat);
          setIsMobileMenuOpen(false);
        }}
      >
        <div className="ai-history-title">{chat.userMessage}</div>
        <div className="ai-history-date">
          {new Date(chat.timestamp).toLocaleDateString()}
        </div>
        {!isBookmarkTab && (
          <button 
            className="ai-history-delete" 
            onClick={(e) => { e.stopPropagation(); handleDeleteHistory(chat.id); }}
            title="Delete Doubt"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`ai-chat-wrapper ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      <div className="ai-chat-container">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="ai-mobile-overlay" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}
        
        {/* Sidebar */}
        <div className={`ai-glass-panel ai-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="ai-sidebar-tabs" style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              className={`ai-sidebar-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Clock size={16} /> History
            </button>
            <button 
              className={`ai-sidebar-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookmarks')}
            >
              <Bookmark size={16} /> Bookmarks
            </button>
            
            <button 
              className="ai-mobile-menu-btn" 
              style={{ display: isMobileMenuOpen ? 'flex' : 'none', marginLeft: '0.5rem', border: 'none' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="ai-sidebar-content">
          {activeTab === 'history' ? (
            history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>No recent doubts.</p>
            ) : (
              history.map(c => renderSidebarItem(c, false))
            )
          ) : (
            bookmarks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>No bookmarked doubts.</p>
            ) : (
              bookmarks.map(c => renderSidebarItem(c, true))
            )
          )}
          </div>
        </div>

      {/* Main Area */}
      <div className="ai-glass-panel ai-main">
        <div className="ai-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="ai-mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="ai-chat-title"><Sparkles size={24} color="#a78bfa" /> Smart Solver</h2>
          </div>
          <button className="ai-new-chat-btn" onClick={() => { setCurrentChat(null); setInput(''); }}>
            <Plus size={16} /> New Doubt
          </button>
        </div>

        <div className="solver-main-content">
          {!currentChat && !isLoading && (
            <div className="solver-hero">
              <div className="solver-hero-icon-container">
                <Bot size={64} className="solver-hero-icon" />
              </div>
              <h1 className="solver-hero-title">What's your doubt today?</h1>
              <p className="solver-hero-subtitle">Our Smart Solver uses verified textbook data to give you exact, step-by-step answers.</p>
              
              <form className="solver-hero-form" onSubmit={handleSend}>
                <textarea
                  className="solver-textarea"
                  placeholder="Type your doubt here... (e.g. Explain Newton's First Law)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={4}
                  disabled={isLoading}
                  autoFocus
                />
                <div className="solver-form-footer">
                  <span className="solver-hint">Press Enter to solve, Shift + Enter for new line</span>
                  <button type="submit" className="solver-submit-btn" disabled={!input.trim() || isLoading}>
                    <Sparkles size={18} /> Solve Doubt
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading && (
            <SolverLoading />
          )}

          {currentChat && !isLoading && currentChat.aiResponse && (
            <div className="solver-result-view">
              <div className="solver-question-card">
                <h4 className="solver-card-label">Your Doubt</h4>
                <p className="solver-question-text">{currentChat.userMessage}</p>
              </div>

              <div className="solver-answer-card">
                <div className="solver-card-header">
                  <h4 className="solver-card-label"><Sparkles size={16} color="#a78bfa"/> Smart Solver Output</h4>
                  <div className="solver-actions">
                    <button 
                      className="ai-action-btn"
                      onClick={() => handleCopy(currentChat.aiResponse, currentChat.id)}
                      title="Copy Answer"
                    >
                      {copiedId === currentChat.id ? <CheckCircle size={14} /> : <Copy size={14} />} 
                      {copiedId === currentChat.id ? 'Copied' : 'Copy'}
                    </button>
                    <button 
                      className={`ai-action-btn ${bookmarks.some(b => b.id === currentChat.id) ? 'active' : ''}`}
                      onClick={() => handleBookmark(currentChat)}
                      title="Bookmark Doubt"
                    >
                      <Bookmark size={14} fill={bookmarks.some(b => b.id === currentChat.id) ? 'currentColor' : 'none'} /> 
                      {bookmarks.some(b => b.id === currentChat.id) ? 'Bookmarked' : 'Bookmark'}
                    </button>
                  </div>
                </div>
                
                <div className="solver-answer-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                  >
                    {preprocessLaTeX(currentChat.aiResponse)}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
