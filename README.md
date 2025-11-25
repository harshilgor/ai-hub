# 🤖 Insider Info

A comprehensive platform for tracking AI funding, exploring trends, and discovering the future of artificial intelligence investments.

## ✨ Features

### 📊 **Homepage - AI Funding Feed**
- Live AI funding announcements
- Advanced filtering by category and funding stage
- Real-time statistics and trending categories
- Top investors leaderboard

### 🚀 **YC Explorer**
- Browse Y Combinator's AI-focused startups
- Detailed startup profiles with funding information
- Interactive modals with founder details
- Filter by batch, category, and region

### 📈 **Insights & Trends Dashboard**
- Interactive charts and visualizations
- Funding distribution by category
- Monthly funding trends
- Top investors and emerging categories
- AI-powered insights

### 🕸️ **Knowledge Graph Builder**
- Interactive graph visualization
- Connect startups, research papers, investors, and concepts
- Pan, zoom, and explore relationships
- Save and share custom graphs

### 📄 **Research Papers**
- Latest AI research with plain-English summaries
- Connections to related startups
- Filter by venue, category, and date
- Reading list management

### 🏢 **Industry-Specific Trends**
- Deep dives into Healthcare, Finance, Robotics, and more
- Industry-specific metrics and insights
- Timeline of major funding events
- Trending keywords and concepts

### 💾 **My Tracker (Personalized Dashboard)**
- Save and organize startups
- Follow specific AI categories
- Custom alerts and notifications
- Saved knowledge graphs
- Reading list with progress tracking
- Personalized learning paths

## 🎨 Design Features

- **Glassmorphic Design**: Modern, translucent UI elements
- **Dark/Light Mode**: Seamless theme switching
- **Smooth Animations**: Framer Motion powered micro-interactions
- **Responsive Layout**: Works beautifully on all screen sizes
- **Interactive Charts**: Recharts for data visualization
- **Graph Visualization**: React Flow for knowledge graphs

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Graph Visualization**: React Flow
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-investment-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
ai-investment-hub/
├── src/
│   ├── components/
│   │   └── Header.tsx          # Global navigation header
│   ├── contexts/
│   │   └── ThemeContext.tsx    # Dark/light mode management
│   ├── data/
│   │   └── mockData.ts         # Mock data for demonstration
│   ├── pages/
│   │   ├── HomePage.tsx        # AI funding feed
│   │   ├── YCExplorer.tsx      # YC startup explorer
│   │   ├── TrendsDashboard.tsx # Analytics dashboard
│   │   ├── KnowledgeGraph.tsx  # Graph builder
│   │   ├── ResearchPapers.tsx  # Papers feed
│   │   ├── IndustryTrends.tsx  # Industry deep dives
│   │   └── MyTracker.tsx       # Personal dashboard
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## 🎯 Key Design Principles

1. **Clarity**: Clean information hierarchy
2. **Discoverability**: Intuitive navigation flow
3. **Visual Appeal**: Modern, premium aesthetic
4. **Data Density**: Rich information without overwhelming
5. **Personalization**: Adapts to user interests
6. **Interconnectedness**: Everything links together
7. **Performance**: Smooth, responsive interactions
8. **Accessibility**: High contrast, keyboard navigation

## 🌈 Color Palette

### Light Mode
- Background: `#FAFBFC`
- Cards: `#FFFFFF`
- Primary: `#2563EB`
- Success: `#10B981`
- Insight: `#8B5CF6`

### Dark Mode
- Background: `#0F1419`
- Cards: `#1A1F2E`
- Primary: `#3B82F6`
- Success: `#34D399`
- Insight: `#A78BFA`

## 🔮 Future Enhancements

- [ ] Backend integration with real AI funding data
- [ ] User authentication and profiles
- [ ] Real-time notifications
- [ ] Social features (sharing, comments)
- [ ] Advanced analytics and predictions
- [ ] Export reports (PDF, Excel)
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or feedback, please reach out to the development team.

---

**Built with ❤️ for the AI investment community**

