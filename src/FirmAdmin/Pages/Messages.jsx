import React from 'react';

export default function Messages() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Communicate with clients and staff</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">Robert Johnson</h3>
                  <p className="text-sm text-gray-600">I need help with my tax return...</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">New</span>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">Sarah Wilson</h3>
                  <p className="text-sm text-gray-600">Thank you for the quick response!</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Replied</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
