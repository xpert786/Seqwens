import { AiOutlineCalendar } from "react-icons/ai";
import { FileIcon, BalanceIcon, MessageIcon, UpIcon, Message2Icon, Client, Clock, Check, Msg, Calender, Uploading } from "./icons";
import { useState } from "react";
import "../styles/taxdashboard.css";
import TaxUploadModal from "../upload/TaxUploadModal";
export default function Dashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div>
     
      <div className="taxdashboard-header px-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div>
            <h2 className="taxdashboard-title">Dashboard</h2>
            <h5 className="taxdashboard-subtitle">Welcome back, Michael Brown</h5>
          </div>

          <div className="d-flex flex-wrap gap-3 mt-2 mt-md-0">
            <button className="btn taxdashboard-btn btn-contacted d-flex align-items-center gap-2">
              <Calender />
              View Calender
            </button>

            {/* <button className="btn dashboard-btn btn-scan d-flex align-items-center gap-2">
              <UpIcon />
              Scan Document
            </button> */}

            <button
              className="btn taxdashboard-btn btn-uploaded d-flex align-items-center gap-2"
              onClick={() => setShowUploadModal(true)}
            >
              <Uploading />
               My Tasks
            </button>

          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="row g-3">
        {[
          {
            label:"Assigned Clients",
            icon: <Client size={26} style={{ color: "#00C0C6" }} />,
            value: "5",
            
            content: "2 ahead of target",
          },
          {
             label:"Pending Tasks",
            icon: <Clock size={26} style={{ color: "#00C0C6" }} />,
            value: "8",
            
            content: "-3 from yesterday",
          },
          {
             label:"Completed Today",
            icon: <Check size={26} style={{ color: "#00C0C6" }} />,
            value: "5",
            
            content: "2 ahead of target",
          },
          {
           label:"New Messages",
            icon: <Msg size={26} style={{ color: "#00C0C6" }} />,
            value: "3",
            
            content: "All from clients",
          },
        ].map((card, index) => (
          <div className="col-sm-6 col-md-3 px-4" key={index}>
            <div className="carded dashboard-carded">
              <div className="d-flex justify-content-between align-items-start">
              <div className="dashboarded-carded-labeled">{card.label}</div>
                  {card.icon}
               
              </div>
               <h5 className="dashboarded-carded-valued">{card.value}</h5>
              <div>

                <p className="card-contented">{card.content}</p>
              </div>
            </div>
          </div>

        ))}
      </div>



      {/* Upload Modal */}
      <TaxUploadModal show={showUploadModal} handleClose={() => setShowUploadModal(false)} />
    </div>
  );
}
