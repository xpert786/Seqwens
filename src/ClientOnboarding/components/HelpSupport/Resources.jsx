import React, { useState } from "react";
import { FaYoutube } from "react-icons/fa";
import { FileIcon } from "../icons";

const Resources = () => {
  const [activeCard, setActiveCard] = useState({ type: null, index: null });

  const taxResources = [
    {
      title: "2023 Tax Checklist",
      desc: "Complete list of required documents",
      file: "/files/2023_Tax_Checklist.pdf",
    },
    {
      title: "2024 Tax Checklist",
      desc: "Checklist for 2024 tax documents",
      file: "/files/2024_Tax_Checklist.pdf",
    },
    {
      title: "Quarterly Tax Planning",
      desc: "Plan ahead for future processes",
      file: "/files/Quarterly_Tax_Planning.pdf",
    },
  ];

  const videoTutorials = [
    {
      title: "How to Upload Documents",
      duration: "5 min tutorial",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      title: "Scheduling Appointments",
      duration: "7 min tutorial",
      url: "https://www.youtube.com/watch?v=abcd1234",
    },
    {
      title: "Electronic Signatures",
      duration: "4 min tutorial",
      url: "https://www.youtube.com/watch?v=wxyz5678",
    },
  ];

  return (
    <div
      className="d-flex justify-content-between flex-wrap"
      style={{ gap: "20px" }}
    >
      {/* Tax Resources */}
      <div
        className="rounded-4 p-4"
        style={{
          flex: "1",
          minWidth: "300px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8F0FF",
        }}
      >
        <div className="align-items-center mb-3 ">
          <h6
            className="mb-0 me-3"
            style={{
              fontFamily: "BasisGrotesquePro",
              fontSize: "18px",
              fontWeight: "500",
              color: "#3B4A66",
            }}
          >
            Tax Resources
          </h6>
          <p
            style={{
              fontSize: "13px",
              color: "#4B5563",
              marginBottom: "15px",
              fontFamily: "BasisGrotesquePro",
            }}
          >
            Helpful tax information and guides
          </p>
        </div>
        {taxResources.map((res, index) => {
          const isActive =
            activeCard.type === "tax" && activeCard.index === index;
          return (
            <div
              key={index}
              onClick={() => setActiveCard({ type: "tax", index })}
              className="d-flex justify-content-between align-items-center p-3 mb-3 rounded-3"
              style={{
                cursor: "pointer",
                backgroundColor: isActive ? "#FFF4E6" : "#FFFFFF",
                border: isActive ? "1px solid #F49C2D" : "1px solid #E8F0FF",
              }}
            >
              <div className="d-flex align-items-start">
                <span className="file-icon">
                  <FileIcon />
                </span>
                <div>
                  <h6
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#3B4A66",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    {res.title}
                  </h6>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#4B5563",
                      fontFamily: "BasisGrotesquePro",
                      fontWeight: "400",
                    }}
                  >
                    {res.desc}
                  </p>
                </div>
              </div>
              <a
                href={res.file}
                download
                className="btn"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8F0FF",
                  fontSize: "12px",
                  borderRadius: "8px",
                  color: "#3B4A66",
                  textDecoration: "none",
                  fontWeight: "400",
                }}
              >
                Download
              </a>
            </div>
          );
        })}
      </div>

      {/* Video Tutorials */}
      <div
        className="rounded-4 p-4"
        style={{
          flex: "1",
          minWidth: "300px",
          backgroundColor: "#fff",
          border: "1px solid #E8F0FF",
        }}
      >
        <div className="align-items-center mb-3 ">
          <h6
            className="mb-0 me-3"
            style={{
              fontFamily: "BasisGrotesquePro",
              fontSize: "18px",
              fontWeight: "500",
              color: "#3B4A66",
            }}
          >
            Video Tutorials
          </h6>
          <p
            style={{
              fontSize: "12px",
              color: "#4B5563",
              fontFamily: "BasisGrotesquePro",
              fontWeight: "400",
              marginBottom: "15px",
            }}
          >
            Learn how to use the platform
          </p>
        </div>

        {videoTutorials.map((video, index) => {
          const isActive =
            activeCard.type === "video" && activeCard.index === index;
          return (
            <div
              key={index}
              onClick={() => setActiveCard({ type: "video", index })}
              className="d-flex justify-content-between align-items-center p-3 mb-3 rounded-3"
              style={{
                cursor: "pointer",
                backgroundColor: isActive ? "#FFF4E6" : "#FFFFFF",
                border: isActive ? "1px solid #F49C2D" : "1px solid #E8F0FF",
              }}
            >
              <div className="d-flex align-items-start">
                <FaYoutube
                  style={{
                    color: "#DC2626",
                    fontSize: "20px",
                    marginRight: "10px",
                  }}
                />
                <div>
                  <h6
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#3B4A66",
                      fontFamily: "BasisGrotesquePro",
                    }}
                  >
                    {video.title}
                  </h6>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#4B5563",
                      fontFamily: "BasisGrotesquePro",
                      fontWeight: "400",
                    }}
                  >
                    {video.duration}
                  </p>
                </div>
              </div>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8F0FF",
                  fontSize: "12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "400",
                  color: "#3B4A66",
                }}
              >
                Watch Video
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Resources;
