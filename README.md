# 🗺️ Amsterdam Interactive Rental Map

A modern web application for visualizing and managing rental requests across Amsterdam's postal code zones using an interactive map interface.

## 🚀 Live Demo

**[👉 Visit the Live Application](https://interative-rental-map.vercel.app/)**

- Deployed on [Vercel](https://vercel.com)
- Real-time data visualization
- Fully responsive design

---

## 📋 Features

- **Interactive Map**: Explore Amsterdam divided by PC4 postal code zones
- **Rental Requests Management**: Add, view, and manage rental requests
- **District Statistics**: View aggregate statistics per zone
- **Data Export**: Download data to Excel spreadsheet
- **Smart Coordinates**: Automatic location mapping based on postal codes
- **Local & Cloud Storage**: Toggle between local storage and cloud synchronization (Supabase)
- **AI-Powered Data**: Generate sample data using Google Gemini AI
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React** | UI framework |
| **TypeScript** | Type-safe development |
| **Leaflet** | Interactive mapping |
| **Vite** | Fast build tool |
| **Recharts** | Data visualization |
| **Supabase** | Cloud database (optional) |
| **Google Genai** | AI data generation |
| **XLSX** | Excel export functionality |
| **Vercel** | Hosting & deployment |

---

## 📦 Project Structure

```
Interative-rental-map/
├── src/
│   ├── components/          # React components
│   │   ├── MapBoard.tsx     # Interactive map display
│   │   ├── StatsPanel.tsx   # Statistics dashboard
│   │   └── AddRequestModal.tsx # Modal for adding requests
│   ├── services/            # Business logic
│   │   ├── geminiService.ts # AI data generation
│   │   ├── excelService.ts  # Excel export
│   │   └── supabaseClient.ts # Cloud database
│   ├── types.ts             # TypeScript types
│   ├── constants.ts         # Configuration & PC4 zones
│   ├── App.tsx              # Main app component
│   └── index.tsx            # Entry point
├── public/                  # Static assets
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite configuration
└── vercel.json              # Vercel deployment config
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** 16.x or higher ([Download](https://nodejs.org))
- **npm** or **yarn**

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rurila/Interative-rental-map.git
   cd Interative-rental-map
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com) and sign in
3. Click **"Add New..."** → **"Project"**
4. Select this repository from the list
5. Vercel will auto-detect the configuration
6. Click **"Deploy"**
7. Your app will be live in minutes! 🎉

**Result**: Your app will be available at `https://[project-name].vercel.app`

---

## 📊 Data Management

### Local Storage
- Data is stored in browser's local storage
- Perfect for testing and development
- No server required

### Cloud Storage (Supabase)
- Toggle cloud mode in the app UI
- Real-time sync across devices
- Requires Supabase credentials in environment variables

### Environment Variables
Create a `.env.local` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_GOOGLE_GENAI_KEY=your_google_genai_key
```

---

## 🎯 Usage

### Adding Rental Requests
1. Click the **"+" button** in the top-right
2. Fill in the postal code (PC4), address, and details
3. Click **"Submit"** to add the request

### Viewing Statistics
- The right panel displays aggregate statistics
- Hover over zones on the map to see highlights
- Click on a marker to view request details

### Exporting Data
- Click the **"Download"** button to export all requests to Excel

### AI Data Generation
- Click the **"AI Refresh"** button to generate sample data
- Uses Google Gemini to create realistic rental requests

---

## 📚 Additional Resources

- [Developer Guide](./DEVELOPER_GUIDE.md) - Detailed development guide
- [React Documentation](https://react.dev)
- [Leaflet Documentation](https://leafletjs.com)
- [Vite Documentation](https://vitejs.dev)

---

## 👤 Author

**Rurila** - [GitHub Profile](https://github.com/Rurila)

---

## 📝 License

This project is open source. Check the repository for license details.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit pull requests

---

## 📞 Support

For issues, questions, or suggestions, please open an [GitHub Issue](https://github.com/Rurila/Interative-rental-map/issues).

---

**Built with ❤️ using React, TypeScript, and Leaflet**
