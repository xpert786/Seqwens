import React from 'react';

export default function UsagePerformance() {
  return (
    <div className="transition-all duration-500 ease-in-out h-fit mb-8">
      {/* Feature Adoption Rates */}
      <div className="bg-white p-6 mb-8" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>Feature Adoption Rates</h3>
          <p className="text-sm" style={{color: '#3B4A66'}}>Usage statistics for platform features across all firms</p>
        </div>
        
        <div className="space-y-4">
          {/* Document Management */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{color: '#3B4A66'}}>Document Management</span>
              <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>95% (1183 firms)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{width: '95%', backgroundColor: '#3B4A66'}}></div>
            </div>
          </div>
          
          {/* E-Signatures */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{color: '#3B4A66'}}>E-Signatures</span>
              <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>87% (1085 firms)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{width: '87%', backgroundColor: '#3B4A66'}}></div>
            </div>
          </div>
          
          {/* Client Portal */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{color: '#3B4A66'}}>Client Portal</span>
              <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>92% (1148 firms)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{width: '92%', backgroundColor: '#3B4A66'}}></div>
            </div>
          </div>
          
          {/* Billing & Payments */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{color: '#3B4A66'}}>Billing & Payments</span>
              <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>78% (973 firms)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{width: '78%', backgroundColor: '#3B4A66'}}></div>
            </div>
          </div>
          
          {/* Task Management */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{color: '#3B4A66'}}>Task Management</span>
              <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>84% (1047 firms)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{width: '84%', backgroundColor: '#3B4A66'}}></div>
            </div>
          </div>
          
          {/* Messaging */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{color: '#3B4A66'}}>Messaging</span>
              <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>89% (1110 firms)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{width: '89%', backgroundColor: '#3B4A66'}}></div>
            </div>
          </div>
          
          {/* Calendar Integration */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{color: '#3B4A66'}}>Calendar Integration</span>
              <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>72% (898 firms)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{width: '72%', backgroundColor: '#3B4A66'}}></div>
            </div>
          </div>
          
          {/* Analytics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{color: '#3B4A66'}}>Analytics</span>
              <span className="text-sm font-semibold" style={{color: '#3B4A66'}}>65% (811 firms)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{width: '65%', backgroundColor: '#3B4A66'}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* System Performance Metrics */}
      <div className="bg-white p-6 mb-8" style={{border: '1px solid #E8F0FF', borderRadius: '7px'}}>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2" style={{color: '#3B4A66'}}>System Performance Metrics</h3>
          <p className="text-sm" style={{color: '#3B4A66'}}>Real-time platform health and performance indicators</p>
        </div>
        
        <div className="grid grid-cols-3  ">
          {/* Uptime */}
            <div className="text-center p-2">
            <div className="text-3xl font-bold " style={{color: '#22C55E'}}>99.97%</div>
            <div className="text-sm font-medium" style={{color: '#3B4A66'}}>Uptime</div>
          </div>
          
          {/* Avg Response Time */}
          <div className="text-center p-2">
            <div className="text-3xl font-bold " style={{color: '#3AD6F2'}}>245ms</div>
            <div className="text-sm font-medium" style={{color: '#3B4A66'}}>Avg Response Time</div>
          </div>
          
          {/* Error Rate */}
          <div className="text-center p-2">
            <div className="text-3xl font-bold " style={{color: '#EF4444'}}>0.01%</div>
            <div className="text-sm font-medium" style={{color: '#3B4A66'}}>Error Rate</div>
          </div>
          
          {/* API Calls (24h) */}
          <div className="text-center p-2">
            <div className="text-3xl font-bold " style={{color: '#1E40AF'}}>2,847,293</div>
            <div className="text-sm font-medium" style={{color: '#3B4A66'}}>API Calls (24h)</div>
          </div>
          
          {/* Data Processed */}
          <div className="text-center p-2">
            <div className="text-3xl font-bold " style={{color: '#F49C2D'}}>1.2TB</div>
            <div className="text-sm font-medium" style={{color: '#3B4A66'}}>Data Processed</div>
          </div>
          
          {/* Active Connections */}
          <div className="text-center p-2">
            <div className="text-3xl font-bold " style={{color: '#22C55E'}}>8,432</div>
            <div className="text-sm font-medium" style={{color: '#3B4A66'}}>Active Connections</div>
          </div>
        </div>
      </div>
    </div>
  );
}

