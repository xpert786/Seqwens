import React, { useState } from "react";
import { FaPaperPlane, FaSearch } from "react-icons/fa";
import { ConverIcon, JdIcon, FileIcon, PlusIcon, DiscusIcon, PLusIcon } from "../components/icons";

const initialConversations = [
  {
    id: 1,
    name: "Seqwens Tax Co.",
    lastMessage: "Please upload all W-2s forms for 2023 tax year",
    time: "2 hours ago",
    task: { current: 3, total: 5 },
    messages: [
      {
        id: 1,
        type: "system",
        title: "Review Tax Return Draft",
        text: "Please review your 2023 tax return draft and approve or request changes.",
        options: ["Approve and e-sign", "Request changes"],
        date: "26/07/2025",
      },
      {
        id: 2,
        type: "user",
        text: "Thank You!",
        date: "26/07/2025 12:45",
      },
      {
        id: 3,
        type: "file",
        files: [
          "Tax_Return_2023_1.pdf",
          "Tax_Return_2023_2.pdf",
          "Tax_Return_2023_3.pdf",
        ],
        date: "26/07/2025 12:50",
      },
    ],
  },
];

export default function Messages() {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState(1);
  const [newMessage, setNewMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [chatSubject, setChatSubject] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );


  const handleSend = () => {
    if (newMessage.trim() === "") return;
    const updatedConversations = conversations.map((conv) =>
      conv.id === activeConversationId
        ? {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: Date.now(),
              type: "user",
              text: newMessage,
              date: new Date().toLocaleString(),
            },
          ],
          lastMessage: newMessage,
          time: "Just now",
        }
        : conv
    );
    setConversations(updatedConversations);
    setNewMessage("");
  };


  const handleCreateChat = () => {
    if (chatSubject.trim() === "" && chatMessage.trim() === "" && attachedFiles.length === 0) return;

    const newChat = {
      id: Date.now(),
      name: chatSubject || "New Chat",
      lastMessage: chatMessage || (attachedFiles.length > 0 ? `${attachedFiles.length} file(s) attached` : ""),
      time: "Just now",
      task: null,
      messages: [],
    };

    if (chatMessage.trim()) {
      newChat.messages.push({
        id: Date.now() + 1,
        type: "user",
        text: chatMessage,
        date: new Date().toLocaleString(),
      });
    }

    if (attachedFiles.length > 0) {
      newChat.messages.push({
        id: Date.now() + 2,
        type: "file",
        files: attachedFiles.map((file) => file.name),
        date: new Date().toLocaleString(),
      });
    }

    setConversations([newChat, ...conversations]);
    setActiveConversationId(newChat.id);
    setShowModal(false);
    setChatSubject("");
    setChatMessage("");
    setAttachedFiles([]);
  };


  const handleFileChange = (e) => {
    setAttachedFiles(Array.from(e.target.files));
  };

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

        <div className="p-3 me-3 d-flex flex-column" style={{ width: "500px", height: "55vh", border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF", borderRadius: "12px" }}>
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
          <div className="flex-grow-1 overflow-auto d-flex flex-column gap-2 mt-3">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-3 w-100 ${conv.id === activeConversationId ? "#F3F7FF" : ""}`}
                style={{ cursor: "pointer", border: "1px solid #E8F0FF", backgroundColor: "#F3F7FF", borderRadius: "12px", fontFamily: "BasisGrotesquePro", color: "#3B4A66" }}
                onClick={() => setActiveConversationId(conv.id)}
              >
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center">
                    <ConverIcon className="me-2 text-primary" />
                    <div style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>{conv.name}</div>
                  </div>
                  <small style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>{conv.time}</small>
                </div>
                <small style={{ marginLeft: "35px", color: "#4B5563", fontSize: "12px" }}>{conv.lastMessage}</small>
                {conv.task && (
                  <div className="mt-2 d-flex align-items-center gap-1" style={{ marginLeft: "35px", fontSize: "12px" }}>
                    <span style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>Task:</span>
                    <span className="px-2 py-1 rounded-pill text-dark small" style={{ backgroundColor: "#fff", border: "1px solid #ddd" }}>
                      {conv.task.current}/{conv.task.total}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow-1 bg-white rounded shadow-sm p-3 d-flex flex-column">
          <div className="border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
            <ConverIcon className="text-primary" size={20} />
            <div>
              <h6 className="mb-0" style={{ color: "#3B4A66", fontSize: "14px", fontWeight: "500", fontFamily: "BasisGrotesquePro" }}>{activeConversation.name}</h6>
              <small style={{ color: "#3B4A66", fontSize: "12px", fontWeight: "400", fontFamily: "BasisGrotesquePro" }}>John Doe, You</small>
            </div>
          </div>

          <div className="flex-grow-1 overflow-auto mb-3">
            {activeConversation.messages.map((msg) => {
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
            })}
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
              <button className="btn btn-outline-secondary me-2" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn" style={{ background: "#F56D2D", color: "#fff", fontFamily: "BasisGrotesquePro" }} onClick={handleCreateChat}>
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






