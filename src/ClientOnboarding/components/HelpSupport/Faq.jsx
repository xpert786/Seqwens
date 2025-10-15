import React, { useState } from "react";
import { FaSearch,FaChevronDown } from "react-icons/fa";


export default function Faq() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How do I upload my tax documents?",
      a: "You can upload documents by going to the ‘My Documents’ section and clicking the ‘Upload Documents’ button. Supported formats include PDF, JPG, PNG, and common document formats.",
    },
    {
      q: "When will my tax return be completed?",
      a: "Tax return completion times vary based on complexity. Simple returns typically take 3-5 business days, while more complex returns may take 7-10 business days. You’ll receive notifications as your return progresses.",
    },
    {
      q: "How do I make a payment for my invoice?",
      a: "You can pay invoices online through the ‘Invoices & Payments’ section. We accept credit cards, debit cards, and bank transfers. All payments are processed securely.",
    },
    {
      q: "Can I schedule an appointment with my tax professional?",
      a: "Yes! Go to the ‘Appointments’ section to view available time slots and schedule meetings. You can choose between in-person, phone, or video consultations.",
    },
    {
      q: "How do I sign documents electronically?",
      a: "Electronic signatures are handled through the ‘E-Signatures’ section. You’ll receive notifications when documents need your signature, and you can sign them directly in your browser.",
    },
    {
      q: "Is my personal information secure?",
      a: "Yes, we use bank-level encryption and security measures to protect your data. All information is stored securely and access is strictly controlled.",
    },
  ];

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

      {/* Accordion */}
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="rounded mb-2"
          style={{ border: "1px solid #E8F0FF", backgroundColor: "#FFFFFF", borderRadius: "10px" }}
        >

          <button
            className="w-100 text-start d-flex justify-content-between align-items-center px-3 py-2 border-0 bg-white fw-semibold"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            style={{ fontSize: "16px", color: "#3B4A66", border: "1px solid #E8F0FF", fontWeight: "500", fontFamily: "BasisGrotesquePro", }}
          >
            {faq.q}
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
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>

  );
}

