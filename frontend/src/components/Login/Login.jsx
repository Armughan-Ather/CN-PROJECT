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
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/login/", {
        username,
        password,
      });

      // Store authentication tokens
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      localStorage.setItem("username", response.data.username);

      alert("Login Successful!");
      // Redirect user to chat page (if needed)
      window.location.href = "/chat";
    } catch (error) {
      alert("Invalid Credentials");
    }
  };

  return (
    <MDBContainer className="login-container">
      <MDBCard className="login-card">
        <MDBCardBody>
          <MDBTypography tag="h3" className="text-center mb-4">
            Login
          </MDBTypography>
          <form onSubmit={handleLogin}>
            <MDBInput
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            <MDBBtn type="submit" block>
              Login
            </MDBBtn>
          </form>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
}
