import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Axios from "axios";
import { Button, Container, Form } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Store } from "../Store";
import getError from "../utils";

//Signin Screen
const SigninScreen = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const redirectInUrl = new URLSearchParams(search).get("redirect");
  const redirect = redirectInUrl ? redirectInUrl : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      //signin handler
      const { data } = await Axios.post("/api/users/signin", {
        email,
        password,
      });
      ctxDispatch({ type: "USER_SIGNIN", payload: data });
      localStorage.setItem("userInfo", JSON.stringify(data));
      if (data.isAdmin == "true") {
        navigate("/admin/dashboard");
        // } else if (data.isAgent == "true") {
        //     navigate('/agent/reservations');
      } else {
        navigate(redirect || "/");
      }
    } catch (err) {
      toast.error(getError(err));
    }
  };

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, redirect, userInfo]);

  return (
    <Container className="small-container">
      <Helmet>
        <title>Sign In</title>
      </Helmet>
      <div className="text-center"><h1 className="my-3">Sign In</h1></div>
      
      <Form onSubmit={submitHandler}>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>
        <div className="mb-3 text-center">
          <Button type="submit">Sign In</Button>
        </div>
        <div className="mb-3">
          Don't have an account?{" "}
          <Link to={`/signup?redirect=${redirect}`}>Get Started</Link>
        </div>
      </Form>
    </Container>
  );
};

export default SigninScreen;
