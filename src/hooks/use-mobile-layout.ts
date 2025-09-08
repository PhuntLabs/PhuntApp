
'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PopulatedChat, Server, Channel } from '@/lib/types';

export function useMobileLayout() {
  const [activeView, setActiveView] = useState<'home' | 'notifications' | 'profile'>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<PopulatedChat | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSelectChat = (chat: PopulatedChat) => {
    setSelectedChat(chat);
    setSelectedServer(null);
    setSelectedChannel(null);
    setIsChatOpen(true);
    setIsSidebarOpen(false);
  };

  const handleSelectChannel = (channel: Channel, server: Server) => {
    setSelectedChannel(channel);
    setSelectedServer(server);
    setSelectedChat(null);
    setIsChatOpen(true);
    setIsSidebarOpen(false);
  };
  
  const handleSelectServer = (server: Server | null) => {
      setSelectedServer(server);
      setSelectedChat(null);
      setSelectedChannel(null);
      setIsChatOpen(false);
  }

  const handleBackFromChat = () => {
    setIsChatOpen(false);
    setSelectedChat(null);
    setSelectedChannel(null);
  };
  
  useEffect(() => {
    if (activeView !== 'home') {
      setIsSidebarOpen(false);
      setIsChatOpen(false);
    }
  }, [activeView]);

  return {
    activeView,
    setActiveView,
    isChatOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    selectedChat,
    selectedChannel,
    selectedServer,
    handleSelectChat,
    handleSelectChannel,
    handleSelectServer,
    handleBackFromChat,
  };
}
