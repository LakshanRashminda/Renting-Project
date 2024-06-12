import React, { useContext, useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import CheckoutSteps from "../components/CheckoutSteps";
import { Store } from "../Store";
import axios from "axios";
import getError from "../utils";
import { toast } from "react-toastify";

//Pickup Location Screen
const PickupLocationScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispacth } = useContext(Store);

  const {
    userInfo,
    rentCart: { deliveryAddress },
  } = state;

  const [isPickup, setIsPickup] = useState(false);
  const [fullName, setFullName] = useState(deliveryAddress.fullName || "");
  const [address, setAddress] = useState(deliveryAddress.address || "");
  const [city, setCity] = useState(deliveryAddress.city || "");
  const [postalCode, setPostalCode] = useState(
    deliveryAddress.postalCode || ""
  );
  const [returnOption, setReturnOption] = useState("Deliver to shop");

  useEffect(() => {
    if (!userInfo) {
      navigate("/signin?redirect=/pickuplocation");
    }
  }, [userInfo, navigate]);

  // useEffect(() => {
  //     const fetchLoactionData = async () => {
  //         try {
  //             //get all locations
  //             const { data } = await axios.get(`/api/locations/get-all`, {
  //                 headers: { Authorization: `Bearer ${userInfo.token}` }
  //             }
  //             );
  //             setLocationList(data);
  //         } catch (err) {
  //             toast.error(getError(err));;
  //         }
  //     };

  //     fetchLoactionData();

  // }, [userInfo])

  const handleRadioChange = (event) => {
    setReturnOption(event.target.value);
  };

  const submitHandler = (e) => {
    e.preventDefault();

    ctxDispacth({
      type: "SAVE_DELIVERY_ADDRESS",
      payload: {
        fullName,
        address,
        city,
        postalCode,
        returnOption,
      },
    });
    localStorage.setItem(
      "deliveryAddress",
      JSON.stringify({
        fullName,
        address,
        city,
        postalCode,
        returnOption,
      })
    );
    navigate("/rentpayment");
  };

  const pickupHandler = () => {
    // e.preventDefault();

    // ctxDispacth({
    //   type: "SAVE_SHIPPING_ADDRESS",
    //   payload: {
    //     fullName: userInfo.name,
    //     address,
    //     city: "",
    //     postalCode: "",
    //   },
    // });
    //set shipping address in local storage
    // localStorage.setItem(
    //   "deliveryAddress",
    //   JSON.stringify({
    //     fullName: userInfo.name,
    //     address,
    //     city: "",
    //     postalCode: "",
    //   })
    // );
    navigate("/rentpayment");
  };

  return (
    <div>
      <Helmet>
        <title>Shipping Address</title>
      </Helmet>
      <CheckoutSteps step1 step2></CheckoutSteps>
      <div className="container medium-container">
        <h2 className="mt-5 mb-4 screen-header">Shipping Address</h2>
        <Form>
          <Form.Label>
            <strong>
              You can pickup from the shop Or we
              can deliver them to your doorstep.
            </strong>{" "}
            <br />
            <br />{" "}
          </Form.Label>
          <p className="pickup-type-txt">Select pickup type :</p>

          <Form.Check
            className="mb-3 mt-3 radio-checked h6"
            type="radio"
            label="Deliver to my Doorstep"
            name="adress"
            checked={!isPickup}
            onChange={(e) => setIsPickup(!isPickup)}
          />

          <Form.Check
            className="mb-3 radio-checked h6"
            type="radio"
            label="Pickup from shop"
            name="adress"
            checked={isPickup}
            onChange={(e) => setIsPickup(!isPickup)}
          />
          <br />
          <hr />
          {isPickup ? (
            <div>
              <Form.Group className="mt-5 mb-3" controlId="fullName">
                {/* <Form.Label>Pickup Location</Form.Label>

                <Form.Select
                  size="lg"
                  onChange={(e) => setAddress(e.target.value)}
                >
                  {locationId != null ? (
                    <option disabled={true}>- Select agent-</option>
                  ) : (
                    <option disabled={true} selected>
                      - Select agent-
                    </option>
                  )}
                  <option disabled={true}>- Select agent-</option>

                  {locationList.map((location) => {
                    return (
                      <option value={location.address}>
                        {" "}
                        {location.address}
                      </option>
                    );
                  })}
                </Form.Select>

                <Form.Select
                  size="lg"
                  onChange={(e) => setAddress(e.target.value)}
                  required
                >
                  <option value="TreckPing Showroom - No.04, Polgolla, Kandy">
                    TreckPing Showroom - No.04, Polgolla, Kandy
                  </option>
                  <option value="6/11, Badulla Rd, Bibila">
                    6/11, Badulla Rd, Bibila
                  </option>
                </Form.Select> */}
              </Form.Group>
              <br />
              <div className="mb-3">
                <Button variant="primary" type="button" onClick={pickupHandler}>
                  Continue
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-5 mb-5">
              <Form.Group className="mb-3" controlId="fullName">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="address">
                <Form.Label>Address Line</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="city">
                <Form.Label>City</Form.Label>
                <Form.Control
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="postalCode">
                <Form.Label>Postal Code</Form.Label>
                <Form.Control
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                />
              </Form.Group>

              <p className="pickup-type-txt">Select return type :</p>

              <Form.Check
                className="mb-3 mt-3 radio-checked h6"
                type="radio"
                label="Deliver to shop"
                value="Deliver to shop"
                name="adress"
                // checked={!isPickup}
                // onChange={(e) => setIsPickup(!isPickup)}
                checked={returnOption === "Deliver to shop"}
                onChange={handleRadioChange}
              />

              <Form.Check
                className="mb-3 radio-checked h6"
                type="radio"
                label="Hand over to shop"
                value="Hand over to shop"
                name="adress"
                // checked={isPickup}
                // onChange={(e) => setIsPickup(!isPickup)}
                checked={returnOption === "Hand over to shop"}
                onChange={handleRadioChange}
              />

              <br />
              <div className="mb-3">
                <Button variant="primary" onClick={submitHandler}>
                  Continue
                </Button>
              </div>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
};

export default PickupLocationScreen;
