import asyncio
import websockets
import json

# Use a list to maintain client order (oldest at the front)
connected_clients = []

async def handler(websocket, path):
    # Register client: Add to the end (newest)
    connected_clients.append(websocket)
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                # Handle cases where the message is not valid JSON
                print(f"Received non-JSON message: {message}")
                continue

            if data.get("type") == "sync":
                # Forward to the oldest client only
                if connected_clients: # Ensure there's at least one client
                    oldest_client = connected_clients[0]
                    # Don't send a sync message back to the sender if they are the oldest client.
                    if oldest_client != websocket:
                        await oldest_client.send(message)
            else:
                # Broadcast to all other clients for non-"sync" messages
                for client in connected_clients:
                    if client != websocket:
                        await client.send(message)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        # Remove client.
        if websocket in connected_clients:
            connected_clients.remove(websocket)
            
start_server = websockets.serve(handler, "0.0.0.0", 8764)

print("WebSocket server running on ws://0.0.0.0:8764")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
