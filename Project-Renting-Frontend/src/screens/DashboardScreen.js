import axios from "axios";
import React, { useContext, useEffect, useReducer } from "react";
import { Col, Row, Card } from "react-bootstrap";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import Chart from "react-google-charts";
import { Store } from "../Store";
import getError from "../utils";
import {
  FaClipboardList,
  FaCoins,
  FaFileImport,
  FaUserAlt,
} from "react-icons/fa";

//reducer for handle states
//  takes the current state and an action as parameters and returns the new state based on the action type
const reducer = (state, action) => {
  switch (action.type) {  // Switch statement to handle different action types
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        summary: action.payload,
        loading: false,
      };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

//Dashboard Screen
const DashboardScreen = () => {
  const [{ loading, summary, error }, dispatch] = useReducer(reducer, {  // Use the useReducer hook to manage state related to the dashboard
    loading: true, // A flag indicating whether data is being loaded
    error: "",  // A variable to store any error messages
  });
  // Use the useContext hook to access the global state from the 'Store' context
  const { state } = useContext(Store);
  const { userInfo } = state;

  //fetch order summary
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/orders/summary", {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({
          type: "FETCH_FAIL",
          payload: getError(err),
        });
      }
    };
    fetchData();
  }, [userInfo]);

  return (
    <div className="dashboard">
      <div className="text-center"><h2 className="mb-4">Dashboard</h2></div>
      

      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          <hr />
          <Row>
            <Col md={3}>
              <Card className="dashboard-card-users">
                <Card.Body className="text-center">
                  <Card.Title>
                    <Row>
                      <Col xs={1}></Col>
                      <Col xs={8}>
                        {summary.users && summary.users[0]  //count of users
                          ? summary.users[0].numUsers
                          : 0}
                      </Col>
                      <Col xs={3}>
                        <FaUserAlt></FaUserAlt>
                      </Col>
                    </Row>
                  </Card.Title>
                  <Card.Text className="mx-3">Total Users</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="dashboard-card-orders">
                <Card.Body className="text-center">
                  <Card.Title>
                    <Row>
                      <Col xs={1}></Col>
                      <Col xs={8}>
                        {summary.orders && summary.users[0] // Check if 'orders' and 'users[0]' exist
                          ? summary.orders[0].numOrders     // If true, render the number of orders from the summary
                          : 0}    
                             {/* // If false, render 0 */}
                      </Col>
                      <Col xs={3}>
                        <FaFileImport></FaFileImport>
                      </Col>
                    </Row>
                  </Card.Title>
                  <Card.Text className="mx-3">Total Orders</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="dashboard-card-reservations ">
                <Card.Body className="text-center">
                  <Card.Title>
                    <Row>
                      <Col xs={1}></Col>
                      <Col xs={8}>
                        {summary.reservations && summary.reservations[0]  //number of reservations
                          ? summary.reservations[0].numOrders
                          : 0}
                      </Col>
                      <Col xs={3} className="d-flex justify-content-center ">
                        <FaClipboardList></FaClipboardList>
                      </Col>
                    </Row>
                  </Card.Title>
                  <Card.Text className="mx-3">Total Reservations</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="dashboard-card-sales ">
                <Card.Body className="text-center">
                  <Card.Title>
                    <Row>
                    <Col xs={1}></Col>
                      <Col xs={9}>
                        {summary.orders && summary.users[0]
                          ? (
                              parseInt(summary.orders[0].totalSales) +    //parse a string and convert it into an integer
                              parseInt(summary.reservations[0].totalSales)
                            ).toFixed(2)
                          : 0}{" "}
                        LKR
                      </Col>
                      <Col xs={3} className="d-flex justify-content-center">
                        <FaCoins></FaCoins>
                      </Col>
                    </Row>
                  </Card.Title>
                  <Card.Text className="mt-3">
                    {" "}
                    <h3>Total Sales</h3>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <hr />

          <Row>
            <Col md={6}>
              <div className="my-4 ">
                {summary.monthlyOrders.length === 0 ? ( // If the length is 0, render the following component
                  <MessageBox>Income from orders</MessageBox>
                ) : (
                  <Card>
                    <Card.Body>
                      <center>
                        <h2 className="mt-2">Income from Orders</h2>
                      </center>
                      <Chart
                        width="100%"
                        height="400px"
                        chartType="ColumnChart"
                        options={{ legend: "none" }}
                        loader={<div>Loading Chart...</div>}
                        data={[
                          ["Month", "Sales"],
                          ...summary.monthlyOrders.map((x) => [
                            x.month + " " + x.year,
                            x.totalAmount,
                          ]),
                        ]}
                      ></Chart>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Col>

            <Col md={6}>
              <div className="my-4">
                {summary.monthlyReservations.length === 0 ? (
                  <MessageBox>No Sale</MessageBox>
                ) : (
                  <Card>
                    <Card.Body>
                      <center>
                        <h2 className="mt-2">Income from Reservations</h2>
                      </center>
                      <Chart
                        width="100%"
                        height="400px"
                        chartType="ColumnChart"
                        options={{ legend: "none" }}
                        loader={<div>Loading Chart...</div>}
                        data={[
                          ["Month", "Sales"],
                          ...summary.monthlyReservations.map((x) => [
                            x.month + " " + x.year,
                            x.totalAmount,
                          ]),
                        ]}
                      ></Chart>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Col>
          </Row>

          
        </>
      )}
    </div>
  );
};

export default DashboardScreen;
