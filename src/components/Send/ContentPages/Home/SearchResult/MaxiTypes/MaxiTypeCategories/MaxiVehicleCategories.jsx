import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";
import { Courier } from "../../../../../../../models";

import { useOrderContext } from "../../../../../../../../Providers/ClientProvider/OrderProvider";

import vehicleCategories from "./vehicleCategories";

import "./MaxiVehicleCategories.css";

const MaxiVehicleCategories = () => {
  const navigate = useNavigate();
  const { setVehicleClass } = useOrderContext();

  const [availableVehicleClasses, setAvailableVehicleClasses] = useState(
    new Set(),
  );

  const [loadingAvailability, setLoadingAvailability] = useState(true);

  const checkVehicleAvailability = useCallback(async () => {
    try {
      setLoadingAvailability(true);

      const couriers = await DataStore.query(Courier);

      const availableClasses = new Set();

      couriers.forEach((courier) => {
        if (
          courier.vehicleClass &&
          Array.isArray(courier.maxiImages) &&
          courier.maxiImages.length > 0
        ) {
          availableClasses.add(courier.vehicleClass);
        }
      });

      setAvailableVehicleClasses(availableClasses);
    } catch (error) {
      console.error("Error checking vehicle availability:", error);

      // If availability cannot be verified, disable selection.
      setAvailableVehicleClasses(new Set());
    } finally {
      setLoadingAvailability(false);
    }
  }, []);

  useEffect(() => {
    checkVehicleAvailability();
  }, [checkVehicleAvailability]);

  const handleSelect = (vehicleClass) => {
    if (!availableVehicleClasses.has(vehicleClass)) {
      return;
    }

    setVehicleClass(vehicleClass);

    navigate(
      `/send/maxicargodetails?vehicleClass=${encodeURIComponent(vehicleClass)}`,
    );
  };

  const handleViewGallery = (vehicleClass) => {
    navigate(
      `/send/maxi_vehicle_gallery?vehicleClass=${encodeURIComponent(
        vehicleClass,
      )}`,
    );
  };

  if (loadingAvailability) {
    return (
      <main className="maxiCategoriesPage">
        <div className="maxiCategoriesLoading" role="status" aria-live="polite">
          <span className="maxiLoadingSpinner" aria-hidden="true" />

          <p>Checking vehicle availability...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="maxiCategoriesPage">
      <header className="maxiCategoriesHeader">
        <h1 className="maxiCategoriesTitle">Choose Vehicle Type</h1>

        <p className="maxiCategoriesSubtitle">
          Select the vehicle category that best suits your cargo.
        </p>
      </header>

      <div className="maxiCategoriesGrid">
        {vehicleCategories.map((item) => {
          const isAvailable = availableVehicleClasses.has(item.vehicleClass);

          return (
            <article className="maxiCategoryCard" key={item.id}>
              <div className="maxiCategoryImageWrapper">
                <img
                  src={item.image}
                  alt={item.title}
                  className="maxiCategoryImage"
                  loading="lazy"
                />
              </div>

              <div className="maxiCategoryContent">
                <h2 className="maxiCategoryTitle">{item.title}</h2>

                <p className="maxiCategoryCapacity">{item.capacity}</p>

                <p className="maxiCategoryDescription">{item.description}</p>

                <div className="maxiCategoryButtons">
                  <button
                    type="button"
                    className="maxiGalleryButton"
                    onClick={() => handleViewGallery(item.vehicleClass)}
                  >
                    View Available Vehicles
                  </button>

                  <button
                    type="button"
                    className={`maxiSelectButton ${
                      !isAvailable ? "unavailable" : ""
                    }`}
                    onClick={() => handleSelect(item.vehicleClass)}
                    disabled={!isAvailable}
                    aria-label={`${isAvailable ? "Select" : "Unavailable"} ${
                      item.title
                    }`}
                  >
                    {isAvailable ? "Select" : "Unavailable"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
};

export default MaxiVehicleCategories;
