import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaEye,
  FaEyeSlash,
  FaKey,
  FaArrowRight,
} from "react-icons/fa";
import API_BASE_URL from "../config";

/* ---------------- Password Input ---------------- */

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  showState,
  toggleShowState,
}) => (
  <div className="relative">
    <input
      type={showState ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      className="w-full px-4 py-3 border border-black rounded-md focus:ring-2 focus:ring-black focus:border-black pr-12 transition"
    />
    <button
      type="button"
      onClick={toggleShowState}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
    >
      {showState ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
    </button>
  </div>
);

/* ---------------- Main Component ---------------- */

const Login = () => {
  const [userType, setUserType] = useState("student");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const payload =
      userType === "student"
        ? { enrollment_number: loginId, password }
        : { mentor_id: loginId, password };

    const url =
      userType === "student"
        ? `${API_BASE_URL}/login/student`
        : `${API_BASE_URL}/login/mentor`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Welcome, ${userType}!`);
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", userType);

        window.location.href =
          userType === "student"
            ? "/student-dashboard"
            : "/mentor-dashboard";
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      {/* Card */}
      <div className="bg-white w-full max-w-md border border-black rounded-lg p-8 shadow-xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">
            Login Portal
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Access your dashboard securely
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex mb-6 border border-black rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setUserType("student")}
            className={`flex-1 py-2 text-sm font-medium transition ${
              userType === "student"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            Student
          </button>

          <button
            type="button"
            onClick={() => setUserType("mentor")}
            className={`flex-1 py-2 text-sm font-medium transition ${
              userType === "mentor"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            Mentor
          </button>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              {userType === "student"
                ? "Enrollment Number"
                : "Mentor ID"}
            </label>

            <div className="relative">
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-black rounded-md focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Enter your ID"
              />
              <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Password
            </label>

            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              showState={showPassword}
              toggleShowState={() => setShowPassword(!showPassword)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-md font-medium hover:bg-gray-900 transition"
          >
            Log In
          </button>
        </form>

        {/* Footer */}
        <div className="flex justify-between items-center mt-6 text-sm">
          <button className="text-gray-600 hover:text-black transition">
            Forgot Password?
          </button>

          <a
            href="/signup"
            className="text-black hover:underline flex items-center gap-1"
          >
            Sign Up <FaArrowRight size={12} />
          </a>
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
    </div>
  );
};

export default Login;