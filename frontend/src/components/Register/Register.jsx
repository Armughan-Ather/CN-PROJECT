import { useState } from "react";
import axios from "axios";
import {
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBTypography,
  MDBInput,
  MDBBtn,
} from "mdb-react-ui-kit";
import "./Register.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault(); // Prevent page reload

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/register/", {
        username,
        email,
        password,
      });

      alert("Registration Successful! Please login.");
      window.location.href = "/login"; // Redirect to login page
    } catch (error) {
      alert(error.response?.data?.error || "Registration failed!");
    }
  };

  return (
    <MDBContainer className="register-container">
      <MDBCard className="register-card">
        <MDBCardBody>
          <MDBTypography tag="h3" className="text-center mb-4">
            Sign Up
          </MDBTypography>
          <form onSubmit={handleRegister}>
            <MDBInput
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mb-3"
              required
            />
            <MDBInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3"
              required
            />
            <MDBInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-3"
              required
            />
            <MDBInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mb-3"
              required
            />
            <MDBBtn type="submit" block>
              Register
            </MDBBtn>
          </form>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
}
