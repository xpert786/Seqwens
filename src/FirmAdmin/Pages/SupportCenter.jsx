import React from 'react';

export default function SupportCenter() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
        <p className="text-gray-600">Get help and support</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
          <p className="text-gray-600 mb-4">Browse our comprehensive guides and tutorials</p>
          <button className="text-blue-600 hover:text-blue-800">View Docs</button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Support</h3>
          <p className="text-gray-600 mb-4">Get in touch with our support team</p>
          <button className="text-blue-600 hover:text-blue-800">Contact Us</button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQ</h3>
          <p className="text-gray-600 mb-4">Find answers to common questions</p>
          <button className="text-blue-600 hover:text-blue-800">View FAQ</button>
        </div>
      </div>
    </div>
  );
}
