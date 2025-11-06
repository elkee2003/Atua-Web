import React from "react";
import "../SendStyles/ReviewOrderGuidelines.css";

function ReviewOrderGuidelines() {
  return (
    <div className="guidelinesContainer">
      {/* Main Header */}
      <div className="guidelineSection">
        <h2 className="mainHeader">Review parcel guidelines</h2>

        <p className="guildlineHeader">
          To achieve a successful delivery, please confirm that your parcel is:
        </p>
        <p className="policyText">• ₦30,000 or less in value</p>
        <p className="policyText">• Properly sealed and prepared for collection</p>
      </div>

      <div className="guidelineSection">
        <p className="header">Prohibited Items</p>
        <p className="policyText">
          Prohibited items include medication, firearms, alcohol, drugs, and any dangerous or illegal substances. 
          All parcels sent via Atua must adhere to applicable laws, regulations, and Atua's policies. 
          Any violations may be reported to authorities, which may also lead to the removal of app access. 
          Atua will cooperate with law enforcement on any illegal activity.
        </p>
      </div>

      <div>
        <p className="policyLastText">
          Atua does not provide insurance for parcels. By clicking “Done”, you acknowledge and accept this.
        </p>
      </div>
    </div>
  );
}

export default ReviewOrderGuidelines;
