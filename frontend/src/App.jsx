import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom"; // Import Routes for navigation
import { getTestMessage } from "./api";

import Login from "./components/Login/Login"; // Import the Login page
import {
  MDBBtn,
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
} from "mdb-react-ui-kit";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    getTestMessage().then((data) => {
      if (data) {
        setMessage(data.message);
      }
    });
  }, []);

  return (
    <Routes>
      {/* Default route - Login Page */}
      <Route path="/login" element={<Login />} />

      {/* Example Test Page (React-Django Connection) */}
      <Route
        path="/"
        element={
          <MDBContainer className="mt-5">
            <h1>React-Django Connection</h1>
            <MDBCard>
              <MDBCardBody>
                <MDBCardTitle>Test Message from Backend</MDBCardTitle>
                <MDBCardText>{message}</MDBCardText>
              </MDBCardBody>
            </MDBCard>
            <MDBBtn className="mt-3">Primary</MDBBtn>
          </MDBContainer>
        }
      />
    </Routes>
  );
}

export default App;
