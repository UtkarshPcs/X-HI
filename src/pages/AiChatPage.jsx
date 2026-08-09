import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, Copy, Bookmark, Trash2, Plus, Clock, MessageSquare, CheckCircle, Menu, X } from 'lucide-react';
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

function LoadingIndicator() {
  const [msgIdx, setMsgIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="ai-bubble" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <div className="ai-loading-dots">
        <div className="ai-dot"></div>
        <div className="ai-dot"></div>
        <div className="ai-dot"></div>
      </div>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{LOADING_MESSAGES[msgIdx]}</span>
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
  
  const [currentChat, setCurrentChat] = useState(null); // { userMessage, aiResponse }
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const messagesEndRef = useRef(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setIsLoading(true);
    setCurrentChat({ id: 'temp', userMessage: userMsg, aiResponse: null });
    
    try {
      const response = await processAiChatQuery(userMsg, allowedChapters);
      
      const savedChat = await saveAiChat(currentUser.phone, userMsg, response);
      if (savedChat) {
        setCurrentChat(savedChat);
        // Refresh history to enforce 10 chat limit on UI
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
    if (!window.confirm("Delete this chat?")) return;
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

  const renderSidebarItem = (chat, isBookmarkTab = false) => {
    const isActive = currentChat?.id === chat.id;
    return (
      <div 
        key={chat.id} 
        className={`ai-history-card ${isActive ? 'active' : ''}`}
        onClick={() => {
          setCurrentChat(chat);
          setIsMobileMenuOpen(false); // Close mobile sidebar on select
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
            title="Delete Chat"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="ai-chat-wrapper">
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
            
            {/* Close button for mobile */}
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
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>No recent chats.</p>
            ) : (
              history.map(c => renderSidebarItem(c, false))
            )
          ) : (
            bookmarks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>No bookmarked chats.</p>
            ) : (
              bookmarks.map(c => renderSidebarItem(c, true))
            )
          )}
          </div>
        </div>

      {/* Main Chat Area */}
      <div className="ai-glass-panel ai-main">
        <div className="ai-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="ai-mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="ai-chat-title"><Bot size={24} /> 10th HI AI</h2>
          </div>
          <button className="ai-new-chat-btn" onClick={() => setCurrentChat(null)}>
            <Plus size={16} /> New Chat
          </button>
        </div>

        <div className="ai-chat-messages">
          {!currentChat && !isLoading && (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', maxWidth: 400 }}>
              <Bot size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3>How can I help you learn today?</h3>
              <p>Ask a question about any of the available chapters. I'll strictly use our verified textbook data to answer.</p>
            </div>
          )}

          {currentChat && (
            <>
              {/* User Message */}
              <div className="ai-message user">
                <div className="ai-bubble">{currentChat.userMessage}</div>
              </div>

              {/* AI Response or Loading */}
              <div className="ai-message ai">
                {currentChat.aiResponse ? (
                  <>
                    <div className="ai-bubble">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                      >
                        {preprocessLaTeX(currentChat.aiResponse)}
                      </ReactMarkdown>
                    </div>
                    {currentChat.id !== 'temp' && (
                      <div className="ai-actions">
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
                          title="Bookmark Chat"
                        >
                          <Bookmark size={14} fill={bookmarks.some(b => b.id === currentChat.id) ? 'currentColor' : 'none'} /> 
                          {bookmarks.some(b => b.id === currentChat.id) ? 'Bookmarked' : 'Bookmark'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <LoadingIndicator />
                )}
              </div>
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-input-container">
          <form className="ai-chat-form" onSubmit={handleSend}>
            <input
              type="text"
              className="ai-input"
              placeholder="Ask an academic question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="ai-send-btn" disabled={!input.trim() || isLoading}>
              <Send size={18} />
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
