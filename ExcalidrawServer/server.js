const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

const httpsServer = https.createServer({
    pfx: fs.readFileSync('./cert/sso_d2s_com_vn.pfx'),
    passphrase: 'd2s@123456'
});

// WebSocket server over HTTPS
const wss = new WebSocket.Server({ server: httpsServer });

// Rooms với cả clients và scene data
const rooms = new Map();

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'https://localhost');
    const roomId = url.searchParams.get('room') || 'default';
    
    console.log(`✓ Client connected to room: ${roomId}`);
    
    // Khởi tạo room nếu chưa tồn tại
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            clients: new Set(),
            sceneData: null // Lưu trữ scene data của room
        });
    }
    
    const room = rooms.get(roomId);
    room.clients.add(ws);
    ws.roomId = roomId;
    
    // Gửi scene data hiện tại cho client mới (nếu có)
    if (room.sceneData) {
        console.log(`Sending initial scene to new client in room: ${roomId}`);
        ws.send(JSON.stringify({
            type: 'INITIAL_SCENE',
            ...room.sceneData
        }));
    }
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            // Lưu scene data vào room
            if (data.type === 'SCENE_UPDATE') {
                room.sceneData = data;
            }
            
            // Broadcast cho các client khác trong room
            room.clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log(`✗ Client disconnected from room: ${roomId}`);
        room.clients.delete(ws);
        
        // Xóa room nếu không còn client nào
        if (room.clients.size === 0) {
            console.log(`Room ${roomId} is empty, deleting...`);
            rooms.delete(roomId);
        }
    });
    
    ws.on('error', (error) => {
        console.error(`WebSocket error in room ${roomId}:`, error);
    });
});


httpsServer.listen(6654, () => {
    console.log('WebSocket HTTPS running on wss://sso.d2s.com.vn:6654');
});