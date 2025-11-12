import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, fetchWithCors } from '../../../../ClientOnboarding/utils/corsConfig';
import { getAccessToken } from '../../../../ClientOnboarding/utils/userUtils';
import { handleAPIError } from '../../../../ClientOnboarding/utils/apiUtils';

export default function AssignedClientsTab({ staffId }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffName, setStaffName] = useState('');
  const [totalClients, setTotalClients] = useState(0);

  useEffect(() => {
    if (staffId) {
      fetchAssignedClients();
    }
  }, [staffId]);

  const fetchAssignedClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE_URL = getApiBaseUrl();
      const token = getAccessToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${API_BASE_URL}/firm/staff/${staffId}/clients/`;

      const config = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await fetchWithCors(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setClients(result.data.clients || []);
        setStaffName(result.data.staff_name || '');
        setTotalClients(result.data.total_clients || 0);
      } else {
        throw new Error(result.message || 'Failed to fetch assigned clients');
      }
    } catch (err) {
      console.error('Error fetching assigned clients:', err);
      setError(handleAPIError(err));
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Map API data to component format
  const mappedClients = clients.map((client) => ({
    id: client.id,
    name: client.client_name || 'N/A',
    company: client.company || 'Individual',
    status: client.status ? client.status.charAt(0).toUpperCase() + client.status.slice(1) : 'Active',
    lastContact: client.last_contact || 'N/A',
    avatar: client.initials || (client.client_name ? client.client_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'NA')
  }));

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600 font-[BasisGrotesquePro]">Loading assigned clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h5 className="text-lg font-semibold text-gray-900 font-[BasisGrotesquePro]">
            Assigned Clients ({totalClients || mappedClients.length})
          </h5>
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mt-1">
            {staffName ? `Clients currently managed by ${staffName}` : 'Clients currently managed by this staff member'}
          </p>
        </div>
        <button className="px-4 py-2 !border border-[#E8F0FF] text-gray-700 !rounded-lg hover:bg-gray-200 transition font-[BasisGrotesquePro] flex items-center gap-2 text-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.6668 14V12.6667C10.6668 11.9594 10.3859 11.2811 9.88578 10.781C9.38568 10.281 8.70741 10 8.00016 10H4.00016C3.29292 10 2.61464 10.281 2.11454 10.781C1.61445 11.2811 1.3335 11.9594 1.3335 12.6667V14M12.6668 5.33333V9.33333M14.6668 7.33333H10.6668M8.66683 4.66667C8.66683 6.13943 7.47292 7.33333 6.00016 7.33333C4.5274 7.33333 3.3335 6.13943 3.3335 4.66667C3.3335 3.19391 4.5274 2 6.00016 2C7.47292 2 8.66683 3.19391 8.66683 4.66667Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Reassign Clients
        </button>
      </div>
      
      {mappedClients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">No assigned clients found</p>
        </div>
      ) : (
        <>
          {/* Table Structure */}
          <div className="overflow-x-auto">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 mb-3 pb-3 ">
              <div className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">Client Name</div>
              <div className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">Company</div>
              <div className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">Status</div>
              <div className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-[BasisGrotesquePro]">Last Contact</div>
            </div>
            
            {/* Table Body */}
            <div className="space-y-3">
              {mappedClients.map((client) => (
                <div key={client.id} className="grid grid-cols-4 gap-4 items-center !border border-[#E8F0FF] rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center text-white font-semibold text-sm">
                      {client.avatar}
                    </div>
                    <span className="text-sm font-medium !text-[#3B4A66] font-[BasisGrotesquePro]">{client.name}</span>
                  </div>
                  <div>
                    <span className="text-sm !text-[#3B4A66] font-[BasisGrotesquePro] font-medium">{client.company}</span>
                  </div>
                  <div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ml-3 ${
                      client.status === 'Active' 
                        ? 'bg-[#22C55E] text-white' 
                        : 'bg-[#FBBF24] text-white'
                    } font-[BasisGrotesquePro]`}>
                      {client.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-[#3B4A66] font-[BasisGrotesquePro] ml-10 font-medium">{client.lastContact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

