# Nadilo - Crypto Clash

A blockchain-integrated space shooter game built with React, TypeScript, Phaser.js, and Monad Games ID integration.

## 🎮 Game Features

- **Avatar Selection**: Choose from 3 unique fighters (Moyaki, Molandak, Chog)
- **60-Second Survival**: Survive waves of enemies for exactly 60 seconds
- **Power-ups**: Collect various power-ups for enhanced abilities
- **Blockchain Integration**: Scores are recorded on Monad blockchain
- **Leaderboard System**: Compete with other players globally

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Game Engine**: Phaser.js 3
- **Authentication**: Privy (with Monad Games ID support)
- **Database**: Supabase
- **Blockchain**: Monad Testnet
- **Styling**: CSS3

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nadilo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Privy App ID for authentication
   VITE_PRIVY_APP_ID=your_privy_app_id

   # Wallet Private Key (for secure server-side operations)
   WALLET_PRIVATE_KEY=your_wallet_private_key
   ```

4. **Database Setup**
   Run the SQL schema in your Supabase project:
   ```sql
   -- See schema.sql for complete database setup
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🎯 Game Controls

- **WASD**: Move your fighter
- **Mouse**: Aim and fire
- **ESC**: Pause game
- **SHIFT**: Dash ability (when moving)

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Game.tsx        # Main game wrapper
│   └── Leaderboard.tsx # Leaderboard display
├── game/               # Phaser.js game logic
│   ├── GameScene.ts    # Main game scene
│   ├── MenuScene.ts    # Menu scene
│   ├── AvatarSelectScene.ts # Avatar selection
│   ├── Player.ts       # Player class
│   ├── Enemy.ts        # Enemy class
│   └── PowerUp.ts      # Power-up system
├── lib/                # Utility libraries
│   ├── monadContract.ts # Blockchain integration
│   └── supabase.ts     # Database client
└── services/           # API services
    └── leaderboard.ts  # Leaderboard service
```

## 🎮 Gameplay

1. **Authentication**: Sign in with Monad Games ID
2. **Avatar Selection**: Choose your fighter (mandatory)
3. **Survival Mode**: Survive for 60 seconds against waves of enemies
4. **Score System**: Earn points by destroying enemies and surviving
5. **Leaderboard**: Compete for the highest score

## 🔧 Avatar System

### Moyaki (Lightning Speed)
- **Speed**: 280
- **Health**: 90
- **Fire Rate**: 200ms
- **Special**: Lightning Speed

### Molandak (Heavy Armor)
- **Speed**: 180
- **Health**: 180
- **Fire Rate**: 500ms
- **Special**: Heavy Armor

### Chog (Balanced Power)
- **Speed**: 230
- **Health**: 130
- **Fire Rate**: 300ms
- **Special**: Balanced Power

## 🏆 Scoring System

- **Enemy Hit**: 50 points
- **Enemy Destroyed**: Variable (100-250 points based on type)
- **Wave Completion**: 500 × wave number
- **60-Second Survival**: 1000 bonus points

## 🔗 Blockchain Integration

The game integrates with Monad blockchain for:
- **Score Recording**: All scores are recorded on-chain
- **Player Authentication**: Using Monad Games ID
- **Leaderboard**: Decentralized leaderboard system

## 📊 Database Schema

### Leaderboard Table
- `id`: Primary key
- `player_name`: Player identifier
- `score`: Game score
- `game_duration`: Time played (seconds)
- `created_at`: Timestamp

### Player Stats Table
- `player_name`: Unique player identifier
- `total_games`: Number of games played
- `best_score`: Highest score achieved
- `total_score`: Cumulative score
- `average_score`: Average score per game

## 🚀 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel
   - Netlify
   - AWS S3 + CloudFront

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Performance Optimizations

The game has been optimized for smooth performance:
- Disabled heavy visual effects during combat
- Optimized collision detection
- Simplified particle systems
- Efficient bullet management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 🔮 Future Features

- [ ] Multiple game modes
- [ ] NFT integration
- [ ] Tournament system
- [ ] Mobile support
- [ ] Sound effects and music
- [ ] Achievement system

---

**Built with ❤️ for the Monad ecosystem**