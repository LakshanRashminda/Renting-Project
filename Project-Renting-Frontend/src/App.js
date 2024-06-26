import { useContext, useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Badge,
  Container,
  Navbar,
  Nav,
  NavDropdown,
  ToggleButton,
  ToggleButtonGroup,
} from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { Link } from "react-router-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CartScreen from "./screens/CartScreen";
import HomeScreen from "./screens/HomeScreen";
import ProductScreen from "./screens/ProductScreen";
import SigninScreen from "./screens/SigninScreen";
import { Store } from "./Store";
import ShippingAddressScreen from "./screens/ShippingAddressScreen";
import SignupScreen from "./screens/SignupScreen";
import PaymentMethodScreen from "./screens/PaymentMethodScreen";
import PlaceOrderScreen from "./screens/PlaceOrderScreen";
import OrderScreen from "./screens/OrderScreen";
import OrderHistoryScreen from "./screens/OrderHistoryScreen";
import ProfileScreen from "./screens/ProfileScreen";
import getError from "./utils";
import axios from "axios";
import SearchBox from "./components/SearchBox";
import SearchScreen from "./screens/SearchScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardScreen from "./screens/DashboardScreen";
import AdminRoute from "./components/AdminRoute";
import ProductListScreen from "./screens/ProductListScreen";
import ProductEditScreen from "./screens/ProductEditScreen";
import RentHomeScreen from "./screens/RentHomeScreen";
import RentCartScreen from "./screens/RentCartScreen";
import PickupLocationScreen from "./screens/PickupLocationScreen";
import ReservationScreen from "./screens/ReservationScreen";
import RentPaymentMethodScreen from "./screens/RentPaymentMethodScreen";
import MakeReservationScreen from "./screens/MakeReservationScreen";
import ReservationHistoryScreen from "./screens/ReservationHistoryScreen";
import OrderListScreen from "./screens/OrderListScreen";
import ReservationListScreen from "./screens/ReservationListScreen";
import UserListScreen from "./screens/UserListScreen";
import UserEditScreen from "./screens/UserEditScreen";
import AddPickupLocationScreen from "./screens/AddPickupLocationScreen";
import PickupLocationsListScreen from "./screens/PickupLocationsListScreen";
import StaffListScreen from "./screens/StaffListScreen";
import AgentViewOrderScreen from "./screens/AgentViewOrderScreen";
import AgentViewReservationScreen from "./screens/AgentViewReservationScreen";
import AgentNotificationScreen from "./screens/AgentNotificationScreen";
import logo from "../src/image/logo.png"

