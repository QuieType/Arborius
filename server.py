import asyncio
import websockets

connected_clients = set()

async def handler(websocket, path):
    # Register client
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            # Broadcast to all other clients
            for client in connected_clients:
                if client != websocket:
                    await client.send(message)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)

start_server = websockets.serve(handler, "0.0.0.0", 8764)

print("WebSocket server running on ws://0.0.0.0:8764")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
