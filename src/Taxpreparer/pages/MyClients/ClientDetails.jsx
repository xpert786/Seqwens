import React from "react";
import { useLocation, useParams, useNavigate,Outlet } from "react-router-dom";
import { BlackEmail, BlackPhone, MailMiniIcon, PhoneMiniIcon,MiniClock, WhiteEdit } from "../../component/icons";


export default function ClientDetails() {
  const { clientId } = useParams();
  const location = useLocation();
  const currentPath = location.pathname;
  const isDocuments = currentPath.includes('/documents');
  const isInvoices = currentPath.includes('/invoices');
  const isSchedulePath = currentPath.includes('/schedule');
  // If user is on invoices with ?view=schedule, treat Schedules as active
  const viewParam = new URLSearchParams(location.search).get('view');
  const isScheduleViaQuery = isInvoices && viewParam === 'schedule';
  const isSchedule = isSchedulePath || isScheduleViaQuery;
  const isInvoicesActive = isInvoices && !isScheduleViaQuery;

const navigate = useNavigate();
  const defaultClient = {
    id: clientId,
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "(555) 123-4567",
    ssn: "123-45-6789",
    status: "active",
    filingStatus: "Married ",
    gender: "Male",
    dob: "August 27th, 1999",
    address: {
      line: "No 35 Jimmy Ebi Street",
      city: "Yenagoa",
      state: "Bayelsa",
      zip: "654133",
    },
    spouse: {
      name: "Xavier Woods",
      gender: "Male",
      dob: "March 27th, 1999",
      ssn: "515424561LN23",
      filingStatus: "Married Filing Jointly",
    },
  };

  const incoming = location.state?.client || {};
  const client = {
    ...defaultClient,
    ...incoming,
    address: { ...defaultClient.address, ...(incoming.address || {}) },
    spouse: { ...defaultClient.spouse, ...(incoming.spouse || {}) },
  };

  const initials = (client.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("");

  // Build statuses to render in the header badges
  const statusesForHeader = (() => {
    const base = Array.isArray(client.statuses) && client.statuses.length
      ? client.statuses
      : (client.status ? [client.status] : []);
    if (isDocuments) {
      const lower = (s) => (s || '').toLowerCase();
      const out = [...base];
      if (!out.some((s) => lower(s).includes('active'))) out.push('active');
      if (!out.some((s) => lower(s).includes('high'))) out.push('high priority');
      return out;
    }
    return base;
  })();

  return (
    <div className="p-4 font-['BasisGrotesquePro']">
       <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold font-grotesque">Client Details</h3>
          <small className="text-gray-500">Detailed information about John Doe</small>
        </div>
      </div>
     <div className="bg-white rounded-xl p-6 ">
  <div className="flex items-center justify-between">
    <div className="flex items-start gap-4">
      <div
        className="w-16 aspect-square rounded-full flex items-center justify-center text-xl font-bold"
        style={{
          backgroundColor: "var(--Palette2-Dark-blue-100, #E8F0FF)",
          color: "var(--Palette2-Dark-blue-900, #3B4A66)",
        }}
      >
        {initials}
      </div>

      <div>
        {/* Name + Status badges */}
        <div
          className="text-lg font-semibold flex items-center gap-2"
          style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}
        >
          {client.name}
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
          {statusesForHeader.map((s, i) => (
            <span key={i} className={
              (s || '').toLowerCase().includes('high')
                ? 'px-2 py-1 rounded-full bg-red-100 text-red-600 text-xs capitalize'
                : (s || '').toLowerCase().includes('active')
                ? 'px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs capitalize'
                : 'px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs capitalize'
            }>{s}</span>
          ))}
        </div>

        {(isDocuments || isInvoices || isSchedule) ? (
          <div className="mt-3">
            <div className="text-xs mb-2" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>Contact Information</div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-1 text-gray-700 text-sm">
                <BlackEmail />
                <span className="font-medium">{client.email}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-700 text-sm">
                <BlackPhone />
                <span className="font-medium">{client.phone}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex items-start gap-8">
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs mb-1">Email</span>
                <div className="flex items-center gap-2">
                  <MailMiniIcon />
                  <span className="text-gray-700 text-sm font-medium">{client.email}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs mb-1"> Phone</span>
                <div className="flex items-center gap-2">
                  <PhoneMiniIcon />
                  <span className="text-gray-700 text-sm font-medium">{client.phone}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs mb-1">Filing Status</span>
                <span className="text-gray-700 text-sm font-medium">{client.filingStatus}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs mb-1">SSN</span>
                <span className="text-gray-700 text-sm font-medium">{client.ssn || "123-45-6789"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Buttons: visible only on client page */}
    {!isDocuments && (
    <div className="flex gap-3">
  {/* Add Task Button */}
  {/* Send Message Button */}
  <button
    className="rounded-md text-sm"
    style={{
      fontSize:"15px",
      width:"131px",
      gap: "6px",
      borderRadius: "6px",
      border: "0.5px solid var(--Palette2-Orange-900, #F56D2D)",
      backgroundColor: "var(--Palette2-Orange-900, #F56D2D)",
      color: "#fff",
      padding: "5px 12px",
      opacity: 1,
    }}
  >
    Send Message
  </button>
  <button
    className="rounded-md text-sm"
    style={{
      fontSize:"15px",
      width:"131px",
      gap: "6px",
      borderRadius: "6px",
      border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
      backgroundColor: "#fff",
      color: "var(--Palette2-Dark-blue-900, #3B4A66)",
      padding: "5px 12px",
      opacity: 1,
    }}
  >
    Add Task
  </button>

  
</div>
    )}

  </div>
</div>
  <div
    className="inline-block bg-white rounded-xl mt-10 p-4"
    style={{
      border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
    }}
  >
    <div className="flex gap-3">
    {/* Info (active-like) */}
    <button
  className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
  style={{
    display: "inline-flex",
    width: "auto",
    whiteSpace: "nowrap",
    padding: "5px 12px",
    border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
    backgroundColor: currentPath === `/taxdashboard/clients/${clientId}`
      ? "var(--Palette2-TealBlue-900, #00C0C6)"
      : "#fff",
    color: currentPath === `/taxdashboard/clients/${clientId}`
      ? "#ffffff"
      : "var(--Palette2-Dark-blue-900, #3B4A66)",
    borderRadius: "7px",
  }}
  onClick={() => {
    if (currentPath !== `/taxdashboard/clients/${clientId}`) {
      navigate(`/taxdashboard/clients/${clientId}`);
    }
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "var(--Palette2-TealBlue-900, #00C0C6)";
    e.currentTarget.style.color = "#ffffff";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor =
      currentPath === `/taxdashboard/clients/${clientId}`
        ? "var(--Palette2-TealBlue-900, #00C0C6)"
        : "#fff";
    e.currentTarget.style.color = currentPath === `/taxdashboard/client/${id}` ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
  }}
>
  Info
</button>

    {/* Documents */}
    <button
      className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        display: "inline-flex",
        width: "auto",
        whiteSpace: "nowrap",
        padding: "5px 12px",
        border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
        backgroundColor: isDocuments ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff",
        color: isDocuments ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)",
        borderRadius: "7px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor =
          "var(--Palette2-TealBlue-900, #00C0C6)";
        e.currentTarget.style.color = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isDocuments
          ? "var(--Palette2-TealBlue-900, #00C0C6)"
          : "#fff";
        e.currentTarget.style.color = isDocuments ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
      }}
       onClick={() => navigate(`/taxdashboard/clients/${clientId}/documents`)}

    >
      Documents
    </button>

    {/* Invoices */}
    <button
      className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        display: "inline-flex",
        width: "auto",
        whiteSpace: "nowrap",
        padding: "5px 12px",
        border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
        backgroundColor: isInvoicesActive ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff",
        color: isInvoicesActive ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)",
        borderRadius: "7px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor =
          "var(--Palette2-TealBlue-900, #00C0C6)";
        e.currentTarget.style.color = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isInvoicesActive
          ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff";
        e.currentTarget.style.color = isInvoicesActive ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
      }}
      onClick={() => navigate(`/taxdashboard/clients/${clientId}/invoices`)}
    >
      Invoices
    </button>

    {/* Schedules */}
    <button
      className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        display: "inline-flex",
        width: "auto",
        whiteSpace: "nowrap",
        padding: "5px 12px",
        border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
        backgroundColor: isSchedule ? "var(--Palette2-TealBlue-900, #00C0C6)" : "#fff",
        color: isSchedule ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)",
        borderRadius: "7px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor =
          "var(--Palette2-TealBlue-900, #00C0C6)";
        e.currentTarget.style.color = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isSchedule
          ? "var(--Palette2-TealBlue-900, #00C0C6)"
          : "#fff";
        e.currentTarget.style.color = isSchedule ? "#ffffff" : "var(--Palette2-Dark-blue-900, #3B4A66)";
      }}
      onClick={() => navigate(`/taxdashboard/clients/${clientId}/schedule`)}
    >
      Schedules
    </button>
  </div>
