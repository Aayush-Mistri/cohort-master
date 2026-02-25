import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
  headers: {
    "Content-Type": "application/json"
  }
});

export const registerUser = (data) => {
  return API.post("/register", data);
};


export const loginUser = async ({ email, password }) => {
  return axios.post(
    "http://localhost:5000/api/auth/login",
    { email, password }
  );
};