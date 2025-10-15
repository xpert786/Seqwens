import TaxHeader from './TaxHeader';
import { Outlet } from "react-router-dom";
// import "../../styles/taxdashboardlayout.css";
import "../styles/taxdashboardlayout.css";
import TaxSidebar from "./TaxSidebar";

export default function TaxDashboardLayout() {
  return (
    <div className="tdl-layout">
      <TaxHeader/>
      <TaxSidebar />
      <main className="tdl-main">
        <Outlet />
      </main>
    </div>
  );
}