</div>
  <Outlet />

      {!(isDocuments || isInvoices || isSchedule) && (
      <div className="flex flex-col gap-6 mt-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl p-6 ">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                Personal Information
              </div>
              <div className="text-gray-500 text-xs mt-1">Your basic personal and contact information</div>
            </div>
            <button
              className="flex items-center gap-2 rounded-md text-sm"
              style={{
                fontSize: "15px",
                borderRadius: "6px",
                border: "0.5px solid var(--Palette2-Orange-900, #F56D2D)",
                backgroundColor: "var(--Palette2-Orange-900, #F56D2D)",
                color: "#fff",
                padding: "5px 12px",
                opacity: 1,
              }}
            >
              <WhiteEdit />
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-xs "
               style={{
    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
  }}>Name</div>
              <div className="font-medium"style={{
    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
  }}>{client.name}</div>
              <div className="text-xs text-gray-500 mt-3">Social Security Number (SSN)</div>
              <div className="font-medium "style={{
    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
  }}>{client.ssn}</div>
            </div>
            <div className="flex justify-between">
              <div>
                <div className="text-xs "
                 style={{
    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
  }}>Gender</div>
                <div className="font-medium "style={{
    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
  }}>{client.gender}</div>
                <div className="text-xs text-gray-500 mt-3">Filing Status</div>
                <div className="font-medium "style={{
    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
  }}>{client.filingStatus}</div>
              </div>
              <div className="text-right">
                <div className="text-xs " style={{
    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
  }}>Date of Birth</div>
                <div className="font-medium "style={{
    color: "var(--Palette2-Dark-blue-100, #3B4A66)",
  }}>{client.dob}</div>
              </div>
            </div>
          </div>
          {/* <button className="absolute top-3 right-3 border border-gray-200 rounded-lg px-4 py-2 text-sm">Edit</button> */}
        </div>

        {/* Address and Contact Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 ">
              <div className="font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                Address
              </div>
              <div className="mt-4">
                {/* Labels Row */}
                <div className="grid grid-cols-4 gap-6 text-xs" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                  <div>Address Line</div>
                  <div>City</div>
                  <div>State</div>
                  <div>ZIP Code</div>
                </div>
                {/* Values Row */}
                <div className="grid grid-cols-4 gap-6 mt-1">
                  <div className="font-medium" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                    {client.address.line}
                  </div>
                  <div className="font-medium" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                    {client.address.city}
                  </div>
                  <div className="font-medium" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                    {client.address.state}
                  </div>
                  <div className="font-medium" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                    {client.address.zip}
                  </div>
                </div>
              </div>
            </div>

          <div className="bg-white rounded-xl p-6 ">
            <div className="font-semibold " style={{
    color: "var(--Palette2-Dark-blue-100, #4B5563)",
  }}>Contact Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--Palette2-Dark-blue-100, #4B5563)" }}>
                  <BlackPhone />
                  <span>Phone</span>

                </div>
                <div className="mt-1 text-[18px] font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                  {client.phone}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--Palette2-Dark-blue-100, #4B5563)" }}>
                  <BlackEmail />
                  <span>Email</span>
                </div>
                <div className="mt-1 text-[18px] font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                  {client.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spouse Information */}
        <div className="bg-white rounded-xl p-6 ">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-gray-900">Spouse Information</div>
              <div className="text-gray-500 text-xs">Your spouse's information for joint filing</div>
            </div>
            <button
              className="flex items-center gap-2 rounded-md text-sm"
              style={{
                fontSize: "15px",
                borderRadius: "6px",
                border: "0.5px solid var(--Palette2-Orange-900, #F56D2D)",
                backgroundColor: "var(--Palette2-Orange-900, #F56D2D)",
                color: "#fff",
                padding: "5px 12px",
                opacity: 1,
              }}
            >
              <WhiteEdit />
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-xs text-gray-500">Name</div>
              <div className="font-medium text-gray-900">{client.spouse.name}</div>
              <div className="text-xs text-gray-500 mt-3">Social Security Number (SSN)</div>
              <div className="font-medium text-gray-900">{client.spouse.ssn}</div>
            </div>
            <div className="flex justify-between">
              <div>
                <div className="text-xs text-gray-500">Gender</div>
                <div className="font-medium text-gray-900">{client.spouse.gender}</div>
                <div className="text-xs text-gray-500 mt-3">Filing Status</div>
                <div className="font-medium text-gray-900">{client.spouse.filingStatus}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Date of Birth</div>
                <div className="font-medium text-gray-900">{client.spouse.dob}</div>
              </div>
            </div>
          </div>
        </div>

         <div className="bg-white rounded-xl p-6 ">
            <div className="font-semibold " style={{
    color: "var(--Palette2-Dark-blue-100, #4B5563)",
  }}>Contact Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--Palette2-Dark-blue-100, #4B5563)" }}>
                  <BlackPhone />
                  <span>Phone</span>

                </div>
                <div className="mt-1 text-[18px] font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                  {client.phone}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--Palette2-Dark-blue-100, #4B5563)" }}>
                  <BlackEmail />
                  <span>Email</span>
                </div>
                <div className="mt-1 text-[18px] font-semibold" style={{ color: "var(--Palette2-Dark-blue-100, #3B4A66)" }}>
                  {client.email}
                </div>
              </div>
            </div>
          </div>
      </div>
      )}
    </div>
  );
}
