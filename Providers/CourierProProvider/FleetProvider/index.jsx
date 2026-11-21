import React, { createContext, useCallback, useContext, useState } from "react";

import { generateClient } from "aws-amplify/api";
import { useAuthContext } from "../../ClientProvider/AuthProvider";

const FleetContext = createContext(null);

const client = generateClient();

// Registers a fleet through the authenticated registerFleet mutation.
const REGISTER_FLEET = /* GraphQL */ `
  mutation RegisterFleet($input: RegisterFleetInput!) {
    registerFleet(input: $input) {
      id
      name
      businessName
      organisationType
      legalStatus
      verificationStatus
      ownerUserID
      status
      subscriptionPlan
      subscriptionStatus
      subscriptionStartedAt
      createdAt
      updatedAt
    }
  }
`;

const FleetProvider = ({ children }) => {
  const { sub } = useAuthContext();

  // Fleet information available in the current session.
  const [availableFleets, setAvailableFleets] = useState([]);

  // The fleet currently selected by the user.
  const [selectedFleet, setSelectedFleet] = useState(null);

  // Registration states.
  const [registeringFleet, setRegisteringFleet] = useState(false);
  const [fleetError, setFleetError] = useState(null);

  // Register a new fleet for the authenticated user.
  const registerFleet = useCallback(
    async (input) => {
      if (!sub) {
        throw new Error("You must be logged in to register a fleet.");
      }

      try {
        setRegisteringFleet(true);
        setFleetError(null);

        const result = await client.graphql({
          query: REGISTER_FLEET,
          variables: { input },
          authMode: "userPool",
        });

        if (result.errors?.length) {
          throw new Error(
            result.errors.map((error) => error.message).join(", "),
          );
        }

        const fleet = result.data?.registerFleet;

        if (!fleet) {
          throw new Error("Fleet registration did not return a fleet.");
        }

        // Add the newly created fleet to the current session.
        setAvailableFleets((previous) => [
          fleet,
          ...previous.filter((item) => item.id !== fleet.id),
        ]);

        // Newly registered fleet becomes the selected fleet.
        setSelectedFleet(fleet);

        return fleet;
      } catch (error) {
        console.error("Fleet registration error:", error);

        setFleetError(error.message || "Unable to register your fleet.");

        throw error;
      } finally {
        setRegisteringFleet(false);
      }
    },
    [sub],
  );

  const clearFleetError = useCallback(() => {
    setFleetError(null);
  }, []);

  const value = {
    availableFleets,
    setAvailableFleets,

    selectedFleet,
    setSelectedFleet,

    registeringFleet,
    fleetError,

    registerFleet,
    clearFleetError,
  };

  return (
    <FleetContext.Provider value={value}>{children}</FleetContext.Provider>
  );
};

export default FleetProvider;

export const useFleetContext = () => {
  const context = useContext(FleetContext);

  if (!context) {
    throw new Error("useFleetContext must be used inside FleetProvider.");
  }

  return context;
};
