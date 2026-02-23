import React, { useState, useRef, useEffect, useCallback } from "react";
import API_BASE_URL from "../config";
import {
    FaTachometerAlt,
    FaUserGraduate,
    FaSignOutAlt,
    FaBars,
    FaTimes,
    FaCog,
    FaIdCard,
    FaCalendarAlt,
    FaClock,
    FaBullhorn,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

let tokenErrorDisplayed = false;

const Button = ({ children, onClick, className }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg font-medium shadow-md transition-colors ${className}`}
    >
        {children}
    </button>
);

const sidebarNavItems = [
    { name: "Dashboard", icon: FaTachometerAlt },
    { name: "All Students", icon: FaUserGraduate },
    { name: "Schedule", icon: FaCalendarAlt },
    { name: "Announcements", icon: FaBullhorn },
    { name: "Settings", icon: FaCog },
];

// --- EditableSlotRow Component (Defined externally for stability) ---
const EditableSlotRow = ({ slot, onUpdate, getStudentNameById, token, handleAuthError }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editSlot, setEditSlot] = useState({
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: slot.status,
    });

    const handleSave = async () => {
        if (!token) return handleAuthError();
        try {
            const res = await fetch(
                `${API_BASE_URL}/mentors/schedule/${slot.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(editSlot),
                }
            );
            if (res.status === 401 || res.status === 403) return handleAuthError();

            const data = await res.json();
            if (res.ok) {
                toast.success("Schedule updated!");
                setIsEditing(false);
                onUpdate();
            } else {
                toast.error(data.error || "Failed to update slot");
            }
        } catch {
            toast.error("Network error while updating schedule");
        }
    };

    const getStatusLabel = () => {
        if (slot.status === "free")
            return <span className="text-green-600 font-medium">Free Slot</span>;

        if (slot.status === "class")
            return <span className="text-red-500 font-medium">Class</span>;

        if (slot.status === "booked") {
            const studentName = slot.booked_by_student_id
                ? getStudentNameById(slot.booked_by_student_id)
                : (slot.booked_by?.full_name || slot.booked_by?.name || "A Student");

            return (
                <span className="text-orange-600 font-medium">
                    Booked by **{studentName}**
                </span>
            );
        }
        return <span>{slot.status}</span>;
    };

    return (
        <tr key={slot.id} className="border-b hover:bg-purple-50 transition">
            <td className="px-4 py-3 font-semibold">{slot.day}</td>
            <td className="px-4 py-3">
                {isEditing ? (
                    <input
                        type="time"
                        value={editSlot.start_time}
                        onChange={(e) =>
                            setEditSlot({ ...editSlot, start_time: e.target.value })
                        }
                        className="border rounded px-2 py-1 w-full"
                    />
                ) : (
                    slot.start_time
                )}
            </td>

            <td className="px-4 py-3">
                {isEditing ? (
                    <input
                        type="time"
                        value={editSlot.end_time}
                        onChange={(e) =>
                            setEditSlot({ ...editSlot, end_time: e.target.value })
                        }
                        className="border rounded px-2 py-1 w-full"
                    />
                ) : (
                    slot.end_time
                )}
            </td>

            <td className="px-4 py-3">
                {isEditing ? (
                    <select
                        value={editSlot.status}
                        onChange={(e) =>
                            setEditSlot({ ...editSlot, status: e.target.value })
                        }
                        className="border rounded px-2 py-1 w-full"
                    >
                        <option value="class">Class</option>
                        <option value="free">Free Slot</option>
                        <option value="booked" disabled>Booked</option>
                    </select>
                ) : (
                    getStatusLabel()
                )}
            </td>

            <td className="px-4 py-3 text-right">
                {isEditing ? (
                    <>
                        <button
                            onClick={handleSave}
                            className="bg-green-600 text-white px-3 py-1 rounded mr-2 hover:bg-green-700 text-sm"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                        disabled={slot.status === "booked"}
                    >
                        Edit
                    </button>
                )}
            </td>
        </tr>
    );
};
// --- End EditableSlotRow Component ---


