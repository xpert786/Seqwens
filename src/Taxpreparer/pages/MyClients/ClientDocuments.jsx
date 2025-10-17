import React from "react";
import { useNavigate } from "react-router-dom";
import { File } from "../../component/icons";

export default function ClientDocuments() {
  const navigate = useNavigate();
  
  const documents = [
    {
      id: 1,
      title: "John Doe - 2023 Tax Return",
      owner: "John Doe",
      docsCount: 8,
      date: "03/06/2024"
    },
    {
      id: 2,
      title: "Sarah Wilson - Individual Return",
      owner: "Sarah Wilson",
      docsCount: 6,
      date: "02/14/2024"
    },
    {
      id: 3,
      title: "ABC Corp - Business Documents",
      owner: "ABC Corp",
      docsCount: 12,
      date: "03/11/2024"
    },
    {
      id: 4,
      title: "Tax Form Templates",
      owner: "System",
      docsCount: 25,
      date: "01/10/2024"
    }
  ];

  return (
    <div className="mt-6">
      <div className="bg-white rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--Palette2-Dark-blue-900, #3B4A66)" }}>Client Folders</h3>
            <p className="text-sm text-gray-500">Organized document folders by client</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, idx) => (
            <div
              key={doc.id}
              className="document-card rounded-xl p-4 flex flex-col justify-between"
              style={{
                border: "1px solid var(--Palette2-Dark-blue-100, #E8F0FF)",
                cursor: idx === 0 ? "pointer" : "default",
              }}
              onClick={() => {
                if (idx === 0) navigate("/taxdashboard/documents/all");
              }}
            >
              {/* Header row: icon left, badge right */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-orange-500"><File /></div>
                <span className="text-xs text-white px-2 py-0.5 rounded-full" style={{ background: "var(--Palette2-Gold-800, #F49C2D)" }}>
                  Client Folder
                </span>
              </div>
              <div className="font-medium text-gray-800">{doc.title}</div>
              <div className="text-gray-500 text-xs">{doc.owner}</div>
              {/* Footer row: documents count left, date right */}
              <div className="flex items-center justify-between text-gray-400 text-xs mt-2">
                <div>{doc.docsCount} documents</div>
                <div>{doc.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
