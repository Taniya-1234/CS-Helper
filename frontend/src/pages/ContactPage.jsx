import React from "react";
// import "bootstrap/dist/css/bootstrap.min.css";

const ContactPage = () => {
  return (
    <div className="min-vh-100 py-5"
      style={{
        backgroundColor: "var(--bs-body-bg)",
        color: "var(--bs-body-color)"
      }}
    >
      <div className="container d-flex flex-column align-items-center">
        
        {/* Title */}
        <h1 className="fw-bold text-center mb-3">Get In Touch</h1>
        <p className="text-center mb-4 text-muted" style={{ maxWidth: "500px" }}>
          Have questions, feedback, or suggestions? We'd love to hear from you!
        </p>

        {/* Main Card Container */}
        <div className="card shadow-lg p-4 rounded-4"
             style={{ maxWidth: "500px", width: "100%" }}>
          
          {/* Email */}
          <div className="card mb-4 border-0 bg-light rounded-3 p-3">
            <h5 className="fw-bold text-center mb-2">Email</h5>
            <p className="text-center text-primary m-0">support@cshelper.com</p>
          </div>

          {/* Feedback */}
          <div className="card mb-4 border-0 bg-light rounded-3 p-3">
            <h5 className="fw-bold text-center mb-2">Feedback</h5>
            <p className="text-center text-muted mb-1">
              Your feedback helps us improve. Send your suggestions at:
            </p>
            <p className="text-center fw-bold m-0">feedback@cshelper.com</p>
          </div>

          {/* Support */}
          <div className="card border-0 bg-light rounded-3 p-3">
            <h5 className="fw-bold text-center mb-2">Support</h5>
            <p className="text-center text-muted m-0">
              Need help? Our support team is available<br />
              <b>Monday – Friday, 9 AM – 6 PM IST</b>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;
