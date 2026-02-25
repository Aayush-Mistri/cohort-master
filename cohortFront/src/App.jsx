import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from 'react';

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HomePage from "./pages/HomePage";
import LandingPage from "./components/LandingPage";
import PrivateRoute from "./components/PrivateRoute";
import './style/index2.css';
import './style/homepage.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected route */}
        <Route 
          path="/homepage" 
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
