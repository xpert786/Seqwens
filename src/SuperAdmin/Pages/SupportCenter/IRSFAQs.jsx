import React, { useState } from "react";

export default function IRSFAQs({ onAddFAQModalToggle, showAddFAQModal }) {
    const [expandedItems, setExpandedItems] = useState([0, 1, 2, 3, 4, 5]); // All items expanded by default
    const [searchTerm, setSearchTerm] = useState("");
    const [newFAQ, setNewFAQ] = useState({ title: "", description: "" });

    const faqData = [
        {
            question: "How do I upload my tax documents?",
            answer: "You can upload documents by going to the 'My Documents' section and clicking the 'Upload Documents' button. Supported formats include PDF, JPG, PNG, and common document formats."
        },
        {
            question: "When will my tax return be completed?",
            answer: "Tax return completion times vary based on complexity. Simple returns typically take 3-5 business days, while more complex returns may take 7-10 business days. You'll receive notifications as your return progresses."
        },
        {
            question: "How do I make a payment for my invoice?",
            answer: "You can pay invoices online through the 'Invoices & Payments' section. We accept credit cards, debit cards, and bank transfers. All payments are processed securely."
        },
        {
            question: "Can I schedule an appointment with my tax professional?",
            answer: "Yes! Go to the 'Appointments' section to view available time slots and schedule meetings. You can choose between in-person, phone, or video consultations."
        },
        {
            question: "How do I sign documents electronically?",
            answer: "Electronic signatures are handled through the 'E-Signatures' section. You'll receive notifications when documents need your signature, and you can sign them directly in your browser."
        },
        {
            question: "Is my personal information secure?",
            answer: "Yes, we use bank-level encryption and security measures to protect your data. All information is stored securely and access is strictly controlled."
        }
    ];

    const filteredFAQs = faqData.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpanded = (index) => {
        setExpandedItems(prev => 
            prev.includes(index) 
                ? prev.filter(item => item !== index)
                : [...prev, index]
        );
    };


    const handleCloseModal = () => {
        onAddFAQModalToggle(false);
        setNewFAQ({ title: "", description: "" });
    };

    const handleSubmitFAQ = () => {
        if (newFAQ.title.trim() && newFAQ.description.trim()) {
            // Add new FAQ to the list
            faqData.push({
                question: newFAQ.title,
                answer: newFAQ.description
            });
            onAddFAQModalToggle(false);
            setNewFAQ({ title: "", description: "" });
        }
    };

    return (
        <div className=" min-h-screen ">
            <div className="max-w-4xl mx-auto">
                {/* Main Container */}
                <div className="bg-white rounded-lg  border border-gray-200">
                    {/* Header Section */}
                    <div className="p-8">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-[#3B4A66] mb-2">
                                    Frequently Asked Questions
                                </h3>
                                <p className="text-gray-500 text-lg mb-6">
                                    Find quick answers to common questions
                                </p>
                                
                                {/* Search Bar */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ borderRadius: '7px' }}>
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search FAQs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                                    />
                                </div>
                            </div>
                            
                        </div>
                    </div>

                    {/* FAQ Items */}
                    <div>
                        {filteredFAQs.map((faq, index) => (
                            <div key={index} className="p-4 last:border-b-0">
                                <div className=" border-2  border-[#E8F0FF] p-3 rounded-lg ">
                                <div  
                                    className="flex justify-between items-start cursor-pointer"
                                    onClick={() => toggleExpanded(index)}
                                >
                                    <h5 className="text-xs font-semibold text-gray-800 ">
                                        {faq.question}
                                    </h5>
                                    <div className="flex-shrink-0">
                                        <svg 
                                            className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                                                expandedItems.includes(index) ? 'rotate-180' : ''
                                            }`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                
                                {expandedItems.includes(index) && (
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add FAQ Modal */}
            {showAddFAQModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    {/* Backdrop with blur effect */}
                    <div className="absolute inset-0 bg-[#00000099]"></div>
                    
                    {/* Modal */}
                    <div className="relative bg-white rounded-lg  w-[450px] p-2">
                        {/* Header */}
                        <div className="flex items-center justify-between pt-3 pl-3 ">
                            <h2 className="text-xl font-semibold text-gray-800">Add New FAQs</h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="24" height="24" rx="12" fill="#E8F0FF"/>
<path d="M16.065 8.99502C16.1367 8.92587 16.1939 8.84314 16.2332 8.75165C16.2726 8.66017 16.2933 8.56176 16.2942 8.46218C16.2951 8.3626 16.2762 8.26383 16.2385 8.17164C16.2009 8.07945 16.1452 7.99568 16.0748 7.92523C16.0044 7.85478 15.9207 7.79905 15.8286 7.7613C15.7364 7.72354 15.6377 7.70452 15.5381 7.70534C15.4385 7.70616 15.3401 7.7268 15.2485 7.76606C15.157 7.80532 15.0742 7.86242 15.005 7.93402L11.999 10.939L8.99402 7.93402C8.92536 7.86033 8.84256 7.80123 8.75056 7.76024C8.65856 7.71925 8.55925 7.69721 8.45854 7.69543C8.35784 7.69365 8.25781 7.71218 8.16442 7.7499C8.07104 7.78762 7.9862 7.84376 7.91498 7.91498C7.84376 7.9862 7.78762 8.07103 7.7499 8.16442C7.71218 8.25781 7.69365 8.35784 7.69543 8.45854C7.69721 8.55925 7.71925 8.65856 7.76024 8.75056C7.80123 8.84256 7.86033 8.92536 7.93402 8.99402L10.937 12L7.93202 15.005C7.79954 15.1472 7.72742 15.3352 7.73085 15.5295C7.73427 15.7238 7.81299 15.9092 7.9504 16.0466C8.08781 16.1841 8.2732 16.2628 8.4675 16.2662C8.6618 16.2696 8.84985 16.1975 8.99202 16.065L11.999 13.06L15.004 16.066C15.1462 16.1985 15.3342 16.2706 15.5285 16.2672C15.7228 16.2638 15.9082 16.1851 16.0456 16.0476C16.1831 15.9102 16.2618 15.7248 16.2652 15.5305C16.2686 15.3362 16.1965 15.1482 16.064 15.006L13.061 12L16.065 8.99502Z" fill="#3B4A66"/>
</svg>

                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-3 space-y-2">
                            {/* Title Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={newFAQ.title}
                                    onChange={(e) => setNewFAQ(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter title"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Description Field */}
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newFAQ.description}
                                    onChange={(e) => setNewFAQ(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter description..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end space-x-3 p-3  gap-2">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                style={{ borderRadius: '7px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitFAQ}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors" 
                                style={{ borderRadius: '7px' }}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
