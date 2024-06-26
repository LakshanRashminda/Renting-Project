import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import axios from "axios";
import moment from "moment";
import React, { useContext, useEffect, useReducer } from "react";
import { Button, Card, Col, ListGroup, Row } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import swal from "sweetalert";
import { Store } from "../Store";
import getError from "../utils";

//reducer for handle states
function reducer(state, action) {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, order: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "PAY_REQUEST":
      return { ...state, loadingPay: true };
    case "PAY_SUCCESS":
      return { ...state, loadingPay: false, successPay: true };
    case "PAY_FAIL":
      return { ...state, loadingPay: false, errorPay: action.payload };
    case "PAY_RESET":
      return { ...state, loadingPay: false, successPay: false };
    case "DELIVER_REQUEST":
      return { ...state, loadingDeliver: true };
    case "DELIVER_SUCCESS":
      return { ...state, loadingDeliver: false, successDeliver: true };
    case "DELIVER_FAIL":
      return { ...state, loadingDeliver: false };
    case "DELIVER_RESET":
      return {
        ...state,
        loadingDeliver: false,
        successDeliver: false,
      };
    // case "PAID_REQUEST":
    //   return { ...state, loadingPaid: true };
    // case "PAID_SUCCESS":
    //   return { ...state, loadingPaid: false, successPaid: true };
    // case "PAID_FAIL":
    //   return { ...state, loadingPaid: false };
    // case "PAID_RESET":
    //   return {
    //     ...state,
    //     loadingPaid: false,
    //     successPaid: false,
    //   };
    default:
      return state;
  }
}