const MentorsDashboard = () => {
    const [activeTab, setActiveTab] = useState("Dashboard");
    const [students, setStudents] = useState([]);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const prevScheduleRef = useRef([]);
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "" });

    const [newSlot, setNewSlot] = useState({
        day: "",
        start_time: "",
        end_time: "",
        status: "free",
    });

    const [mentorProfile, setMentorProfile] = useState({});
    const [profileFormData, setProfileFormData] = useState({
        full_name: "", email: "", contact_number: "", address: "", dob: "",
        department: "", designation: "", research_areas: "", image: "",
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: "", newPassword: "", confirmPassword: "",
    });

    const token = localStorage.getItem("token");

    const Button = ({ children, onClick, className }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg font-medium shadow-md transition-colors ${className}`}
        >
            {children}
        </button>
    );

    const handleAuthError = () => {
        if (!tokenErrorDisplayed) {
            tokenErrorDisplayed = true;
            toast.error("Session expired. Please log in again.", {
                onClose: () => {
                    localStorage.clear();
                    window.location.href = "/login";
                },
                autoClose: 2000,
            });
        }
    };

    const getStudentNameById = useCallback((id) => {
        const student = students.find((s) => s.id === id);
        return student ? student.full_name : "Unknown Student";
    }, [students]);

    const getSubjectName = useCallback((subjectId) => {
        return subjects.find((s) => s.id === subjectId)?.name || "Unknown Subject";
    }, [subjects]);

    const fetchData = useCallback(async (endpoint, setData) => {
        if (!token) return handleAuthError();
        try {
            const res = await fetch(`${API_BASE_URL}/mentors/${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401 || res.status === 403) return handleAuthError();

            const data = await res.json();
            if (res.ok) setData(data);
            else toast.error(data.error || `Failed to fetch ${endpoint}`);
        } catch {
            toast.error(`Network error: Could not connect to fetch ${endpoint}`);
        }
    }, [token]);

    const fetchSchedule = useCallback(async () => {
        if (!token) return handleAuthError();
        try {
            const res = await fetch(`${API_BASE_URL}/mentors/schedule`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401 || res.status === 403) return handleAuthError();

            const data = await res.json();
            if (res.ok) {
                const newSchedule = data.schedule || [];

                newSchedule.forEach((slot) => {
                    const prevSlot = prevScheduleRef.current.find((s) => s.id === slot.id);
                    if (prevSlot && prevSlot.status !== "booked" && slot.status === "booked") {
                        const studentName = slot.booked_by_student_id
                            ? getStudentNameById(slot.booked_by_student_id)
                            : slot.booked_by?.full_name || "A Student";
                        toast.info(`📌 New booking: ${studentName} booked ${slot.day} ${slot.start_time} - ${slot.end_time}`);
                    }
                });

                prevScheduleRef.current = newSchedule;
                setSchedule(newSchedule);
            } else toast.error(data.error || "Failed to fetch schedule");
        } catch {
            toast.error("Network error while fetching schedule");
        }
    }, [token, getStudentNameById]);

    const fetchStudentDetails = async (studentId) => {
        if (!token) return handleAuthError();
        try {
            const res = await fetch(
                `${API_BASE_URL}/mentors/student-details/${studentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.status === 401 || res.status === 403) return handleAuthError();

            const data = await res.json();
            if (res.ok) {
                setSelectedStudentDetails(data);
                setShowDetails(true);
            } else {
                toast.error(data.error || "Failed to fetch student details");
            }
        } catch {
            toast.error("Network error while fetching student details");
        }
    };

    const handleAddSchedule = async (e) => {
        e.preventDefault();
        if (!token) return handleAuthError();
        try {
            const res = await fetch(`${API_BASE_URL}/mentors/schedule`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newSlot),
            });
            if (res.status === 401 || res.status === 403) return handleAuthError();

            const data = await res.json();
            if (res.ok) {
                toast.success("Schedule added successfully!");
                setNewSlot({ day: "", start_time: "", end_time: "", status: "free" });
                fetchSchedule();
            } else {
                toast.error(data.error || "Failed to add schedule");
            }
        } catch (err) {
            toast.error("Network error while adding schedule");
        }
    };

    const fetchAnnouncements = useCallback(async () => {
        if (!token) return handleAuthError();
        try {
            const res = await fetch(`${API_BASE_URL}/mentors/announcements`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401 || res.status === 403) return handleAuthError();

            const data = await res.json();
            if (res.ok) setAnnouncements(data.announcements || []);
            else toast.error(data.error || "Failed to fetch announcements");
        } catch {
            toast.error("Network error while fetching announcements");
        }
    }, [token]);


    const handleAddAnnouncement = async (e) => {
        e.preventDefault();
        if (!token) return handleAuthError();
        if (!newAnnouncement.title || !newAnnouncement.content) {
            toast.error("Both title and content are required");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/mentors/announcement`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newAnnouncement),
            });
            if (res.status === 401 || res.status === 403) return handleAuthError();

            const data = await res.json();
            if (res.ok) {
                toast.success("Announcement sent!");
                setNewAnnouncement({ title: "", content: "" });
                fetchAnnouncements();
            } else {
                toast.error(data.error || "Failed to send announcement");
            }
        } catch {
            toast.error("Network error while sending announcement");
        }
    };

    const fetchMentorProfile = useCallback(async () => {
        if (!token) return handleAuthError();
        try {
            const res = await fetch(`${API_BASE_URL}/mentors/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401 || res.status === 403) return handleAuthError();

            const data = await res.json();
            if (res.ok) {
                setMentorProfile(data);
            } else {
                toast.error(data.error || "Failed to load mentor profile");
            }
        } catch {
            toast.error("Error fetching mentor profile");
        }
    }, [token]);

    const handleProfileChange = (e) => {
        setProfileFormData({ ...profileFormData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const updateProfile = async () => {
        if (!token) return handleAuthError();
        try {
            const res = await fetch(`${API_BASE_URL}/mentors/update-profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...profileFormData,
                    research_areas: profileFormData.research_areas.split(",").map((s) => s.trim()).filter(s => s),
                }),
            });
            if (res.status === 401 || res.status === 403) return handleAuthError();
            
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                fetchMentorProfile();
            } else toast.error(data.error);
        } catch (err) {
            toast.error("Failed to update profile");
        }
    };

    const changePassword = async () => {
        if (!token) return handleAuthError();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New password and confirm password must match");
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/mentors/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(passwordData),
            });
            if (res.status === 401 || res.status === 403) return handleAuthError();
            
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
            } else toast.error(data.error);
        } catch (err) {
            toast.error("Failed to change password");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    useEffect(() => {
        const handleResize = () => {
            const currentWidth = window.innerWidth;
            setWindowWidth(currentWidth);
            if (currentWidth >= 768) setIsSidebarOpen(true);
        };

        window.addEventListener("resize", handleResize);

        fetchData("students", setStudents);
        fetchData("subjects", setSubjects);
        fetchSchedule();
        fetchAnnouncements();
        fetchMentorProfile();

        return () => window.removeEventListener("resize", handleResize);
    }, [fetchData, fetchSchedule, fetchAnnouncements, fetchMentorProfile]);

    useEffect(() => {
        if (mentorProfile.id) {
            setProfileFormData({
                full_name: mentorProfile.full_name || "",
                email: mentorProfile.email || "",
                contact_number: mentorProfile.contact_number || "",
                address: mentorProfile.address || "",
                dob: mentorProfile.dob ? mentorProfile.dob.split('T')[0] : "",
                department: mentorProfile.department || "",
                designation: mentorProfile.designation || "",
                image: mentorProfile.image || "",
                research_areas: Array.isArray(mentorProfile.research_areas)
                    ? mentorProfile.research_areas.join(", ")
                    : mentorProfile.research_areas || "",
            });
        }
    }, [mentorProfile.id]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (activeTab === "Schedule") fetchSchedule(); 
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchSchedule, activeTab]);

    const renderAllStudentsTab = () => (
        <div className="p-6">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">
                All Registered Students 🧑‍🎓
            </h2>
            <div className="bg-white shadow-xl rounded-xl overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                ID / Enr. No
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                                Major
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.length > 0 ? (
                            students.map((s) => (
                                <tr
                                    key={s.id}
                                    className="hover:bg-indigo-50 transition duration-150 cursor-pointer"
                                    onClick={() => fetchStudentDetails(s.id)}
                                >
                                    <td className="px-6 py-4 text-sm font-semibold text-indigo-600">
                                        {s.enrollment_number}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {s.full_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{s.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{s.major}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                    No students found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderDashboardTab = () => {
        const studentByMajorData = students.reduce((acc, student) => {
            const major = student.major || "Unknown";
            const existing = acc.find((item) => item.major === major);
            if (existing) existing.count++;
            else acc.push({ major, count: 1 });
            return acc;
        }, []);

        return (
            <div className="p-6">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">
                    Mentors Control Panel ✨
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-indigo-600">
                        <p className="text-sm text-gray-500 font-medium">Total Students</p>
                        <h2 className="text-4xl font-extrabold text-indigo-600 mt-1">
                            {students.length}
                        </h2>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-600">
                        <p className="text-sm text-gray-500 font-medium">Average Score</p>
                        <h2 className="text-4xl font-extrabold text-green-600 mt-1">
                            {students.length > 0
                                ? (
                                      students.reduce((acc, s) => acc + (s.score || 0), 0) /
                                      students.length
                                  ).toFixed(2)
                                : "0.00"}
                        </h2>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-purple-600">
                        <p className="text-sm text-gray-500 font-medium">Active Bookings</p>
                        <h2 className="text-4xl font-extrabold text-purple-600 mt-1">
                            {schedule.filter(s => s.status === 'booked').length}
                        </h2>
                    </div>
                </div>

                <div className="mt-8 bg-white shadow-xl rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">
                        Student Count by Major
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        {studentByMajorData.length > 0 ? (
                            <BarChart data={studentByMajorData} margin={{ top: 15, right: 0, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="major" angle={-15} textAnchor="end" height={50} style={{ fontSize: '12px' }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#6366f1" name="Students" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                No student data for major distribution.
                            </div>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const renderScheduleTab = () => {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

        const groupedSchedule = schedule.reduce((acc, slot) => {
            if (!acc[slot.day]) acc[slot.day] = [];
            acc[slot.day].push(slot);
            return acc;
        }, {});

        const hasScheduleData = schedule.length > 0;

        return (
            <div className="p-6">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">
                    Manage Schedule 📅
                </h2>

                {!hasScheduleData ? (
                    <>
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg mb-6 shadow">
                            ⚠️ Your weekly schedule is empty. Please add slots below to enable student booking.
                        </div>

                        <form
                            onSubmit={handleAddSchedule}
                            className="bg-white shadow-2xl rounded-xl p-6 w-full max-w-lg mb-8 border border-purple-100"
                        >
                            <h3 className="text-xl font-bold text-purple-700 mb-4">Add New Slot</h3>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-1">Day</label>
                                <select
                                    value={newSlot.day}
                                    onChange={(e) =>
                                        setNewSlot({ ...newSlot, day: e.target.value })
                                    }
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                                    required
                                >
                                    <option value="">Select Day</option>
                                    {days.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="block text-gray-700 font-medium mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={newSlot.start_time}
                                        onChange={(e) =>
                                            setNewSlot({ ...newSlot, start_time: e.target.value })
                                        }
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-gray-700 font-medium mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={newSlot.end_time}
                                        onChange={(e) =>
                                            setNewSlot({ ...newSlot, end_time: e.target.value })
                                        }
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 font-medium mb-1">Status</label>
                                <select
                                    value={newSlot.status}
                                    onChange={(e) =>
                                        setNewSlot({ ...newSlot, status: e.target.value })
                                    }
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                                    required
                                >
                                    <option value="free">Free Slot (Booking)</option>
                                    <option value="class">Class (Unavailable)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="bg-purple-700 text-white w-full px-4 py-3 rounded-xl hover:bg-purple-800 transition font-bold shadow-lg"
                            >
                                Add Schedule Slot
                            </button>
                        </form>
                    </>
                ) : (
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">
                            Weekly Schedule Overview
                        </h3>

                        {days.map((day) => {
                            const slots = groupedSchedule[day] || [];
                            if (slots.length === 0) return null;

                            return (
                                <div key={day} className="mb-8 bg-white rounded-xl shadow-xl">
                                    <h4 className="text-xl font-bold text-purple-700 p-4 border-b bg-purple-50 rounded-t-xl">
                                        {day} ({slots.length} Slots)
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm text-gray-700">
                                            <thead className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                                <tr>
                                                    <th className="px-4 py-3">Day</th>
                                                    <th className="px-4 py-3">Start Time</th>
                                                    <th className="px-4 py-3">End Time</th>
                                                    <th className="px-4 py-3">Status</th>
                                                    <th className="px-4 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {slots
                                                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                                    .map((slot, idx) => (
                                                        <EditableSlotRow
                                                            key={slot.id || idx}
                                                            slot={{ ...slot, day }} 
                                                            onUpdate={fetchSchedule}
                                                            getStudentNameById={getStudentNameById}
                                                            token={token}
                                                            handleAuthError={handleAuthError}
                                                        />
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                        <form
                            onSubmit={handleAddSchedule}
                            className="bg-white shadow-xl rounded-xl p-6 w-full max-w-lg mx-auto mt-8 border-t-4 border-purple-500"
                        >
                            <h3 className="text-xl font-bold text-purple-700 mb-4">Add More Slots</h3>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-1">Day</label>
                                <select
                                    value={newSlot.day}
                                    onChange={(e) =>
                                        setNewSlot({ ...newSlot, day: e.target.value })
                                    }
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                                    required
                                >
                                    <option value="">Select Day</option>
                                    {days.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="block text-gray-700 font-medium mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={newSlot.start_time}
                                        onChange={(e) =>
                                            setNewSlot({ ...newSlot, start_time: e.target.value })
                                        }
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-gray-700 font-medium mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={newSlot.end_time}
                                        onChange={(e) =>
                                            setNewSlot({ ...newSlot, end_time: e.target.value })
                                        }
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 font-medium mb-1">Status</label>
                                <select
                                    value={newSlot.status}
                                    onChange={(e) =>
                                        setNewSlot({ ...newSlot, status: e.target.value })
                                    }
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                                    required
                                >
                                    <option value="free">Free Slot (Booking)</option>
                                    <option value="class">Class (Unavailable)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="bg-purple-700 text-white w-full px-4 py-3 rounded-xl hover:bg-purple-800 transition font-bold shadow-lg"
                            >
                                Add Slot
                            </button>
                        </form>
                    </div>
                )}
            </div>
        );
    };

    const renderAnnouncementsTab = () => (
        <div className="p-6">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">
                Create & View Announcements 📢
            </h2>

            <form
                onSubmit={handleAddAnnouncement}
                className="bg-white shadow-2xl rounded-xl p-6 w-full max-w-xl mb-8 border border-red-100"
            >
                <h3 className="text-xl font-bold text-red-700 mb-4">Send New Announcement</h3>
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-1">Title</label>
                    <input
                        type="text"
                        value={newAnnouncement.title}
                        onChange={(e) =>
                            setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                        }
                        className="w-full border rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-1">Message</label>
                    <textarea
                        value={newAnnouncement.content}
                        onChange={(e) =>
                            setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                        }
                        className="w-full border rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        rows={4}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="bg-red-600 text-white w-full px-4 py-3 rounded-xl hover:bg-red-700 transition font-bold shadow-lg"
                >
                    Send Announcement to Students
                </button>
            </form>

            <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Sent History</h3>
            <div className="bg-white shadow-xl rounded-xl overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Message</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {announcements.length > 0 ? (
                            announcements.map((a, idx) => (
                                <tr key={a.id || idx} className="hover:bg-purple-50 transition">
                                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{a.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{a.content}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 min-w-[150px]">{new Date(a.created_at).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                    No announcements sent yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSettingsTab = () => {
        const profileFields = [
            { key: "full_name", label: "Full Name", type: "text" },
            { key: "email", label: "Email", type: "email", disabled: true },
            { key: "contact_number", label: "Contact Number", type: "text" },
            { key: "dob", label: "Date of Birth", type: "date" },
            { key: "department", label: "Department", type: "text" },
            { key: "designation", label: "Designation", type: "text" },
            { key: "address", label: "Address", type: "text", cols: 2 },
            { key: "research_areas", label: "Research Areas (comma-separated)", type: "text", cols: 2 },
            { key: "image", label: "Profile Image URL", type: "text", cols: 2 },
        ];

        return (
            <div className="p-6">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">
                    Account Settings ⚙️
                </h2>

                <div className="bg-white shadow-xl rounded-xl p-6 mb-8">
                    <h3 className="text-xl font-semibold text-purple-700 mb-4 flex items-center">
                        <FaIdCard className="mr-2"/> Edit Profile Information (ID: **{mentorProfile.mentor_id}**)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profileFields.map(({ key, label, type, cols, disabled }) => (
                            <div key={key} className={cols === 2 ? "md:col-span-2" : ""}>
                                <label className="block mb-1 font-medium text-gray-700">{label}</label>
                                <input
                                    type={type}
                                    name={key}
                                    value={profileFormData[key]}
                                    onChange={handleProfileChange}
                                    disabled={disabled}
                                    className={`w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={updateProfile}
                        className="mt-6 bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:bg-purple-700 transition-colors"
                    >
                        Update Profile
                    </button>
                </div>

                <div className="bg-white shadow-xl rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-red-700 mb-4">
                        Change Password 🔒
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="password"
                            placeholder="Old Password"
                            name="oldPassword"
                            value={passwordData.oldPassword}
                            onChange={handlePasswordChange}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                        />
                    </div>
                    <button
                        onClick={changePassword}
                        className="mt-6 bg-red-600 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:bg-red-700 transition-colors"
                    >
                        Change Password
                    </button>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case "All Students":
                return renderAllStudentsTab();
            case "Schedule":
                return renderScheduleTab();
            case "Announcements":
                return renderAnnouncementsTab();
            case "Settings":
                return renderSettingsTab();
            default:
                return renderDashboardTab();
        }
    };


    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {isSidebarOpen && windowWidth < 768 && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            <aside
                className={`fixed md:relative w-64 bg-purple-800 text-white flex flex-col h-full z-50 transition-transform duration-300 ${
                    windowWidth < 768
                        ? isSidebarOpen
                            ? "translate-x-0"
                            : "-translate-x-full"
                        : "translate-x-0"
                }`}
            >
                <div className="flex items-center justify-between px-6 py-5 border-b border-purple-700">
                    <h1 className="text-2xl font-extrabold">Mentors Portal</h1>
                    {windowWidth < 768 && (
                        <button
                            onClick={toggleSidebar}
                            className="p-1 rounded-full hover:bg-purple-700"
                        >
                            <FaTimes size={20} />
                        </button>
                    )}
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {sidebarNavItems.map(({ name, icon: Icon }) => (
                        <button
                            key={name}
                            onClick={() => {
                                setActiveTab(name);
                                if (windowWidth < 768) setIsSidebarOpen(false);
                            }}
                            className={`w-full text-left flex items-center px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                                activeTab === name
                                    ? "bg-purple-900 text-white shadow-lg"
                                    : "hover:bg-purple-700 text-purple-100"
                            }`}
                        >
                            <Icon className="inline mr-3" size={18} />
                            {name}
                        </button>
                    ))}

                    <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-4 py-3 rounded-lg font-medium text-red-300 hover:bg-red-700 transition-colors mt-8"
                    >
                        <FaSignOutAlt className="inline mr-3" size={18} />
                        Logout
                    </button>
                </nav>
            </aside>

            {/* Main Content Container */}
            <div className={`flex-1 overflow-y-auto relative ${windowWidth < 768 && !isSidebarOpen ? 'pt-20' : ''}`}>
                {/* Fixed Hamburger Menu Button (Visible only on mobile when sidebar is CLOSED) */}
                {windowWidth < 768 && !isSidebarOpen && (
                    <button
                        onClick={toggleSidebar}
                        className="fixed top-4 left-4 z-40 bg-purple-600 text-white p-3 rounded-full shadow-xl hover:bg-purple-700 transition"
                    >
                        <FaBars size={20} />
                    </button>
                )}

                {renderContent()}
            </div>

            {showDetails && selectedStudentDetails && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full md:w-3/4 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-2xl font-bold text-indigo-800">
                                Student Profile: **{selectedStudentDetails.student.full_name}**
                            </h3>
                            <button onClick={() => { setShowDetails(false); setSelectedStudentDetails(null); }} className="text-gray-500 hover:text-red-600">
                                <FaTimes size={20} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                            <div className="mb-4 space-y-1 md:col-span-1">
                                <h4 className="font-bold text-lg mb-2 text-purple-700 border-b-2 border-purple-100">
                                    Personal & Academic Info
                                </h4>
                                <p><strong>Enr. No:</strong> {selectedStudentDetails.student.enrollment_number}</p>
                                <p><strong>Email:</strong> {selectedStudentDetails.student.email}</p>
                                <p><strong>Contact:</strong> {selectedStudentDetails.student.contact_number || "N/A"}</p>
                                <p><strong>Stream / Major:</strong> {selectedStudentDetails.student.stream || selectedStudentDetails.student.major}</p>
                                <p><strong>Year / Semester:</strong> {selectedStudentDetails.student.year} / {selectedStudentDetails.student.semester}</p>
                            </div>

                            <div className="mb-4 space-y-1 md:col-span-1">
                                <h4 className="font-bold text-lg mb-2 text-purple-700 border-b-2 border-purple-100">
                                    Skills & Interests
                                </h4>
                                <p><strong>Skills:</strong> {selectedStudentDetails.student.skills?.join(", ") || "N/A"}</p>
                                <p><strong>Interests:</strong> {selectedStudentDetails.student.interests?.join(", ") || "N/A"}</p>
                                <p><strong>Address:</strong> {selectedStudentDetails.student.address || "N/A"}</p>
                                <p><strong>Date of Birth:</strong> {selectedStudentDetails.student.dob || "N/A"}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                            <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
                                <h4 className="font-bold text-lg mb-3 text-green-700">Grades</h4>
                                {selectedStudentDetails.grades?.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-200 border-b">
                                                <th className="px-2 py-1 text-left">Subject</th>
                                                <th className="px-2 py-1 text-left">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedStudentDetails.grades.map((g, idx) => (
                                                <tr key={g.id || idx} className="border-t hover:bg-white">
                                                    <td className="px-2 py-1">{getSubjectName(g.subject_id)}</td>
                                                    <td className="px-2 py-1 font-semibold text-green-600">{g.grade}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-gray-500">No grades available.</p>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
                                <h4 className="font-bold text-lg mb-3 text-blue-700">Attendance</h4>
                                {selectedStudentDetails.attendance?.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-200 border-b">
                                                <th className="px-2 py-1 text-left">Subject</th>
                                                <th className="px-2 py-1 text-left">Attendance %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedStudentDetails.attendance.map((a, idx) => (
                                                <tr key={a.id || idx} className="border-t hover:bg-white">
                                                    <td className="px-2 py-1">{getSubjectName(a.subject_id)}</td>
                                                    <td className="px-2 py-1 font-semibold">{a.attendance_percentage}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-gray-500">No attendance records.</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => { setShowDetails(false); setSelectedStudentDetails(null); }}
                            className="mt-6 bg-purple-700 text-white px-6 py-2 rounded-lg font-medium shadow hover:bg-purple-800 transition"
                        >
                            Close Profile
                        </button>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        </div>
    );
};

export default MentorsDashboard;