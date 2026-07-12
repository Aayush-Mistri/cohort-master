import axios from "axios";
import { API_URL } from "./config";

const API = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    "Content-Type": "application/json"
  }
});

export const registerUser = (data) => {
  return API.post("/register", data);
};


export const loginUser = async ({ email, password }) => {
  return axios.post(
    `${API_URL}/auth/login`,
    { email, password }
  );
};
