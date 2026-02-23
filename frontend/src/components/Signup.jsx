import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEye, FaEyeSlash, FaGraduationCap, FaUserTie, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import API_BASE_URL from "../config";

// Password Visibility Component (Corrected for icon stability)
const PasswordInput = ({ value, onChange, placeholder, showState, toggleShowState, strength }) => (
    <>
        {/* New RELATIVE Wrapper for Input and Icon */}
        <div className="relative">
            <input
                type={showState ? "text" : "password"}
                id="password"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition pr-12"
            />
            <button
                type="button"
                onClick={toggleShowState}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-600 transition"
                aria-label={showState ? "Hide password" : "Show password"}
            >
                {showState ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
        </div>
        {/* Strength Meter (Outside the wrapper to prevent icon shift) */}
        {value && (
            <p className={`mt-2 text-sm font-medium flex items-center space-x-1 ${strength === "Strong" ? "text-green-600" : strength === "Medium" ? "text-yellow-600" : "text-red-500"}`}>
                {strength === "Strong" ? <FaCheckCircle /> : <FaExclamationTriangle />}
                <span>Strength: **{strength}**</span>
            </p>
        )}
    </>
);

const Signup = () => {
    const [userType, setUserType] = useState("student");
    const [formData, setFormData] = useState({
        enrollment_number: "", full_name: "", email: "", password: "", contact_number: "",
        address: "", dob: "", image: "", stream: "", major: "", skills: "", interests: "",
        mentor_id: "", department: "", designation: "", research_areas: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState("");

    const checkStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        if (strength <= 1) return "Weak";
        if (strength === 2) return "Medium";
        if (strength >= 3) return "Strong";
    };

    const handleChange = (e) => {
        const { id, value, files } = e.target;
        
        if (id === "password") {
            setPasswordStrength(checkStrength(value));
        }

        if (id === "image" && files?.length > 0) {
            setFormData({ ...formData, image: URL.createObjectURL(files[0]) });
        } else {
            setFormData({ ...formData, [id]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (passwordStrength === "Weak") {
            toast.error(
                "Password too weak. Use at least 8 chars with uppercase, numbers & symbols.",
                { position: "top-center" }
            );
            return;
        }

        const basePayload = {
            full_name: formData.full_name, email: formData.email, password: formData.password,
            contact_number: formData.contact_number, address: formData.address, dob: formData.dob,
            image: formData.image,
        };
        
        let finalPayload;
        let url;

        if (userType === "student") {
            url = `${API_BASE_URL}/signup/student`;
            finalPayload = {
                ...basePayload,
                enrollment_number: formData.enrollment_number,
                stream: formData.stream, major: formData.major,
                skills: formData.skills.split(",").map((s) => s.trim()).filter(s => s.length > 0),
                interests: formData.interests.split(",").map((i) => i.trim()).filter(i => i.length > 0),
            };
        } else {
            url = `${API_BASE_URL}/signup/mentor`;
            finalPayload = {
                ...basePayload,
                mentor_id: formData.mentor_id,
                department: formData.department, designation: formData.designation,
                research_areas: formData.research_areas.split(",").map((r) => r.trim()).filter(r => r.length > 0),
            };
        }

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalPayload),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Signup successful! Redirecting to login...", {
                    position: "top-center",
                    autoClose: 2000,
                });
                setTimeout(() => window.location.href = "/login", 2500);
            } else {
                toast.error(data.error || "Signup failed. Check your data.", { position: "top-center" });
            }
        } catch (err) {
            toast.error("Network error. Please try again.", { position: "top-center" });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-pink-50 p-4 sm:p-6 md:p-8">
            <div className="bg-white shadow-2xl rounded-2xl w-full max-w-4xl p-6 sm:p-8 border border-gray-100 transition duration-500">
                
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-700 mb-2">Join MentorConnect 🚀</h1>
                    <p className="text-gray-500">Create your account to start your mentorship journey.</p>

                    <div className="flex justify-center mt-6 p-1 bg-gray-100 rounded-xl space-x-1 shadow-inner max-w-sm mx-auto">
                        <button
                            type="button"
                            onClick={() => setUserType("student")}
                            className={`flex-1 px-4 py-2 text-base font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                                userType === "student" 
                                    ? "bg-gray-600 text-white shadow-lg shadow-gray-300/50" 
                                    : "text-gray-600 hover:bg-white"
                            }`}
                        >
                            <FaGraduationCap />
                            <span>Student</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserType("mentor")}
                            className={`flex-1 px-4 py-2 text-base font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                                userType === "mentor" 
                                    ? "bg-gray-600 text-white shadow-lg shadow-gray-300/50" 
                                    : "text-gray-600 hover:bg-white"
                            }`}
                        >
                            <FaUserTie />
                            <span>Mentor</span>
                        </button>
                    </div>
                </div>

                <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6" onSubmit={handleSubmit}>
                    
                    {/* ID Field */}
                    <div>
                        <label htmlFor={userType === "student" ? "enrollment_number" : "mentor_id"} className="block text-sm font-bold text-gray-700 mb-1">
                            {userType === "student" ? "Enrollment Number" : "Mentor ID (Admin Provided)"}
                        </label>
                        <input
                            type="text"
                            id={userType === "student" ? "enrollment_number" : "mentor_id"}
                            value={userType === "student" ? formData.enrollment_number : formData.mentor_id}
                            onChange={handleChange}
                            placeholder={userType === "student" ? "e.g., 202412345" : "e.g., MNT-1001"}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
                            required
                        />
                    </div>

                    {/* Full Name */}
                    <div>
                        <label htmlFor="full_name" className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            id="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="e.g., Jane Doe"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="e.g., jane.doe@university.edu"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
                        />
                    </div>

                    {/* Password Field with Strength */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                        <PasswordInput
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a strong password"
                            showState={showPassword}
                            toggleShowState={() => setShowPassword(!showPassword)}
                            strength={passwordStrength}
                        />
                    </div>

                    {/* Contact, DOB */}
                    <div>
                        <label htmlFor="contact_number" className="block text-sm font-bold text-gray-700 mb-1">Contact Number</label>
                        <input
                            type="text"
                            id="contact_number"
                            value={formData.contact_number}
                            onChange={handleChange}
                            placeholder="e.g., +91 9876543210"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
                        />
                    </div>
                    <div>
                        <label htmlFor="dob" className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
                        <input
                            type="date"
                            id="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
                        />
                    </div>

                    {/* Address (Full Width) */}
                    <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                        <input
                            type="text"
                            id="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter your full address"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
                        />
                    </div>
                    
                    {/* Profile Image (Full Width) */}
                    <div className="md:col-span-2">
                        <label htmlFor="image" className="block text-sm font-bold text-gray-700 mb-1">Profile Image</label>
                        <input
                            type="file"
                            id="image"
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-xl file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 transition cursor-pointer"
                            accept="image/*"
                        />
                    </div>


                    {/* STUDENT-ONLY FIELDS */}
                    {userType === "student" && (
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-gray-100">
                            <div>
                                <label htmlFor="stream" className="block text-sm font-bold text-gray-700 mb-1">Stream</label>
                                <input
                                    type="text"
                                    id="stream"
                                    value={formData.stream}
                                    onChange={handleChange}
                                    placeholder="e.g., B.Tech"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
                                />
                            </div>
                            <div>
                                <label htmlFor="major" className="block text-sm font-bold text-gray-700 mb-1">Major</label>
                                <input
                                    type="text"
                                    id="major"
                                    value={formData.major}
                                    onChange={handleChange}
                                    placeholder="e.g., Computer Engineering"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="skills" className="block text-sm font-bold text-gray-700 mb-1">Skills (Comma Separated)</label>
                                <textarea
                                    id="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    placeholder="e.g., React, Node.js, Python, Git"
                                    rows="2"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition resize-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="interests" className="block text-sm font-bold text-gray-700 mb-1">Interests (Comma Separated)</label>
                                <textarea
                                    id="interests"
                                    value={formData.interests}
                                    onChange={handleChange}
                                    placeholder="e.g., Web Development, Machine Learning, Data Structures"
                                    rows="2"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* MENTOR-ONLY FIELDS */}
                    {userType === "mentor" && (
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-gray-100">
                            <div>
                                <label htmlFor="department" className="block text-sm font-bold text-gray-700 mb-1">Department</label>
                                <input
                                    type="text"
                                    id="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    placeholder="e.g., Computer Science"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
                                />
                            </div>
                            <div>
                                <label htmlFor="designation" className="block text-sm font-bold text-gray-700 mb-1">Designation</label>
                                <input
                                    type="text"
                                    id="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    placeholder="e.g., Assistant Professor"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="research_areas" className="block text-sm font-bold text-gray-700 mb-1">Research Areas (Comma Separated)</label>
                                <textarea
                                    id="research_areas"
                                    value={formData.research_areas}
                                    onChange={handleChange}
                                    placeholder="e.g., AI, Data Science, Cloud Computing"
                                    rows="2"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* SUBMIT BUTTON */}
                    <div className="md:col-span-2 pt-6">
                        <button
                            type="submit"
                            className="w-full bg-gray-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-700 transition transform hover:scale-[1.005] shadow-xl shadow-gray-300/50"
                        >
                            Create Account
                        </button>
                    </div>
                </form>

                {/* Login Link */}
                <p className="text-center text-sm text-gray-600 mt-6">
                    Already have an account?{" "}
                    <a href="/login" className="text-gray-600 font-bold hover:text-gray-800 hover:underline transition">
                        Login here
                    </a>
                </p>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Signup;