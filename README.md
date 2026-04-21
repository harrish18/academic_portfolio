# 🎓 Academic Portfolio — Dr. P. Chinnasamy

🔗 Live Demo : https://academicwebsit.netlify.app/

A professional academic portfolio website built for **Dr. P. Chinnasamy**, Assistant Professor in the Department of Computer Science and Engineering at **Kalasalingam Academy of Research and Education**.

This project was developed by **[harrish18](https://github.com/harrish18)** as a comprehensive web platform to showcase the professor's academic profile, research contributions, and teaching resources.

---

## 🌐 About the Website

This is a fully dynamic, responsive academic portfolio website with a built-in **Admin CMS Dashboard** for easy content management. The website connects to a **Supabase** backend for real-time data persistence, authentication, and file storage.

### ✨ Key Features

- **Home Page** — Professional profile with research highlights and key metrics
- **About** — Detailed biography, qualifications, and professional memberships
- **Research** — Active and completed research projects
- **Publications** — Journals, conferences, and book chapters with DOI links
- **Research Scholars** — PhD and M.Tech scholar supervision details
- **Students** — M.Tech and B.Tech student project listings
- **Courses** — Courses taught with downloadable unit-wise study materials
- **Gallery** — Categorized photo gallery with lightbox viewer
- **Patents** — Filed, published, and granted patent listings
- **Research Lab** — Lab infrastructure and focus areas
- **Achievements** — Academic awards and recognitions
- **Contact** — Contact form with direct email integration

### 🔧 Admin Dashboard

- Secure login with Supabase authentication
- Full CRUD operations for all sections
- File upload support for course materials and gallery images
- Data export to CSV
- Real-time content updates — no manual HTML editing required

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Page structure and semantics |
| **CSS3** | Custom styling with CSS variables, animations, and responsive design |
| **Vanilla JavaScript** | Dynamic rendering, API calls, and interactivity |
| **Supabase** | Backend — PostgreSQL database, authentication, file storage |

---

## 📁 Project Structure

```
Academic Portfolio/
├── index.html              # Home page
├── about.html              # About page
├── research.html           # Research projects
├── publications.html       # Publications listing
├── scholars.html           # Research scholars
├── students.html           # Student projects
├── courses.html            # Courses & materials
├── gallery.html            # Photo gallery
├── patents.html            # Patents
├── lab.html                # Research lab
├── achievements.html       # Achievements
├── contact.html            # Contact form
├── css/
│   └── style.css           # Main stylesheet
├── js/
│   ├── main.js             # Frontend logic
│   └── supabase-config.js  # Supabase connection config
├── admin/
│   ├── login.html          # Admin login page
│   ├── dashboard.html      # CMS dashboard
│   ├── dashboard.js        # Dashboard logic
│   └── admin.css           # Admin styles
├── data/                   # Static JSON data (fallback)
├── images/                 # Profile and static images
└── uploads/                # Uploaded course materials
```

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/harrish18/Academic-Portfolio.git
   ```

2. **Set up Supabase**
   - Create a project on [Supabase](https://supabase.com)
   - Update `js/supabase-config.js` with your project URL and anon key

3. **Run locally**
   ```bash
   npx serve
   ```
   Open `http://localhost:3000` in your browser.

---

## 📸 Screenshots

> *Homepage with profile, research metrics, and highlight cards.*

---

## 👤 Author

**Harrish** — [@harrish18](https://github.com/harrish18)

Built with ❤️ for Dr. P. Chinnasamy's academic presence online.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
