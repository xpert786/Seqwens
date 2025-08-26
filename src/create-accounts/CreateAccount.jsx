import "../styles/CreateAccount.css";
import { Link } from "react-router-dom";
import FixedLayout from "../components/FixedLayout";

const CreateAccount = () => {
  return (
    <FixedLayout>
      <div className="create-account-wrapper">
        <div className="create-account-container">
          <h2 className="create-account-title">Create Your Account</h2>
          <p className="create-account-subtitle">
            Start your return by creating a secure account.
          </p>

          <div className="form-wrapper">
            <form>
              <div className="row mb-3">
                <div className="col">
                  <label className="custom-label">
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="Enter Your First Name"
                  />
                </div>
                <div className="col">
                  <label className="custom-label">Middle Initial</label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="Enter middle initial"
                  />
                </div>
                <div className="col">
                  <label className="custom-label">
                    Last Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="Enter Your Last Name"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="custom-label">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className="form-control custom-input"
                  placeholder="abc@gmail.com"
                />
              </div>

              <div className="mb-4">
                <label className="custom-label">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  className="form-control custom-input"
                  placeholder="+01"
                />
              </div>
            </form>
          </div>

          <Link to="/personal-info" className="text-decoration-none">
            <button type="button" className="btn continue-btn">
              Continue
            </button>
          </Link>

        </div>
      </div>
    </FixedLayout>
  );
};

export default CreateAccount;