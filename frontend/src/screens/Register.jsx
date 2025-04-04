import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context.jsx";
import axios from "../config/axios.js";

const Register = () => {
  const [name, setName] = useState(""); // Add state for name
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState(""); // Added state for gender
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();
    axios
      .post("/users/register", {
        name,
        email,
        password,
        gender, // Include gender in request
      })
      .then((res) => {
        console.log(res.data);
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        navigate("/");
      })
      .catch((err) => {
        console.log(err.response.data);
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-6 bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-4">Register</h2>
        <form onSubmit={submitHandler}>
          {/* Name field - add this */}
          <div className="mb-4">
            <label className="block mb-1 text-sm">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength="3"
              maxLength="50"
              placeholder="Enter your full name"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength="6"
              maxLength="50"
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength="3"
              maxLength="50"
              placeholder="Enter your password"
            />
          </div>

          {/* Gender Selection */}
          <div className="mb-4">
            <label className="block mb-2 text-sm">Gender</label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="male"
                  name="gender"
                  value="male"
                  checked={gender === "male"}
                  onChange={(e) => setGender(e.target.value)}
                  className="mr-2 accent-blue-500"
                  required
                />
                <label htmlFor="male" className="text-sm">
                  Male
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="female"
                  name="gender"
                  value="female"
                  checked={gender === "female"}
                  onChange={(e) => setGender(e.target.value)}
                  className="mr-2 accent-blue-500"
                />
                <label htmlFor="female" className="text-sm">
                  Female
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition"
          >
            Register
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          Already have an account?
          <Link to="/login" className="text-blue-400 hover:underline ml-1">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
