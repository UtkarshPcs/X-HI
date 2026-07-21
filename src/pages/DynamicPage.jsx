import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPage } from '../services/dynamicPageService';
import { useAuth } from '../auth/AuthContext';
import JsonRenderer from '../components/dynamic/JsonRenderer';
import { Helmet } from 'react-helmet'; // or we can just use document.title directly if Helmet isn't installed. Let's just use document.title

export default function DynamicPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { currentUser, openModal, loading: authLoading } = useAuth();
  
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        const p = await getPage(pageId);
        if (!p) {
          setError('Page not found');
        } else {
          setPage(p);
        }
      } catch (err) {
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    }
    loadPage();
  }, [pageId]);

  useEffect(() => {
    if (page && page.visibility !== 'hidden') {
      document.title = page.title || '10th HI Portal';
      
      // Update meta description if it exists
      let metaDesc = document.querySelector('meta[name="description"]');
      if (page.description) {
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = page.description;
      }
    }
  }, [page]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 pb-16">
        <div className="loader"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-bold mb-4">{error}</h1>
        <button className="auth-btn" onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  if (page.visibility === 'hidden') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-bold mb-4 text-red-500">Page Removed</h1>
        <p className="text-white/60 mb-8 max-w-md">
          This page has been removed by the ADMIN. If you believe this is a mistake, please contact the administrator.
        </p>
        <button 
          className="auth-btn" 
          onClick={() => window.open('https://wa.me/91XXXXXXXXXX', '_blank')} // User can update this
        >
          Contact me on WhatsApp
        </button>
      </div>
    );
  }

  if (page.visibility === 'private' && !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <div className="glass-card p-8 rounded-2xl max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-white/70 mb-6">You must be logged in to view this page.</p>
          <button className="auth-btn w-full" onClick={() => openModal('login')}>Log In</button>
        </div>
      </div>
    );
  }

  // Parse JSON code if it's stored as a string (Admin textarea usually saves strings)
  let parsedJson = null;
  try {
    parsedJson = typeof page.jsonCode === 'string' ? JSON.parse(page.jsonCode) : page.jsonCode;
  } catch (err) {
    return (
      <div className="min-h-screen pt-24 p-8 text-center text-red-500">
        <p>Error rendering page: Invalid JSON schema.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 max-w-7xl mx-auto page-transition fade-in">
      <JsonRenderer node={parsedJson} />
    </div>
  );
}
