'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { socket, connectSocket, disconnectSocket } from '@/lib/socket';

export default function Messages() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'search'>('chats');
  const [connections, setConnections] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Voice Message State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojis = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏'];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    fetchConnections();
    fetchRequests();

    if (user?.id) {
      connectSocket(user.id);

      socket.on('receiveMessage', (data) => {
        if (selectedUser && data.sender === selectedUser._id) {
          setMessages(prev => [...prev, data]);
        }
        fetchConnections();
      });

      socket.on('userTyping', (data) => {
        if (selectedUser && data.userId === selectedUser._id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      });
    }

    return () => {
      disconnectSocket();
    };
  }, [user, selectedUser]);

  const fetchConnections = async () => {
    try {
      const { data } = await api.get('/connections/list');
      const connectionsWithUnread = await Promise.all(
        data.connections.map(async (conn: any) => {
          try {
            const { data: msgs } = await api.get(`/messages/${conn._id}`);
            const unreadCount = msgs.messages.filter((m: any) =>
              m.sender === conn._id && !m.isRead
            ).length;
            const lastMessage = msgs.messages[msgs.messages.length - 1];
            return { ...conn, unreadCount, lastMessage };
          } catch {
            return { ...conn, unreadCount: 0, lastMessage: null };
          }
        })
      );
      setConnections(connectionsWithUnread);
    } catch (error) {
      console.error('Failed to fetch connections');
    }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/connections/requests');
      setRequests(data.requests);
    } catch (error) {
      console.error('Failed to fetch requests');
    }
  };

  const searchUsers = async (role: string) => {
    try {
      const { data } = await api.get('/connections/search', { params: { role } });
      setSearchResults(data.users);
    } catch (error) {
      toast.error('Failed to search users');
    }
  };

  const sendRequest = async (userId: string) => {
    try {
      await api.post('/connections/send', { recipientId: userId });
      toast.success('Request sent!');
      setSearchResults(searchResults.filter(u => u._id !== userId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const respondRequest = async (requestId: string, accept: boolean) => {
    try {
      await api.post('/connections/respond', { requestId, accept });
      toast.success(accept ? 'Request accepted!' : 'Request rejected');
      fetchRequests();
      fetchConnections();
    } catch (error) {
      toast.error('Failed to respond');
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const { data } = await api.get(`/messages/${userId}`);
      setMessages(data.messages);
    } catch (error) {
      toast.error('Failed to fetch messages');
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !recordedAudio) || !selectedUser) return;

    try {
      let messageData: any = { receiver: selectedUser._id };

      if (recordedAudio && recordedBlob) {
        // Handle voice message
        const reader = new FileReader();
        reader.readAsDataURL(recordedBlob);
        reader.onloadend = async () => {
          messageData = {
            ...messageData,
            message: '🎤 Voice message',
            type: 'voice',
            audioUrl: reader.result,
            duration: recordDuration
          };
          await sendToBackend(messageData);
        };
      } else {
        // Handle text message
        messageData = {
          ...messageData,
          message: newMessage,
          type: 'text'
        };
        await sendToBackend(messageData);
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const sendToBackend = async (messageData: any) => {
    const { data } = await api.post('/messages', messageData);
    socket.emit('sendMessage', {
      ...data.message,
      sender: user?.id,
      receiver: selectedUser._id
    });

    setNewMessage('');
    setRecordedAudio(null);
    setRecordedBlob(null);
    fetchMessages(selectedUser._id);
  };

  const handleTyping = () => {
    if (selectedUser) {
      socket.emit('typing', { userId: user?.id, receiverId: selectedUser._id });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffInHours = (now.getTime() - msgDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return msgDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return msgDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      let startTime = Date.now();
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = Math.floor((Date.now() - startTime) / 1000);
        setRecordedAudio(audioUrl);
        setRecordedBlob(audioBlob);
        setRecordDuration(duration);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success('Recording...');
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  if (!mounted) return <div className="h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Mobile Header - Only show when chat is NOT open */}
      {!showMobileChat && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
        </div>
      )}

      {/* Tab Navigation - Mobile Only - Only show when chat is NOT open */}
      {!showMobileChat && (
        <div className="lg:hidden flex bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
          {[
            { key: 'chats', icon: 'ri-message-3-line', label: 'Chats' },
            { key: 'requests', icon: 'ri-mail-line', label: 'Requests', badge: requests.length },
            { key: 'search', icon: 'ri-search-line', label: 'Connect' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-2 relative min-w-[80px] ${activeTab === tab.key ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`}
            >
              <i className={`${tab.icon} text-lg`}></i>
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="absolute top-1 right-1 sm:-top-1 sm:-right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar - Desktop Always, Mobile Conditional */}
        <div className={`${showMobileChat ? 'hidden lg:flex' : 'flex'
          } flex-col w-full lg:w-80 xl:w-96 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-full`}>

          {/* Desktop Tabs */}
          <div className="hidden lg:flex border-b border-gray-200 dark:border-slate-800 flex-shrink-0">
            {[
              { key: 'chats', icon: 'ri-message-3-line', label: 'Chats' },
              { key: 'requests', icon: 'ri-mail-line', label: 'Requests', badge: requests.length },
              { key: 'search', icon: 'ri-search-line', label: 'Connect' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 relative ${activeTab === tab.key ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`}
              >
                <i className={`${tab.icon} text-lg`}></i>
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'chats' && (
              <div className="h-full overflow-y-auto">
                {connections.map((conn) => (
                  <div
                    key={conn._id}
                    onClick={() => {
                      setSelectedUser(conn);
                      fetchMessages(conn._id);
                      setShowMobileChat(true);
                    }}
                    className={`flex items-center gap-3 p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${selectedUser?._id === conn._id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600' : ''
                      }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                        {getInitials(conn.name)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">{conn.name}</p>
                        {conn.lastMessage && (
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
                            {formatTime(conn.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                          {conn.lastMessage ? (
                            conn.lastMessage.type === 'voice' ? '🎤 Voice message' : conn.lastMessage.message
                          ) : 'No messages yet'}
                        </p>
                        {conn.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0 ml-2">
                            {conn.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {connections.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <i className="ri-message-3-line text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p className="text-gray-500 dark:text-gray-400">No connections yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                {requests.map((req) => (
                  <div key={req._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {getInitials(req.requester.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{req.requester.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize truncate">{req.requester.role}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => respondRequest(req._id, true)}
                        className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center"
                      >
                        <i className="ri-check-line"></i>
                      </button>
                      <button
                        onClick={() => respondRequest(req._id, false)}
                        className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  </div>
                ))}
                {requests.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <i className="ri-mail-line text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="h-full overflow-y-auto p-4">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => searchUsers('teacher')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base"
                  >
                    Teachers
                  </button>
                  <button
                    onClick={() => searchUsers('student')}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base"
                  >
                    Students
                  </button>
                </div>
                <div className="space-y-3">
                  {searchResults.map((usr) => (
                    <div key={usr._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {getInitials(usr.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{usr.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize truncate">{usr.role}</p>
                      </div>
                      <button
                        onClick={() => sendRequest(usr._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-lg text-sm font-medium flex-shrink-0"
                      >
                        Connect
                      </button>
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <i className="ri-search-line text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                      <p className="text-gray-500 dark:text-gray-400">Search for users to connect</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${showMobileChat ? 'flex fixed inset-0 z-50' : 'hidden lg:flex'
          } lg:static flex-1 flex-col bg-gray-50 dark:bg-slate-950 w-full h-full`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="lg:hidden w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center flex-shrink-0"
                >
                  <i className="ri-arrow-left-line text-xl"></i>
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {getInitials(selectedUser.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{selectedUser.name}</p>
                  <p className="text-sm text-green-500 flex items-center gap-1 truncate">
                    <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                    Online
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      window.open(`/call?user=${selectedUser._id}&type=audio`, 'Voice Call', 'width=400,height=600');
                    }}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center"
                  >
                    <i className="ri-phone-line text-lg sm:text-xl"></i>
                  </button>
                  <button
                    onClick={() => {
                      window.open(`/call?user=${selectedUser._id}&type=video`, 'Video Call', 'width=800,height=600');
                    }}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center"
                  >
                    <i className="ri-vidicon-line text-lg sm:text-xl"></i>
                  </button>
                  <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center">
                    <i className="ri-more-2-line text-lg sm:text-xl"></i>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full">
                {messages.map((msg, index) => {
                  const isOwn = msg.sender === user?.id;
                  const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender !== msg.sender);

                  return (
                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {showAvatar ? getInitials(selectedUser.name) : ''}
                        </div>
                      )}
                      <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'order-1' : ''}`}>
                        <div className={`px-4 py-2 rounded-2xl ${isOwn
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-md'
                          } shadow-sm`}>
                          {msg.type === 'voice' ? (
                            <div className="flex items-center gap-2 min-w-[160px] sm:min-w-[200px]">
                              <button
                                onClick={() => {
                                  if (playingAudio === msg._id) {
                                    setPlayingAudio(null);
                                  } else {
                                    const audio = new Audio(msg.audioUrl);
                                    audio.play();
                                    setPlayingAudio(msg._id);
                                    audio.onended = () => setPlayingAudio(null);
                                  }
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                                  }`}
                              >
                                <i className={playingAudio === msg._id ? 'ri-pause-fill' : 'ri-play-fill'}></i>
                              </button>
                              <div className="flex-1 flex items-center gap-0.5 h-8">
                                {[...Array(15)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 rounded-full transition-all ${isOwn ? 'bg-white/40' : 'bg-gray-400/40'}`}
                                    style={{
                                      height: `${Math.random() * 100 + 20}%`,
                                      animation: playingAudio === msg._id ? `pulse 0.5s ease-in-out ${i * 0.05}s infinite` : 'none'
                                    }}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-mono opacity-80">{msg.duration || 0}s</span>
                            </div>
                          ) : (
                            <p className="break-words whitespace-pre-wrap text-sm sm:text-base">{msg.message}</p>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(msg.createdAt)}
                          </span>
                          {isOwn && (
                            <i className={`text-xs ${msg.isRead ? 'ri-check-double-line text-blue-400' : 'ri-check-line text-gray-400'
                              }`}></i>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex justify-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {getInitials(selectedUser.name)}
                    </div>
                    <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-3 sm:p-4 flex-shrink-0">
                {showEmojiPicker && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="grid grid-cols-8 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setNewMessage(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="text-xl sm:text-2xl hover:bg-gray-200 dark:hover:bg-slate-700 rounded p-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recordedAudio ? (
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-lg p-2">
                    <button
                      onClick={() => {
                        const audio = new Audio(recordedAudio);
                        audio.play();
                      }}
                      className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center"
                    >
                      <i className="ri-play-fill"></i>
                    </button>
                    <div className="flex-1 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center px-4">
                      <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <i className="ri-mic-line"></i>
                        Voice message - {recordDuration}s
                      </div>
                    </div>
                    <button
                      onClick={sendMessage}
                      className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center"
                    >
                      <i className="ri-send-plane-fill"></i>
                    </button>
                    <button
                      onClick={() => {
                        setRecordedAudio(null);
                        setRecordedBlob(null);
                      }}
                      className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3 bg-gray-100 dark:bg-slate-800 rounded-full px-3 sm:px-4 py-2">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
                    >
                      <i className="ri-emotion-line text-xl"></i>
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-500 min-w-0 text-sm sm:text-base"
                      placeholder="Type a message..."
                    />
                    <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0 hidden sm:block">
                      <i className="ri-attachment-2 text-xl"></i>
                    </button>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        } flex-shrink-0`}
                    >
                      <i className={`ri-mic-${isRecording ? 'fill' : 'line'} text-xl`}></i>
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <i className="ri-send-plane-fill text-sm sm:text-base"></i>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center mb-6">
                <i className="ri-message-3-line text-6xl text-blue-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No chat selected</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
