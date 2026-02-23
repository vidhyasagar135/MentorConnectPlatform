# MentorConnect — AI-Integrated Student–Mentor Recommendation Platform

An intelligent web platform that connects students with the most suitable mentors using **AI-based profile matching**, semantic embeddings, and real-time analytics.  
Developed as a capstone project by a team of five from **SR University, School of CS & AI**.

---

## Live Demo

**Frontend**  
https://mentorconnect-frontend-one.vercel.app/  

**Backend API**  
https://mentorconnect-backend-j6o0.onrender.com  

**AI Recommendation Microservice**  
https://embedding-generation.onrender.com  

---

## 🏷️ Tech Badges

![React](https://img.shields.io/badge/Framework-React-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![FastAPI](https://img.shields.io/badge/AI-FastAPI-yellow)
![Supabase](https://img.shields.io/badge/Database-Supabase-black)
![JavaScript](https://img.shields.io/badge/Language-JavaScript-orange)
![HuggingFace](https://img.shields.io/badge/Embeddings-HuggingFace-red)

---

## Key Features

### AI-Based Mentor Recommendation
- Uses **SentenceTransformer (all-MiniLM-L6-v2)**  
- Converts profiles to **semantic embeddings**  
- Computes **cosine similarity** to rank mentors  
- FastAPI microservice for modular AI processing  

### Student & Mentor Dashboards
- Students: match results, track progress  
- Mentors: mentee list, analytics  

### Secure Authentication
- JWT-based login  
- Hashed passwords (bcrypt)  
- Role-based access control  

### Cloud Database
- Supabase + PostgreSQL  
- Structured schema for performance  

### Responsive UI
- React + Tailwind CSS  
- Mobile-friendly design  
