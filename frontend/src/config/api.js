// the API URL for the backend server based on the environment (production or development)
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://skillverse-backend.azurewebsites.net"
    : "http://localhost:5000";

export default API_URL;
