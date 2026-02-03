# Factory Bound - Multiplayer Quick Start

## 🚀 Get Started in 3 Steps

### Step 1: Install
```bash
npm install
cd server && npm install && cd ..
```

### Step 2: Start
```bash
npm run dev:all
```

### Step 3: Play!
Open http://localhost:5173 in your browser

---

## 🎮 Multiplayer Setup

### Creating a Game (Host)
1. Click **"Multiplayer"** from main menu
2. Click **"Host Game"**
3. Select **Co-op** or **PvP** mode
4. Configure settings (players, difficulty, etc.)
5. Click **"Create Session"**
6. Share the **session code** with friends (first 6 characters)
7. Click **"Start Game"** when everyone is ready

### Joining a Game (Guest)
1. Click **"Multiplayer"** from main menu
2. Click **"Join Game"**
3. Enter the **session code** from your friend
4. Click **"Join"**
5. Wait for host to start the game

### Quick Match
1. Click **"Multiplayer"** from main menu
2. Click **"Quick Match"**
3. Select **Co-op** or **PvP**
4. System finds an available game automatically

---

## ✅ Verify Everything Works

### Test the Server
```bash
cd server
npm test
```

Expected output:
```
✓ PASS: Health endpoint
✓ PASS: WebSocket connection
✓ PASS: Session creation
✓ PASS: List sessions
✓ PASS: Join session

All tests passed!
```

### Manual Test
1. Open two browser windows at http://localhost:5173
2. Window 1: Create a multiplayer session
3. Window 2: Join using the session code
4. Start building - changes sync in real-time!

---

## 🎯 Game Modes

### Co-op Mode
- Work together with up to 8 players
- Shared resources and inventory
- Shared money and progression
- Collaborative building
- Shared victory conditions

### PvP Mode
- Compete against other players
- Separate bases and resources
- Military units and combat
- Last player standing wins
- Ranked matchmaking available

---

## 🛠️ Troubleshooting

### Server won't start
```bash
# Check if port 3001 is free
lsof -i :3001

# Try a different port
PORT=8080 npm run dev:server
```

### Can't connect to server
1. Ensure server is running: `cd server && npm run dev`
2. Check browser console for errors
3. Verify http://localhost:3001/health responds
4. Check firewall settings

### Players can't see each other
1. Both players must be in the **same session**
2. Check session code is correct
3. Ensure both connected to same server
4. Verify no network errors in console

---

## 📚 More Information

- **Complete Guide**: See [MULTIPLAYER_GUIDE.md](MULTIPLAYER_GUIDE.md)
- **Implementation**: See [MULTIPLAYER_SUMMARY.md](MULTIPLAYER_SUMMARY.md)
- **Main README**: See [README.md](README.md)

---

## 🎉 You're Ready!

Multiplayer is fully working. Start playing with friends now!

**Have fun building factories together!** 🏭
