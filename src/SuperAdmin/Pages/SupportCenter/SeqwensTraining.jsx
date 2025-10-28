import React, { useState } from "react";

export default function SeqwensTraining({ onAddTrainingModalToggle, showAddTrainingModal }) {

    const [selectedResourceType, setSelectedResourceType] = useState("tax-resources");

    const taxResources = [
        {
            title: "2023 Tax Checklist",
            description: "Complete list of required documents",
            type: "document"
        },
        {
            title: "2023 Tax Checklist",
            description: "Complete list of required documents", 
            type: "document"
        },
        {
            title: "Quarterly Tax Planning",
            description: "Plan ahead for next year's taxes",
            type: "document"
        }
    ];

    const videoTutorials = [
        {
            title: "How to Upload Documents",
            duration: "3 min tutorial",
            type: "video"
        },
        {
            title: "Scheduling Appointments",
            duration: "2 min tutorial",
            type: "video"
        },
        {
            title: "Electronic Signatures",
            duration: "4 min tutorial",
            type: "video"
        }
    ];

    const handleCloseModal = () => {
        onAddTrainingModalToggle(false);
    };

    const handleResourceTypeChange = (e) => {
        setSelectedResourceType(e.target.value);
    };

    const buttonText =
    selectedResourceType === "tax-resources"
      ? "Upload Files"
      : selectedResourceType === "video-tutorials"
      ? "Upload Video"
      : "Upload";


    return (
        <div className="space-y-6 mb-10">

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column - Tax Resources */}
                <div className="space-y-4 bg-white rounded-lg p-4 h-fit">
                    <div>
                        <h5 className="text-lg font-bold text-[#3B4A66] mb-2">
                            Tax Resources
                        </h5>
                        <p className="text-gray-500 text-sm">
                            Helpful tax information and guides
                        </p>
                    </div>

                    <div className="space-y-3  ">
                        {taxResources.map((resource, index) => (
                            <div key={index} className="bg-[#FFF4E6] border-1 border-[#F49C2D] rounded-lg p-2 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.33333 0.5V2.83333C6.33333 3.14275 6.45625 3.4395 6.67504 3.65829C6.89383 3.87708 7.19058 4 7.5 4H9.83333M4 4.58333H2.83333M7.5 6.91667H2.83333M7.5 9.25H2.83333M6.91667 0.5H1.66667C1.35725 0.5 1.0605 0.622916 0.841709 0.841709C0.622916 1.0605 0.5 1.35725 0.5 1.66667V11C0.5 11.3094 0.622916 11.6062 0.841709 11.825C1.0605 12.0438 1.35725 12.1667 1.66667 12.1667H8.66667C8.97609 12.1667 9.27283 12.0438 9.49162 11.825C9.71042 11.6062 9.83333 11.3094 9.83333 11V3.41667L6.91667 0.5Z" stroke="#00C0C6" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>

                                    <div>
                                    <h6 className="font-semibold text-[#3B4A66] text-xs">
                                            {resource.title}
                                        </h6>
                                        <p className="text-gray-500 text-xs">
                                            {resource.description}
                                        </p>
                                    </div>
                                </div>
                                <button className="px-1 py-0.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors">
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column - Video Tutorials */}
                <div className="space-y-4 bg-white rounded-lg p-4 h-fit">
                    <div>
                        <h5 className="text-lg font-bold text-[#3B4A66] mb-2">
                            Video Tutorials
                        </h5>
                        <p className="text-gray-500 text-sm">
                            Learn how to use the platform
                        </p>
                    </div>

                    <div className="space-y-3">
                        {videoTutorials.map((tutorial, index) => (
                            <div key={index} className="bg-[#FFF4E6]  border-1 border-[#F49C2D] rounded-lg p-2  flex items-center justify-between ">
                                <div className="flex items-center space-x-3">
                                <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_3382_2733)">
<path d="M17.6025 2.02764C17.4992 1.63573 17.2978 1.27844 17.0183 0.991342C16.7388 0.704247 16.391 0.497366 16.0095 0.3913C14.6126 0 8.99087 0 8.99087 0C8.99087 0 3.36883 0.0118444 1.972 0.403144C1.59045 0.509217 1.24261 0.716109 0.963115 1.00322C0.683623 1.29033 0.482232 1.64763 0.378998 2.03956C-0.0435099 4.58885 -0.207408 8.4734 0.390599 10.9207C0.493844 11.3126 0.69524 11.6699 0.974731 11.957C1.25422 12.2441 1.60206 12.451 1.9836 12.5571C3.38043 12.9484 9.00233 12.9484 9.00233 12.9484C9.00233 12.9484 14.6242 12.9484 16.0209 12.5571C16.4025 12.451 16.7503 12.2441 17.0298 11.957C17.3093 11.6699 17.5107 11.3126 17.614 10.9207C18.0596 8.36781 18.197 4.48565 17.6025 2.02764Z" fill="#FF0000"/>
<path d="M7.20312 9.24849L11.8668 6.47385L7.20312 3.69922V9.24849Z" fill="white"/>
</g>
<defs>
<clipPath id="clip0_3382_2733">
<rect width="18" height="13" fill="white"/>
</clipPath>
</defs>
</svg>


                                    <div>
                                        <h6 className="font-semibold text-[#3B4A66] text-xs">
                                            {tutorial.title}
                                        </h6>
                                        <p className="text-gray-500 text-xs">
                                            {tutorial.duration}
                                        </p>
                                    </div>
                                </div>
                                <button className="px-1 py-0.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors">
                                    Watch Video
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add New Modal */}
            {showAddTrainingModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ margin: 0, padding: 0 }}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-[#00000099]"></div>
                    
                    {/* Modal */}
                    <div className="relative bg-white rounded-lg w-[450px] p-2" style={{ margin: 0 }}>
                        {/* Header */}
                        <div className="flex items-center justify-between pt-3 pl-3">
                            <h2 className="text-xl font-semibold text-gray-800">Add Resources</h2>
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
                        <div className="p-3 space-y-1">
                            {/* Resource Type Dropdown */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Select the what you want to upload.
                                </label>
                                <select value={selectedResourceType} onChange={(e) => setSelectedResourceType(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="tax-resources">Tax Resources</option>
                                    <option value="video-tutorials">Video Tutorials</option>
                                </select>
                            </div>

                            {/* Title Field */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter title"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Description Field */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    placeholder="Enter description..."
                                    rows={2}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* File Upload Section */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Upload File
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <div className="flex items-center justify-between px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white">
                                        <label
                                            htmlFor="file-upload"
                                            className="flex-1 cursor-pointer text-gray-500 hover:text-gray-700"
                                        >
                                            Choose file to upload
                                        </label>
                                        <button 
                                            className="px-3 py-1 text-sm bg-[#E8F0FF] text-black rounded-lg hover:bg-blue-100 transition-colors" 
                                            style={{ borderRadius: '7px' }}
                                        >   
                                            {buttonText}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end space-x-3 p-2 gap-2">
                            <button
                                onClick={handleCloseModal}
                                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                style={{ borderRadius: '7px' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
