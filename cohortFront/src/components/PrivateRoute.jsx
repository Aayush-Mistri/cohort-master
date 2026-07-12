import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../api/config";

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuth(false);
        setLoading(false);
        return;
      }

      try {
        // GET request to backend profile route
        await axios.get(`${API_URL}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setIsAuth(true); // token is valid
      } catch (err) {
        console.error("Token invalid:", err.response?.data || err.message);
        localStorage.removeItem("token"); // remove invalid token
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>; // optional spinner

  return isAuth ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
