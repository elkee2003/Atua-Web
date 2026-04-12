import React from "react";
import { FaEnvelope, FaPhone } from "react-icons/fa";
import "./Support.css";

const Support = () => {
//   const copyToClipboard = (text, message) => {
//     navigator.clipboard.writeText(text);
//     alert(message);
//   };

  return (
    <div className="supportContainer">
      <h1 className="title">Support</h1>

      <div className="content">
        {/* Email Header */}
        <div className="supSubHeaderRow">
          <FaEnvelope className="icon" />
          <h2 className="supSubHeaderTxt">Email Us</h2>
        </div>
        <p className="txt">For detailed inquiries, send us an email at:</p>
        <button
          className="support"
        //   onClick={() =>
        //     copyToClipboard("support@atuainc.com", "Email address copied to clipboard!")
        //   }
        >
          support@atuainc.com
        </button>

        <div className="divider" />

        {/* Call Us */}
        <div className="subHeaderRow">
          <FaPhone className="icon" />
          <h2 className="subHeaderTxt">Call Us</h2>
        </div>
        <p className="txt">Prefer to speak with someone directly? Contact us at:</p>
        <button
          className="txtPhone"
        //   onClick={() =>
        //     copyToClipboard("+2347042961902", "Phone Number copied to clipboard!")
        //   }
        >
          +234 704 296 1902
        </button>
        <p className="txt">
          Our phone support is available during regular business hours.
        </p>

        <div className="divider" />

        <h2 className="subHeaderTxt">What We Can Help With</h2>
        <ul className="helpList">
          <li className="txt">Troubleshooting issues with the app</li>
          <li className="txt">Assistance with account setup or deletion</li>
          <li className="txt">Payment and billing inquiries</li>
          <li className="txt">Providing feedback or suggestions</li>
          <li className="txt">Any other concerns or questions</li>
        </ul>

        <div className="divider" />

        <div className="lastSection">
          <h2 className="subHeaderTxt">Our Commitment to You</h2>
          <p className="txt">
            Your experience matters to us. If you're facing any challenges, don't
            hesitate to reach out. We're dedicated to resolving your issues
            promptly and ensuring a smooth, enjoyable experience with Atua.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Support;