//OrderScreen
export default function OrderScreen() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const params = useParams();
  const { id: orderId } = params;
  const navigate = useNavigate();

  const [
    {
      loading,
      error,
      order,
      successPay,
      loadingPay,
      loadingDeliver,
      successDeliver,
    },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    order: {},
    error: "",
    successPay: false,
    loadingPay: false,
  });

  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

  function createOrder(data, actions) {
    return actions.order
      .create({
        purchase_units: [
          {
            amount: { value: order.totalPrice },
          },
        ],
      })
      .then((orderID) => {
        return orderID;
      });
  }

  function onApprove(data, actions) {
    return actions.order.capture().then(async function (details) {
      try {
        dispatch({ type: "PAY_REQUEST" });
        //update order
        const { data } = await axios.put(
          `/api/orders/${order._id}/pay`,
          details,
          {
            headers: { authorization: `Bearer ${userInfo.token}` },
          }
        );
        dispatch({ type: "PAY_SUCCESS", payload: data });
        toast.success("Order is paid");
        console.log(details);
      } catch (err) {
        dispatch({ type: "PAY_FAIL", payload: getError(err) });
        toast.error(getError(err));
      }
    });
  }

  async function payOrderHandler() {
    swal({
      title: "Are you sure?",
      text: "Payment status of this order will be changed as Paid !",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willYes) => {
      if (willYes) {
        try {
          dispatch({ type: "PAY_REQUEST" });
          const { data } = await axios.put(
            `/api/orders/${order._id}/pay`,
            {},
            {
              headers: { authorization: `Bearer ${userInfo.token}` },
            }
          );
          dispatch({ type: "PAY_SUCCESS", payload: data });
          toast.success("Order is paid");
        } catch (err) {
          dispatch({ type: "PAY_FAIL", payload: getError(err) });
          toast.error(getError(err));
        }
      }
    });
  }

  function onError(err) {
    toast.error(getError(err));
  }

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        //get order by id
        const { data } = await axios.get(`/api/orders/${orderId}`, {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };

    if (!userInfo) {
      return navigate("/login");
    }
    if (
      !order._id ||
      successPay ||
      successDeliver ||
      (order._id && order._id !== orderId)
    ) {
      fetchOrder();
      if (successPay) {
        dispatch({ type: "PAY_RESET" });
      }
      if (successDeliver) {
        dispatch({ type: "DELIVER_RESET" });
      }
    } else {
      //paypal api
      const loadPaypalScript = async () => {
        const { data: clientId } = await axios.get("/api/keys/paypal", {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        paypalDispatch({
          type: "resetOptions",
          value: {
            "client-id": clientId,
            currency: "USD",
          },
        });
        paypalDispatch({ type: "setLoadingStatus", value: "pending" });
      };
      loadPaypalScript();
    }
  }, [
    order,
    userInfo,
    orderId,
    navigate,
    paypalDispatch,
    successPay,
    successDeliver,
  ]);

  async function dispatchOrderHandler() {
    swal({
      title: "Are you sure?",
      text: "Delivery status of this order will be changed as Dispatched !",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willYes) => {
      if (willYes) {
        try {
          dispatch({ type: "DELIVER_REQUEST" });
          //update order status
          const { data } = await axios.put(
            `/api/orders/${order._id}/dispatch`,
            {},
            {
              headers: { authorization: `Bearer ${userInfo.token}` },
            }
          );
          dispatch({ type: "DELIVER_SUCCESS", payload: data });
          toast.success("Order is dispatched");
        } catch (err) {
          toast.error(getError(err));
          dispatch({ type: "DELIVER_FAIL" });
        }
      }
    });
  }

  async function paidOrderHandler() {
    swal({
      title: "Are you sure?",
      text: "Payment status of this order will be changed as Paid !",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willYes) => {
      if (willYes) {
        try {
          dispatch({ type: "DELIVER_REQUEST" });
          //update order status
          const { data } = await axios.put(
            `/api/orders/${order._id}/dispatch`,
            {},
            {
              headers: { authorization: `Bearer ${userInfo.token}` },
            }
          );
          dispatch({ type: "DELIVER_SUCCESS", payload: data });
          toast.success("Order is dispatched");
        } catch (err) {
          toast.error(getError(err));
          dispatch({ type: "DELIVER_FAIL" });
        }
      }
    });
  }

  async function deliverOrderHandler() {
    swal({
      title: "Are you sure?",
      text: "Delivery status of this order will be changed as Delivered !",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willYes) => {
      if (willYes) {
        try {
          //update order status
          dispatch({ type: "DELIVER_REQUEST" });
          const { data } = await axios.put(
            `/api/orders/${order._id}/deliver`,
            {},
            {
              headers: { authorization: `Bearer ${userInfo.token}` },
            }
          );
          dispatch({ type: "DELIVER_SUCCESS", payload: data });
          toast.success("Order is delivered");
        } catch (err) {
          toast.error(getError(err));
          dispatch({ type: "DELIVER_FAIL" });
        }
      }
    });
  }

  return loading ? (
    <LoadingBox></LoadingBox>
  ) : error ? (
    <MessageBox variant="danger"></MessageBox>
  ) : (
    <div>
      <Helmet>
        <title>Order {orderId}</title>
      </Helmet>
      <h2 className="my-3">Order {orderId}</h2>
      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Shipping</Card.Title>
              <Card.Text>
                <strong>Name:</strong> {order.shippingAddress.fullName} <br />
                <strong>Address:</strong> {order.shippingAddress.address},{" "}
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              </Card.Text>
              {order.isDispatched ? (
                <MessageBox variant="success">
                  Dispatched at {moment(order.dispatchedAt).format("LLL")}
                </MessageBox>
              ) : (
                <MessageBox variant="danger">Not Dispatched</MessageBox>
              )}
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Payment</Card.Title>
              <Card.Text>
                <strong>Method:</strong> {order.paymentMethod}
              </Card.Text>
              {order.isPaid ? (
                <MessageBox variant="success">
                  Paid at {moment(order.paidAt).format("LLL")}
                </MessageBox>
              ) : (
                <MessageBox variant="danger">Not paid</MessageBox>
              )}
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Items</Card.Title>
              <ListGroup variant="flush">
                {order.orderItems.map((item) => (
                  <ListGroup.Item key={item._id}>
                    <Row className="align-items-center">
                      <Col md={8}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="img-fluid rounded img-thumbnail"
                        ></img>{" "}
                        <Link
                          to={`/product/${item.slug}`}
                          className="card-title-link"
                        >
                          {item.name}
                        </Link>
                      </Col>
                      <Col md={2}>
                        <span>{item.quantity}</span>
                      </Col>
                      <Col md={2}>{item.price}</Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Order Summary</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Row>
                    <Col>Items</Col>
                    <Col>{order.itemsPrice.toFixed(2)}LKR</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Shipping</Col>
                    <Col>{order.shippingPrice.toFixed(2)}LKR</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>
                      <strong>Order Total</strong>
                    </Col>
                    <Col>
                      <strong>{order.totalPrice.toFixed(2)}LKR</strong>
                    </Col>
                  </Row>
                </ListGroup.Item>

                {userInfo.isAdmin == "false" && !order.isPaid && (
                  <ListGroup.Item>
                    {isPending ? (
                      <LoadingBox />
                    ) : (
                      <div>
                        {order.paymentMethod == "Card" && (
                          <PayPalButtons
                            createOrder={createOrder}
                            onApprove={onApprove}
                            onError={onError}
                          ></PayPalButtons>
                        )}
                      </div>
                    )}
                    {loadingPay && <LoadingBox></LoadingBox>}
                  </ListGroup.Item>
                )}
                {userInfo.isAdmin == "true" &&
                  order.isPaid &&
                  !order.isDispatched && (
                    <ListGroup.Item>
                      {loadingDeliver && <LoadingBox></LoadingBox>}
                      <div className="d-grid">
                        <Button type="button" onClick={dispatchOrderHandler}>
                          Dispatch Order
                        </Button>
                      </div>
                    </ListGroup.Item>
                  )}
                {userInfo.isAdmin == "true" &&
                  order.paymentMethod == "COD" &&
                  !order.isDispatched && (
                    <ListGroup.Item>
                      {loadingDeliver && <LoadingBox></LoadingBox>}
                      <div className="d-grid">
                        <Button type="button" onClick={dispatchOrderHandler}>
                          Dispatch Order
                        </Button>
                      </div>
                    </ListGroup.Item>
                  )}
                {userInfo.isAdmin == "true" &&
                  !order.isPaid &&
                  order.isDispatched && (
                    <ListGroup.Item>
                      {loadingDeliver && <LoadingBox></LoadingBox>}
                      <div className="d-grid">
                        <Button type="button" onClick={payOrderHandler}>
                          Pay Order
                        </Button>
                      </div>
                    </ListGroup.Item>
                  )}

                {/* {userInfo.isAgent == "true" && order.isPaid && order.isDispatched && order.deliveryStatus == "Dispatched" && ( */}
                {order.isPaid &&
                  order.isDispatched &&
                  order.deliveryStatus == "Dispatched" && (
                    <ListGroup.Item>
                      {loadingDeliver && <LoadingBox></LoadingBox>}
                      <div className="d-grid">
                        <Button type="button" onClick={deliverOrderHandler}>
                          Order Delivered
                        </Button>
                      </div>
                    </ListGroup.Item>
                  )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
