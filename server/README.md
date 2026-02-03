# Factory Bound Multiplayer Server

Backend server for Factory Bound multiplayer functionality.

## Features

- Real-time multiplayer using Socket.io
- Session management (create, join, list)
- Co-op and PvP game modes
- Host-authoritative game state
- Cloud save storage
- Matchmaking system

## Installation

```bash
npm install
```

## Development

Start the server in development mode with auto-reload:

```bash
npm run dev
```

## Production

Build and start:

```bash
npm run build
npm start
```

## Environment Variables

- `PORT` - Server port (default: 3001)

## API Events

### Client → Server

- `create_session` - Create a new game session
- `join_session` - Join an existing session
- `list_sessions` - Get list of available sessions
- `start_session` - Start a session (host only)
- `find_match` - Quick matchmaking
- `game_action` - Send game action to be broadcast
- `sync_state` - Sync game state (host only)
- `request_sync` - Request full state sync
- `save_game` - Save game to cloud
- `load_game` - Load game from cloud
- `ranked_matchmaking` - Find ranked match

### Server → Client

- `session_created` - Confirmation of session creation
- `player_joined` - Notification of new player
- `player_left` - Notification of player disconnect
- `session_started` - Session has started
- `state_update` - Game state updates
- `game_action` - Broadcast of player actions
- `sync_requested` - Request for full sync (to host)

## Architecture

The server uses a host-authoritative model:
1. Host runs the full game simulation
2. Clients send input actions
3. Host validates and processes actions
4. Host broadcasts state updates to all clients
5. Server handles session management and message routing