function App() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, rentCart, userInfo } = state;

  //signout handler
  const signoutHandler = () => {
    ctxDispatch({ type: "USER_SIGNOUT" });
    localStorage.removeItem("userInfo");
    localStorage.removeItem("shippingAddress");
    localStorage.removeItem("paymentMethod");
    localStorage.setItem("BuyOrRent", "Buy");
    localStorage.removeItem("cartItems");
    localStorage.removeItem("rentCartItems");
    window.location.href = "/signin";
  };

  const [categories, setCategories] = useState([]);
  const [buyOrRent, setBuyOrRent] = useState("Buy");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        //get product categories
        const { data } = await axios.get(`/api/products/categories`);
        setCategories(data);
      } catch (err) {
        toast.error(getError(err));
      }
    };
    fetchCategories();
  }, []);

  const navigateRentorBuy = () => {
    localStorage.setItem("BuyOrRent", buyOrRent);
    window.location.href = buyOrRent === "Buy" ? "/" : "/rent";
  };

  return (
    <BrowserRouter>
      <div className="d-flex flex-column site-container">
        <ToastContainer position="bottom-center" limit={1} />
        
        <header>
        {(userInfo == null || userInfo.isAdmin === "false") && (
                <h1 className="header-company">Jayantha Construction Equipment Suppliers</h1>
              )}

        

          <Navbar className="navbar-custom" variant="dark" expand="lg">
            <Container>
              {/* logo */}
              {/* {(userInfo == null || (userInfo.isAdmin === "false" && userInfo.isAgent === "false")) && */}
              {(userInfo == null || userInfo.isAdmin === "false") && (
                <LinkContainer to="/">
                  {/* <Navbar.Brand className="nav-brand">TreckPing </Navbar.Brand> */}
                  <img src={logo} alt="Logo" className="logo-image" />
                </LinkContainer>
              )}

              {userInfo && userInfo.isAdmin === "true" && (
                <LinkContainer to="/admin/dashboard">
                  {/* <Navbar.Brand className="nav-brand">TreckPing </Navbar.Brand> */}
                  <Navbar.Brand className="nav-brand">Jayantha Construction Equipment Suppliers </Navbar.Brand>
                </LinkContainer>
              )}

              {/* {(userInfo && userInfo.isAgent === "true") &&
                <LinkContainer to='/agent/dashboard'>
                  <Navbar.Brand className='nav-brand'>TreckPing  </Navbar.Brand>
                </LinkContainer>
              } */}

              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                {/* {(userInfo == null || (userInfo.isAdmin === "false" && userInfo.isAgent === "false")) && <div className='mx-5'><SearchBox /></div>} */}
                {(userInfo == null || userInfo.isAdmin === "false") && (
                  <div className="mx-5">
                    <SearchBox />
                  </div>
                )}

                <Nav className="ms-auto w-100 justify-content-end ">
                  {/* Handle buy or rent button */}
                  {/* {(userInfo == null || (userInfo.isAdmin === "false" && userInfo.isAgent === "false")) && */}
                  {(userInfo == null || userInfo.isAdmin === "false") && (
                    <ToggleButtonGroup
                      type="radio"
                      name="options"
                      onChange={navigateRentorBuy}
                    >
                      <ToggleButton
                        id="tbg-radio-1"
                        style={{ width: '100px' }} 
                        className={
                          localStorage.getItem("BuyOrRent") == "Buy"
                            ? "bg-success "
                            : "bg-secondary "
                        }
                        onClick={() => setBuyOrRent("Buy")}
                      >
                        Buy
                      </ToggleButton>
                      <ToggleButton
                        id="tbg-radio-2"
                        style={{ width: '100px' }} 
                        className={
                          localStorage.getItem("BuyOrRent") == "Rent"
                            ? "bg-success"
                            : "bg-secondary "
                        }
                        onClick={() => setBuyOrRent("Rent")}
                      >
                        Rent
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}

                  {/* {(userInfo == null || (userInfo.isAdmin === "false" && userInfo.isAgent === "false")) && */}
                  {(userInfo == null || userInfo.isAdmin === "false") && (
                    <Link className="nav-link mx-3" to="/all-products">
                      {/* Products */}
                    </Link>
                  )}

                  {/* {(userInfo == null || (userInfo.isAdmin === "false" && userInfo.isAgent === "false")) && */}
                  {(userInfo == null || userInfo.isAdmin === "false") && (
                    <Link
                      className="nav-link mx-2"
                      to="/signin?redirect=/suggestions"
                    >
                      {/* Need Help? */}
                    </Link>
                  )}

                  {/* {(userInfo == null || (userInfo.isAdmin === "false" && userInfo.isAgent === "false")) && */}
                  {(userInfo == null || userInfo.isAdmin === "false") && (
                    <NavDropdown title="Categories" className="mx-4">
                      {/* select category dropdown */}
                      {categories.map((category) => (
                        <LinkContainer to={`/search?category=${category}`}>
                          <NavDropdown.Item>{category}</NavDropdown.Item>
                        </LinkContainer>
                      ))}
                    </NavDropdown>
                  )}

                  {/* view shopping cart */}
                  {/* {(userInfo == null || (userInfo.isAdmin === "false" && userInfo.isAgent === "false")) && */}
                  {(userInfo == null || userInfo.isAdmin === "false") &&
                    (localStorage.getItem("BuyOrRent") == "Buy" ? (
                      <Link to="/cart" className="nav-link">
                        <i className="fas fa-shopping-cart"></i>
                        {cart.cartItems.length > 0 && (
                          <Badge pill bg="danger">
                            {cart.cartItems.reduce((a, c) => a + c.quantity, 0)}
                          </Badge>
                        )}
                      </Link>
                    ) : (
                      <Link to="/rentcart" className="nav-link">
                        <i className="fas fa-shopping-cart"></i>
                        {rentCart.rentCartItems.length > 0 && (
                          <Badge pill bg="danger">
                            {rentCart.rentCartItems.reduce(
                              (a, c) => a + c.quantity,
                              0
                            )}
                          </Badge>
                        )}
                      </Link>
                    ))}

                  {/* User Info */}
                  {userInfo ? (
                    // ((userInfo.isAdmin === "false" && userInfo.isAgent === "false") ?
                    userInfo.isAdmin === "false" ? (
                      <NavDropdown title={userInfo.name} id="basc-nav-dropdown">
                        <LinkContainer to="/profile">
                          <NavDropdown.Item>User Profile</NavDropdown.Item>
                        </LinkContainer>
                        <LinkContainer to="/reservationhistory">
                          <NavDropdown.Item>Reservations</NavDropdown.Item>
                        </LinkContainer>
                        <LinkContainer to="/orderhistory">
                          <NavDropdown.Item>Order History</NavDropdown.Item>
                        </LinkContainer>
                        <NavDropdown.Divider />
                        <Link
                          className="dropdown-item"
                          to="#signout"
                          onClick={signoutHandler}
                        >
                          Sign Out
                        </Link>
                      </NavDropdown>
                    ) : (
                      <NavDropdown title={userInfo.name} id="basc-nav-dropdown">
                        <LinkContainer to="/profile">
                          <NavDropdown.Item>User Profile</NavDropdown.Item>
                        </LinkContainer>
                        <NavDropdown.Divider />
                        <Link
                          className="dropdown-item"
                          to="#signout"
                          onClick={signoutHandler}
                        >
                          Sign Out
                        </Link>
                      </NavDropdown>
                    )
                  ) : (
                    <Link className="nav-link" to="/signin">
                      Sign In
                    </Link>
                  )}

                  {/* admin nav options */}
                  {userInfo && userInfo.isAdmin === "true" && (
                    <NavDropdown title="Admin" id="admin-nav-dropdown">
                      <LinkContainer to="/admin/dashboard">
                        <NavDropdown.Item>Dashboard</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/products">
                        <NavDropdown.Item>Products</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/reservations">
                        <NavDropdown.Item>Reservations</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/orders">
                        <NavDropdown.Item>Orders</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/users">
                        <NavDropdown.Item>Users</NavDropdown.Item>
                      </LinkContainer>
                      {/* <LinkContainer to="/admin/pickuplocationslist">
                        <NavDropdown.Item>Pickup Locations</NavDropdown.Item>
                      </LinkContainer> */}
                      <LinkContainer to="/admin/staff">
                        <NavDropdown.Item>Staff</NavDropdown.Item>
                      </LinkContainer>
                    </NavDropdown>
                  )}

                  {/* agent nav options */}
                  {/* {userInfo && userInfo.isAgent === 'true' && (
                    <NavDropdown title="Sales Agent" id="admin-nav-dropdown">
                      <LinkContainer to="/agent/notifications">
                        <NavDropdown.Item>Notifications</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/agent/reservations">
                        <NavDropdown.Item>Upcoming Reservations</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/agent/view-orders">
                        <NavDropdown.Item>Upcoming Orders</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/products">
                        <NavDropdown.Item>Products</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/admin/pickuplocationslist/63f76397dbea193340d57569">
                        <NavDropdown.Item>Location Status</NavDropdown.Item>
                      </LinkContainer>
                    </NavDropdown>
                  )
                  } */}
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        </header>

        <main
          className={
            userInfo &&
            // (userInfo.isAdmin === "true" || userInfo.isAgent === "true") &&
            userInfo.isAdmin === "true" &&
            "dashboard pt-5 pt-3"
          }
        >
          <Container className="mt-3">
            {/* user routes */}
            <Routes>
              <Route path="/product/:slug" element={<ProductScreen />} />
              <Route path="/signin" element={<SigninScreen />} />
              <Route path="/signup" element={<SignupScreen />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileScreen />
                  </ProtectedRoute>
                }
              />

              <Route path="/shipping" element={<ShippingAddressScreen />} />
              <Route
                path="/pickuplocation"
                element={<PickupLocationScreen />}
              />
              <Route path="/payment" element={<PaymentMethodScreen />} />
              <Route
                path="/rentpayment"
                element={<RentPaymentMethodScreen />}
              />
              <Route path="/placeorder" element={<PlaceOrderScreen />} />
              <Route path="/reservation" element={<MakeReservationScreen />} />

              <Route
                path="/order/:id"
                element={
                  <ProtectedRoute>
                    <OrderScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reservation/:id"
                element={
                  <ProtectedRoute>
                    <ReservationScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orderhistory"
                element={
                  <ProtectedRoute>
                    <OrderHistoryScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reservationhistory"
                element={
                  <ProtectedRoute>
                    <ReservationHistoryScreen />
                  </ProtectedRoute>
                }
              />

              <Route path="/cart" element={<CartScreen />} />
              <Route path="/rentcart" element={<RentCartScreen />} />
              <Route path="/search" element={<SearchScreen />} />

              {/* Agent Routes */}
              <Route
                path="/agent/view-orders"
                element={<AgentViewOrderScreen />}
              />

              <Route
                path="/agent/reservations"
                element={<AgentViewReservationScreen />}
              />

              <Route path="/admin/products" element={<ProductListScreen />} />

              <Route
                path="/agent/notifications"
                element={<AgentNotificationScreen />}
              />

              <Route
                path="/admin/pickuplocationslist/:id"
                element={<AddPickupLocationScreen />}
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <DashboardScreen />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/products"
                element={
                  <AdminRoute>
                    <ProductListScreen />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/orders"
                element={
                  <AdminRoute>
                    <OrderListScreen />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/reservations"
                element={
                  <AdminRoute>
                    <ReservationListScreen />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/pickuplocationslist"
                element={
                  <AdminRoute>
                    <PickupLocationsListScreen />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/addpickuplocations"
                element={
                  <AdminRoute>
                    <AddPickupLocationScreen />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/addpickuplocations/:id"
                element={
                  <AdminRoute>
                    <AddPickupLocationScreen />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/product/:id"
                element={
                  <AdminRoute>
                    <ProductEditScreen />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <UserListScreen />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/user/:id"
                element={
                  <AdminRoute>
                    <UserEditScreen />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/staff"
                element={
                  <AdminRoute>
                    <StaffListScreen />
                  </AdminRoute>
                }
              />

              <Route path="/rent" element={<RentHomeScreen />} />
              <Route path="/" element={<HomeScreen />} />
            </Routes>
          </Container>
        </main>

        {/* footer */}
        <footer class="text-center text-white mt-5 footer-All">
          <div class="container p-4 pb-0">
            <section class="mb-4">
              <a
                class="btn btn-outline-light btn-floating m-1"
                href="#!"
                role="button"
              >
                <i class="fab fa-facebook-f"></i>
              </a>

              <a
                class="btn btn-outline-light btn-floating m-1"
                href="#!"
                role="button"
              >
                <i class="fab fa-instagram"></i>
              </a>

              <a
                class="btn btn-outline-light btn-floating m-1"
                href="#!"
                role="button"
              >
                <i class="fab fa-youtube"></i>
              </a>

              <a
                class="btn btn-outline-light btn-floating m-1"
                href="#!"
                role="button"
              >
                <i class="fab fa-google"></i>
              </a>
            </section>
          </div>
          <h4>Jayantha Construction Equipment Suppliers </h4>
          <p>
            No. 04,
            <br /> Idangoda, <br /> Kiriella. <br />
            TP : +94 769584745
          </p>

          {/* <div class="text-center p-3 footer-container">
            © 2023 Copyright :
            <a class="text-white" href="http://localhost:3000/">
              {" "}
              TreckPing
            </a>
          </div> */}
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
