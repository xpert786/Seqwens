import React, { useEffect, useState } from "react";
import { FaSearch, FaChevronDown } from "react-icons/fa";
import { taxpayerPublicAPI } from "../../utils/apiUtils";

export default function Faq() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    let isMounted = true;

    const fetchFaqs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await taxpayerPublicAPI.getFAQs(debouncedSearch);
        if (!isMounted) return;
        setFaqs(response?.data || []);
      } catch (err) {
        if (!isMounted) return;
        setFaqs([]);
        setError(err?.message || "Failed to load FAQs. Please try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFaqs();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  const renderSkeleton = () => (
    <div className="w-100">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="mb-3"
          style={{
            border: "1px solid #E8F0FF",
            borderRadius: "10px",
            padding: "16px",
            backgroundColor: "#F9FAFB",
          }}
        >
          <div
            style={{
              height: "14px",
              width: "60%",
              backgroundColor: "#E5E7EB",
              borderRadius: "6px",
              marginBottom: "10px",
            }}
          />
          <div
            style={{
              height: "10px",
              width: "80%",
              backgroundColor: "#F3F4F6",
              borderRadius: "6px",
            }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div >

      {/* Heading */}
      <div className="align-items-center mb-3 ">
        <h5 className=" mb-0 me-3" style={{ color: "#3B4A66", fontSize: "18px", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}>Frequently Asked Questions</h5>
        <p className="mb-0" style={{ fontSize: "14px", fontWeight: "400", color: "#4B5563", fontFamily: "BasisGrotesquePro" }} >
          Find quick answers to common questions
        </p>
      </div>
      {/* Search Bar */}
      <div className="position-relative mb-4">
        < FaSearch
          className="position-absolute"
          style={{ top: "12px", left: "12px", color: "#aaa" }}
        />
        <input
          type="text"
          className="form-control ps-5"
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ color: "#4B5563", fontWeight: "400", fontSize: "14px", fontFamily: "BasisGrotesquePro" }}
        />
      </div>

      {error && (
        <div
          className="alert alert-warning py-2 px-3"
          style={{ fontSize: "13px", fontFamily: "BasisGrotesquePro" }}
        >
          {error}
        </div>
      )}

      {loading && renderSkeleton()}

      {!loading && faqs.length === 0 && !error && (
        <div
          className="text-center py-4"
          style={{ fontSize: "14px", color: "#6B7280", fontFamily: "BasisGrotesquePro" }}
        >
          No FAQs found.
        </div>
      )}

      {/* Accordion */}
      {!loading &&
        faqs.map((faq, index) => (
          <div
            key={faq.id || index}
            className="rounded mb-2"
            style={{ border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF", borderRadius: "10px" }}
          >
            <button
              className="w-100 text-start d-flex justify-content-between align-items-center px-3 py-2 border-0 bg-white fw-semibold"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              style={{ fontSize: "16px", color: "#3B4A66", border: "1px solid #E8F0FF", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}
            >
              {faq.title || faq.q}
              <FaChevronDown
                className={`transition-transform ${openIndex === index ? "rotate-180" : ""
                  }`}
                style={{
                  fontSize: "12px",
                  color: "#3B4A66",
                  transition: "transform 0.3s ease",
                }}
              />
            </button>


            {openIndex === index && (
              <div className="px-3 pb-3" style={{ color: "#4B5563", fontWeight: "500", fontFamily: "BasisGrotesquePro", fontSize: "14px" }}>
                {faq.answer || faq.a || faq.description}
              </div>
            )}
          </div>
        ))}
    </div>

  );
}

