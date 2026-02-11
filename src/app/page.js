"use client";

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import WorryWall from '@/components/WorryWall';
import ClarifyCard from '@/components/ClarifyCard';
import ContextCard from '@/components/ContextCard';
import BabyProfileModal, { loadProfile, saveProfile } from '@/components/BabyProfileModal';
import { VISIT_KEY, GUIDED_PROMPTS } from '@/config/constants';
import { trackEvent } from '@/utils/analytics';
import { useChat } from '@/hooks/useChat';
import { getProfileUpdateFromClarifyText } from '@/utils/chatUtils';
import { KNOWLEDGE_BASE } from '@/data/knowledge_base';
import { getStage } from '@/utils/age';

function getHasVisited() {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(VISIT_KEY) === "1"; } catch (e) { return false; }
}
function setHasVisited() {
  try { localStorage.setItem(VISIT_KEY, "1"); } catch (e) {}
}

export default function Home() {
  const [profile, setProfile] = useState({ name: '糯米', gender: '男孩', birth: '2024-11-20', status: 'born' });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [hasVisited, setHasVisitedState] = useState(false);
  const [worryTags, setWorryTags] = useState([]);
  const [input, setInput] = useState('');
  
  // Use Custom Hook for Chat Logic
  const { messages, setMessages, isLoading, suggestions, sendMessage } = useChat(profile, setProfile);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setProfile(loadProfile());
    const visited = getHasVisited();
    setHasVisitedState(visited);
  }, []);

  useEffect(() => {
    if (messages.length > 1) setHasVisited();
  }, [messages.length]);

  const handleSaveProfile = (next) => {
    setProfile(next);
    saveProfile(next);
  };

  // Load Tags based on Profile Stage
  useEffect(() => {
    const stage = getStage(profile);
    
    const filtered = KNOWLEDGE_BASE.filter(item => {
      // Must have a display tag to be shown on wall
      if (!item.display_tag) return false;
      
      // 'all' applies to everyone
      if (item.stage === 'all') return true;
      
      // Exact match
      if (item.stage === stage) return true;
      
      return false;
    });

    const tags = filtered.map(item => ({
      id: item.id,
      display_tag: item.display_tag,
      query: item.display_tag // When clicked, send the tag text
    }));

    setWorryTags(tags);
  }, [profile]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput('');
  };

  const handleTagClick = (tag) => {
    trackEvent("entry_click_worry_tag", {
      id: tag.id,
      label: tag.display_tag,
    });
    sendMessage(tag.display_tag, tag.id);
  };

  const handleSuggestionClick = (text) => {
    sendMessage(text);
  };

  const handleClarifyOptionClick = (option) => {
    // 1. Update Profile if option implies object/stage change
    const update = getProfileUpdateFromClarifyText(option.text);
    if (Object.keys(update).length > 0) {
      const next = { ...profile, ...update };
      setProfile(next);
      saveProfile(next);
    }
    // 2. Send the option text as user reply, triggering next step
    sendMessage(option.text, option.next_id);
  };

  const handleGuidedClick = (item) => {
    trackEvent("entry_click_guided_prompt", {
      title: item.title,
      caseId: item.caseId || null,
    });
    sendMessage(item.query, item.caseId || null);
  };

  return (
    <div className="h-[100dvh] w-full bg-gray-50 font-sans text-gray-900 flex justify-center overflow-hidden">
      {/* Mobile Frame */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-lg text-gray-800">兜知道</h1>
        </header>

        {/* Context Card */}
        <ContextCard 
          profile={profile} 
          onClick={() => setShowProfileModal(true)} 
        />

        {/* Disclaimer */}
        <div className="bg-orange-100 text-orange-700 text-xs px-4 py-2 text-center font-medium">
          AI建议仅供参考，如遇高烧/惊厥等急症请立即就医
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {/* Welcome: 情境引导(仅首次) + 月嫂阿姨常被问 */}
          {!messages.some(m => m.role === 'user') && (
            <WorryWall
              tags={worryTags}
              onTagClick={handleTagClick}
              guidedPrompts={GUIDED_PROMPTS}
              onGuidedClick={handleGuidedClick}
            />
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-600' : 'bg-white border-2 border-emerald-100 text-emerald-500'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={24} />}
              </div>

              {/* Bubble */}
              <div className="max-w-[80%] space-y-2">
                {msg.role === 'assistant' && <div className="text-xs text-gray-400 ml-1">兜兜 (金牌月嫂)</div>}
                
                {(msg.content || msg.reply) && (
                  <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-emerald-500 text-white rounded-tr-sm whitespace-pre-wrap' 
                      : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm prose prose-sm prose-p:my-1 prose-ul:my-2 prose-li:my-0 max-w-none'}`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.reply || ''}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                )}

                {/* Clarification Card Component */}
                {msg.role === 'assistant' && msg.action === 'clarify' && msg.clarifyOptions && (
                  <ClarifyCard options={msg.clarifyOptions} onOptionClick={handleClarifyOptionClick} />
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-emerald-100 flex items-center justify-center shadow-sm">
                <Bot size={24} className="text-emerald-500" />
              </div>
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Suggestions - 提问后推荐 */}
        {!isLoading && suggestions.length > 0 && (
          <div className="px-4 pb-2">
             <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mb-2 px-1">
               <Sparkles size={12} />
               <span>猜你想问</span>
             </div>
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
               {suggestions.map((sugg, i) => (
                 <button 
                   key={i} 
                   onClick={() => handleSuggestionClick(sugg)}
                   className="whitespace-nowrap px-4 py-2 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-100 active:scale-95 transition-transform"
                 >
                   {sugg}
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* 提问前推荐：月嫂阿姨常被问（与猜你想问互斥，suggestions 为空时展示） */}
        {messages.length > 1 && suggestions.length === 0 && !isLoading && (
          <WorryWall tags={worryTags} onTagClick={handleTagClick} compact />
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 pb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="问问兜兜..."
              disabled={isLoading}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 active:scale-90 transition-all"
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        <BabyProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          profile={profile}
          onSave={handleSaveProfile}
        />
      </div>
    </div>
  );
}
