import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "../styles/Navbar.css"; 

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top py-3">
      <div className="container-fluid px-4">
        <div className="d-flex align-items-center">
          <Link className="navbar-brand me-5" to="/">
            <img src={logo} alt="Seqwens" height="35" />
          </Link>
        </div>

        <div className="mx-auto text-center d-none d-lg-block">
          <ul className="navbar-nav gap-4 flex-row justify-content-center">
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="#home">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="#capabilities">AI Capabilities</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="#pricing">Pricing</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-semibold" to="#case">Case Studies</Link>
            </li>
          </ul>
        </div>

        <div className="d-flex align-items-center gap-2 ms-auto">
          <button className="btn btn-outline-primary">Sign In</button>
         <button className="btn text-white" style={{ backgroundColor: "#F56D2D" }}>Contact Sales</button>

        </div>
      </div>
    </nav>
  );
}
