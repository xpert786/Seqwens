import React, { useState, useEffect } from "react";
import { FaPaperPlane, FaSearch } from "react-icons/fa";
import { ConverIcon, JdIcon, FileIcon, PlusIcon, DiscusIcon, PLusIcon } from "../components/icons";
import { getAccessToken } from "../utils/userUtils";
import { getApiBaseUrl } from "../utils/corsConfig";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [chatSubject, setChatSubject] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [superadminId, setSuperadminId] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);
  const [superadmins, setSuperadmins] = useState([]);
  const [loadingSuperadmins, setLoadingSuperadmins] = useState(false);

  const API_BASE_URL = getApiBaseUrl();

  // Fetch superadmins from API
  const fetchSuperadmins = async () => {
    try {
      setLoadingSuperadmins(true);
      const token = getAccessToken();
      const apiUrl = `${API_BASE_URL}/user/superadmins/`;

      console.log('Fetching superadmins from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch superadmins');
      }

      const data = await response.json();
      console.log('Superadmins API Response:', data);

      if (data.success && data.data && data.data.superadmins) {
        setSuperadmins(data.data.superadmins);
        console.log('✅ Superadmins loaded:', data.data.superadmins.length);
      } else {
        setSuperadmins([]);
      }
    } catch (err) {
      console.error('Error fetching superadmins:', err);
      setSuperadmins([]);
    } finally {
      setLoadingSuperadmins(false);
    }
  };

  // Fetch superadmins when modal opens
  useEffect(() => {
    if (showModal) {
      fetchSuperadmins();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  // Fetch chats from API
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = getAccessToken();
        const apiUrl = `${API_BASE_URL}/user/chats/`;
        
        console.log('Fetching chats from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chats');
        }

        const data = await response.json();
        
        console.log('API Response:', data);
        
        if (data.success && data.chats) {
          // Transform API data to match component structure
          const transformedChats = data.chats.map(chat => ({
            id: chat.id,
            name: chat.taxpayer_name || chat.superadmin_name || 'Unknown User',
            lastMessage: chat.last_message_preview || 'No message',
            time: chat.last_message_at_formatted || 'N/A',
            status: chat.status,
            unreadCount: chat.unread_count || 0,
            createdAt: chat.created_at_formatted,
            subject: chat.subject,
            // Store additional data
            superadminName: chat.superadmin_name,
            taxpayerName: chat.taxpayer_name,
            // Initialize messages array for each chat
            messages: [],
          }));
          
          console.log('Transformed chats:', transformedChats);
          console.log('Number of conversations:', transformedChats.length);
          
          setConversations(transformedChats);
          console.log('✅ Conversations state set');
          
          // Set first chat as active if available
          if (transformedChats.length > 0) {
            console.log('Setting active conversation ID:', transformedChats[0].id);
            console.log('First conversation data:', transformedChats[0]);
            setActiveConversationId(transformedChats[0].id);
          }
        } else {
          console.log('No chats in response');
          setConversations([]);
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError(err.message || 'Failed to load chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  ) || null;


  const handleSend = async () => {
    if (newMessage.trim() === "" || !activeConversationId) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    try {
      const token = getAccessToken();
      
      const payload = {
        chat: activeConversationId,
        content: messageText
      };

      console.log('Sending message with payload:', payload);

      const response = await fetch(`${API_BASE_URL}/user/messages/send/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Send message response:', data);

      if (response.ok && data.success) {
        // Update conversations with the new message
        const updatedConversations = conversations.map((conv) =>
          conv.id === activeConversationId
            ? {
              ...conv,
              messages: [
                ...conv.messages,
                {
                  id: data.message_data.id,
                  type: "user",
                  text: data.message_data.content,
                  date: data.message_data.created_at_formatted,
                  sender: data.message_data.sender_name,
                },
              ],
              lastMessage: data.message_data.content,
              time: data.message_data.created_at_formatted,
            }
            : conv
        );
        setConversations(updatedConversations);
        
        console.log('✅ Message sent successfully');
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Restore the message to input on error
      setNewMessage(messageText);
      alert('Failed to send message: ' + err.message);
    }
  };


  const handleCreateChat = async () => {
    if (chatSubject.trim() === "" || !superadminId) {
      alert('Please fill in subject and select a superadmin');
      return;
    }

    try {
      setCreatingChat(true);
      const token = getAccessToken();
      
      const payload = {
        subject: chatSubject,
        superadmin_id: parseInt(superadminId),
        initial_message: chatMessage.trim() || "Hello, I need assistance with my taxes."
      };

      console.log('Creating chat with payload:', payload);

      const response = await fetch(`${API_BASE_URL}/user/chats/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Create chat response:', data);

      if (response.ok && data.success) {
        // Transform the created chat to match component structure
        const newChat = {
          id: data.chat.id,
          name: data.chat.superadmin_name || 'Admin',
          lastMessage: data.chat.last_message?.content || chatMessage || 'No message',
          time: data.chat.last_message_at_formatted || 'N/A',
          status: data.chat.status,
          unreadCount: data.chat.unread_count || 0,
          subject: data.chat.subject,
          createdAt: data.chat.created_at_formatted,
          superadminName: data.chat.superadmin_name,
          taxpayerName: data.chat.taxpayer_name,
          messages: [],
        };

        // Add the new chat to the beginning of conversations list
        setConversations([newChat, ...conversations]);
        setActiveConversationId(newChat.id);
        
        // Reset form
        setShowModal(false);
        setChatSubject("");
        setChatMessage("");
        setAttachedFiles([]);
        setSuperadminId("");
        
        console.log('✅ Chat created successfully:', newChat);
      } else {
        throw new Error(data.message || 'Failed to create chat');
      }
    } catch (err) {
      console.error('Error creating chat:', err);
      alert('Failed to create chat: ' + err.message);
    } finally {
      setCreatingChat(false);
    }
  };


  const handleFileChange = (e) => {
    setAttachedFiles(Array.from(e.target.files));
  };

  // Debug logging - useEffect to track conversations changes
  useEffect(() => {
    console.log('🔄 Conversations state changed:', {
      conversations: conversations,
      conversationsLength: conversations.length,
      loading: loading,
      error: error,
      activeConversationId: activeConversationId,
      activeConversation: activeConversation
    });
    
    if (conversations.length > 0) {
      console.log('📝 First conversation details:', conversations[0]);
    }
  }, [conversations, loading, error, activeConversationId, activeConversation]);
  
  // Component render logging
  console.log('🎨 Messages Component Rendering:', {
    conversations: conversations,
    conversationsLength: conversations.length,
    loading: loading,
    error: error,
    activeConversationId: activeConversationId
  });

  return (
    <div className="px-4">

      <div className="d-flex justify-content-between align-items-center mb-3 px-2">
        <div>
          <h5 className="mb-0" style={{ color: "#3B4A66", fontSize: "26px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}>Messages</h5>
          <small style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "400", fontFamily: "BasisGrotesquePro", }}>Communicate with your tax professional</small>
        </div>
        <button
          className="btn d-flex align-items-center"
          style={{ backgroundColor: "#F56D2D", color: "#FFFFFF", fontFamily: "BasisGrotesquePro" }}
          onClick={() => setShowModal(true)}
        >
          <span className="me-2 text-white" ><PLusIcon /></span>
          New Message
        </button>

      </div>

      <div className="d-flex flex-grow-1 overflow-hidden">

        <div className="p-3 me-3 d-flex flex-column" style={{ width: "500px", height: "55vh", border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF", borderRadius: "12px", minHeight: "400px" }}>
          <div className="mb-2">
            <h5 className="mb-3" style={{ color: "#3B4A66", fontSize: "16px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Conversations</h5>


            <div style={{ position: "relative", width: "100%" }}>
              <FaSearch
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6c757d",
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                style={{
                  fontFamily: "BasisGrotesquePro",
                  paddingLeft: "35px",
                }}
              />
            </div>

          </div>
          <div className="flex-grow-1 overflow-auto d-flex flex-column mt-3" style={{ gap: "12px" }}>
            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted small">Loading conversations...</p>
              </div>
            )}
            
            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-5">
                <p className="text-danger small">{error}</p>
                <button 
                  className="btn btn-sm btn-outline-primary mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            )}
            
            {/* Empty State */}
            {!loading && !error && conversations.length === 0 && (
              <div className="text-center py-5">
                <ConverIcon className="text-muted mb-3" size={48} />
                <p className="text-muted small mb-0">No conversations yet</p>
                <p className="text-muted small">Start a new message to begin</p>
              </div>
            )}
            
            {/* Conversations List */}
            {!loading && !error && conversations.length > 0 && (
              <div style={{ width: "100%" }}>
                {console.log('🎯 Rendering conversations list, count:', conversations.length)}
                {conversations.map((conv, index) => {
                  console.log(`📦 Rendering conversation ${index + 1}:`, conv);
                  return (
                  <div
                    key={conv.id || `conv-${index}`}
                    className="conversation-item p-3"
                    style={{ 
                      cursor: "pointer", 
                      border: "2px solid #E8F0FF", 
                      backgroundColor: conv.id === activeConversationId ? "#E8F0FF" : "#F3F7FF", 
                      borderRadius: "12px", 
                      fontFamily: "BasisGrotesquePro", 
                      color: "#3B4A66",
                      marginBottom: index < conversations.length - 1 ? "12px" : "0",
                      width: "100%",
                      minHeight: "80px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}
                    onClick={() => {
                      console.log('Clicked conversation:', conv.id);
                      setActiveConversationId(conv.id);
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center">
                        <ConverIcon className="me-2 text-primary" />
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>{conv.name}</div>
                          {conv.unreadCount > 0 && (
                            <span className="badge bg-danger" style={{ fontSize: "10px" }}>
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <small style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>{conv.time}</small>
                    </div>
                    <small style={{ marginLeft: "35px", color: "#4B5563", fontSize: "12px" }}>{conv.lastMessage || 'No message'}</small>
                    {conv.subject && (
                      <div className="mt-1 d-flex align-items-center gap-1" style={{ marginLeft: "35px", fontSize: "11px" }}>
                        <span style={{ color: "#F56D2D", fontSize: "11px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Subject:</span>
                        <span style={{ color: "#3B4A66", fontSize: "11px", fontFamily: "BasisGrotesquePro" }}>{conv.subject}</span>
                      </div>
                    )}
                    {conv.task && (
                      <div className="mt-2 d-flex align-items-center gap-1" style={{ marginLeft: "35px", fontSize: "12px" }}>
                        <span style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Task:</span>
                        <span className="px-2 py-1 rounded-pill text-dark small" style={{ backgroundColor: "#fff", border: "1px solid #ddd" }}>
                          {conv.task.current}/{conv.task.total}
                        </span>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow-1 bg-white rounded shadow-sm p-3 d-flex flex-column">
          {activeConversation ? (
            <>
              <div className="border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                <ConverIcon className="text-primary" size={20} />
                <div>
                  <h6 className="mb-0" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>{activeConversation.name}</h6>
                  <small style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>
                    {activeConversation.status === 'active' ? 'Active' : 'Closed'}
                  </small>
                </div>
              </div>

              <div className="flex-grow-1 overflow-auto mb-3">
                {activeChatMessages.length > 0 ? (
                  activeChatMessages.map((msg) => {
              if (msg.type === "system") {
                return (
                  <div key={msg.id} className="d-flex mb-3" style={{ fontFamily: "BasisGrotesquePro" }}>
                    <JdIcon color="#f97316" className="me-2" />
                    <div className="-subtle p-3 rounded" style={{ marginLeft: "10px", backgroundColor: "#FFF4E6" }}>
                      <strong style={{ fontFamily: "BasisGrotesquePro" }}>{msg.title}</strong>
                      <p style={{ fontFamily: "BasisGrotesquePro" }}>{msg.text}</p>
                      {msg.options?.map((opt, idx) => (
                        <div className="form-check small" key={idx}>
                          <input className="form-check-input" type="checkbox" />
                          <label className="form-check-labels">{opt}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else if (msg.type === "user") {
                return (
                  <div key={msg.id} className="d-flex mb-3">
                    <JdIcon color="#f97316" className="me-2" />
                    <div className="bg-light p-2 px-3 rounded " style={{ fontFamily: "BasisGrotesquePro", marginLeft: "10px" }}>{msg.text}</div>
                  </div>
                );
              } else if (msg.type === "file") {
                return (
                  <div key={msg.id} className="d-flex flex-column align-items-end mb-3">
                    <div className="p-3 rounded" style={{ backgroundColor: "#E8F0FF", maxWidth: "650px", minWidth: "450px" }}>
                      {msg.files.map((file, idx) => (
                        <div key={idx} className="d-flex align-items-center justify-content-between mb-3">
                          <FileIcon className="me-3 text-primary fs-5" />
                          <div className="p-2 bg-white rounded flex-grow-1 text-dark fw-medium" style={{ border: "1px solid #ddd", minWidth: "350px", marginLeft: "10px", fontFamily: "BasisGrotesquePro" }}>
                            {file}
                          </div>
                          <button
                            className="btn btn-sm ms-4"
                            style={{
                              background: "white",
                              border: "1px solid #ccc",
                              color: "#3B4A66",
                              borderRadius: "50%",
                              width: "26px",
                              height: "26px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                            }}
                            onClick={() => console.log(`Remove ${file}`)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
                  })
                ) : (
                  <div className="text-center py-5">
                    <p className="text-muted">No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>

              <div className="border-top pt-2">
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Write a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    style={{ fontFamily: "BasisGrotesquePro" }}
                  />
                  <button className="btn" style={{ background: "#F56D2D", color: "#fff" }} onClick={handleSend}>
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100">
              <div className="text-center">
                <ConverIcon className="text-muted mb-3" size={64} />
                <p className="text-muted mb-0">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popup Modal */}
      {showModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="bg-white p-4" style={{ width: "500px", border: "1px solid #E8F0FF", borderRadius: "16px" }}>
            <h5 className="mb-3" style={{ color: "#3B4A66", fontSize: "24px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Create a new chat</h5>
            <div className="mb-3">
              <label className="form-label" style={{ color: "#131323", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Chat Subject</label>
              <input type="text" className="form-control" placeholder="Subject" value={chatSubject}
                onChange={(e) => setChatSubject(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ color: "#131323", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Message</label>
              <textarea className="form-control" rows="3" placeholder="Write your message here.. " style={{ fontFamily: "BasisGrotesquePro" }}
                value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ color: "#131323", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>Select Superadmin *</label>
              {loadingSuperadmins ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <small className="d-block mt-2 text-muted">Loading superadmins...</small>
                </div>
              ) : (
                <select 
                  className="form-select" 
                  value={superadminId}
                  onChange={(e) => setSuperadminId(e.target.value)}
                  required
                >
                  <option value="">-- Select a Superadmin --</option>
                  {superadmins.map((superadmin) => (
                    <option key={superadmin.id} value={superadmin.id}>
                      {superadmin.full_name} ({superadmin.role_display_name}) - {superadmin.email}
                    </option>
                  ))}
                </select>
              )}
              {superadmins.length === 0 && !loadingSuperadmins && (
                <small className="text-danger">No superadmins available</small>
              )}
            </div>
            <div className="mb-3 ms-1">
              <label
                className="form-label small d-flex align-items-center"
                style={{ cursor: "pointer", gap: "8px" }}
              >
                <PlusIcon />
                <span style={{ fontFamily: "BasisGrotesquePro", color: "#131323" }}>Attach Document</span>
                <input
                  type="file"
                  multiple
                  className="d-none"
                  onChange={handleFileChange}
                />
              </label>

              {attachedFiles.length > 0 && (
                <ul className="mt-2  ms-1" style={{ fontFamily: "BasisGrotesquePro" }}>
                  {attachedFiles.map((file, idx) => (
                    <li key={idx}>{file.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="text-end">
              <button 
                className="btn btn-outline-secondary me-2" 
                onClick={() => setShowModal(false)}
                disabled={creatingChat}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ background: "#F56D2D", color: "#fff", fontFamily: "BasisGrotesquePro" }} 
                onClick={handleCreateChat}
                disabled={creatingChat || loadingSuperadmins || !superadminId}
              >
                {creatingChat ? 'Creating...' : 'Create Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






