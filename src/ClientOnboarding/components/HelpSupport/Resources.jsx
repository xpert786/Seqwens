import React, { useEffect, useState } from "react";
import { FaYoutube } from "react-icons/fa";
import { FileIcon } from "../icons";
import { taxpayerPublicAPI } from "../../utils/apiUtils";

const Resources = () => {
  const [activeCard, setActiveCard] = useState({ type: null, index: null });
  const [taxResources, setTaxResources] = useState([]);
  const [videoTutorials, setVideoTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchResources = async () => {
      setLoading(true);
      setError(null);
      try {
        const [taxRes, videoRes] = await Promise.all([
          taxpayerPublicAPI.getTaxResources(),
          taxpayerPublicAPI.getVideoTutorials(),
        ]);

        if (!isMounted) return;

        setTaxResources(taxRes?.data || []);
        setVideoTutorials(videoRes?.data || []);
      } catch (err) {
        if (!isMounted) return;
        setTaxResources([]);
        setVideoTutorials([]);
        setError(err?.message || "Unable to load public resources right now.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchResources();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderPlaceholderCard = (keyPrefix) => (
    <div
      key={keyPrefix}
      className="d-flex justify-content-between align-items-center p-3 mb-3 rounded-3"
      style={{
        backgroundColor: "#F9FAFB",
        border: "1px solid #E8F0FF",
        minHeight: "68px",
      }}
    >
      <div
        style={{
          width: "70%",
          height: "14px",
          backgroundColor: "#E5E7EB",
          borderRadius: "8px",
        }}
      />
      <div
        style={{
          width: "20%",
          height: "12px",
          backgroundColor: "#F3F4F6",
          borderRadius: "8px",
        }}
      />
    </div>
  );

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
          const downloadLink = res.file || res.video_file || res.video_url;
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
                href={downloadLink || undefined}
                download={Boolean(res.file)}
                target={res.file ? "_self" : "_blank"}
                rel="noopener noreferrer"
                className={`btn${downloadLink ? "" : " disabled"}`}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8F0FF",
                  fontSize: "12px",
                  borderRadius: "8px",
                  color: downloadLink ? "#3B4A66" : "#9CA3AF",
                  textDecoration: "none",
                  fontWeight: "400",
                  pointerEvents: downloadLink ? "auto" : "none",
                }}
              >
                {downloadLink ? "Open" : "Unavailable"}
              </a>
            </div>
          );
        })}

        {!loading && taxResources.length === 0 && !error && (
          <div
            className="text-center text-muted py-2"
            style={{ fontFamily: "BasisGrotesquePro", fontSize: "13px" }}
          >
            No public tax resources available yet.
          </div>
        )}

        {loading &&
          Array.from({ length: 3 }).map((_, idx) =>
            renderPlaceholderCard(`tax-placeholder-${idx}`)
          )}
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
          const watchUrl = video.video_url || video.video_file || video.file;
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
                href={watchUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn btn-sm${watchUrl ? "" : " disabled"}`}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8F0FF",
                  fontSize: "12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "400",
                  color: watchUrl ? "#3B4A66" : "#9CA3AF",
                  pointerEvents: watchUrl ? "auto" : "none",
                }}
              >
                {watchUrl ? "Watch Video" : "Unavailable"}
              </a>
            </div>
          );
        })}

        {!loading && videoTutorials.length === 0 && !error && (
          <div
            className="text-center text-muted py-2"
            style={{ fontFamily: "BasisGrotesquePro", fontSize: "13px" }}
          >
            No video tutorials are available right now.
          </div>
        )}

        {loading &&
          Array.from({ length: 3 }).map((_, idx) =>
            renderPlaceholderCard(`video-placeholder-${idx}`)
          )}
      </div>

      {error && (
        <div
          className="w-100 alert alert-warning mt-2"
          style={{ fontSize: "13px", fontFamily: "BasisGrotesquePro" }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default Resources;
