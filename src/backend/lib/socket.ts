import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer;

// Map lessonId -> Set of WebSockets
const liveRooms = new Map<number, Set<WebSocket>>();
// Map WebSocket -> current lessonId
const clientLesson = new Map<WebSocket, number>();

export const initSocket = (server: Server) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', (messageRaw) => {
      try {
        const msg = JSON.parse(messageRaw.toString());
        if (msg.action === 'join_live_room' && msg.lessonId) {
          const lessonId = Number(msg.lessonId);
          // Remove from previous room if any
          const prevLessonId = clientLesson.get(ws);
          if (prevLessonId && liveRooms.has(prevLessonId)) {
            liveRooms.get(prevLessonId)!.delete(ws);
            broadcast('LIVE_VIEWER_COUNT', { lessonId: prevLessonId, count: liveRooms.get(prevLessonId)!.size });
          }

          if (!liveRooms.has(lessonId)) {
            liveRooms.set(lessonId, new Set());
          }
          liveRooms.get(lessonId)!.add(ws);
          clientLesson.set(ws, lessonId);

          const count = liveRooms.get(lessonId)!.size;
          broadcast('LIVE_VIEWER_COUNT', { lessonId, count });
        } else if (msg.action === 'leave_live_room' && msg.lessonId) {
          const lessonId = Number(msg.lessonId);
          if (liveRooms.has(lessonId)) {
            liveRooms.get(lessonId)!.delete(ws);
            clientLesson.delete(ws);
            broadcast('LIVE_VIEWER_COUNT', { lessonId, count: liveRooms.get(lessonId)!.size });
          }
        } else if (msg.action === 'send_reaction' && msg.lessonId) {
          broadcast('LIVE_REACTION', {
            id: `${Date.now()}-${Math.random()}`,
            lessonId: Number(msg.lessonId),
            emoji: msg.emoji,
            userName: msg.userName || 'Student',
          });
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('error', console.error);

    ws.on('close', () => {
      const lessonId = clientLesson.get(ws);
      if (lessonId && liveRooms.has(lessonId)) {
        liveRooms.get(lessonId)!.delete(ws);
        clientLesson.delete(ws);
        broadcast('LIVE_VIEWER_COUNT', { lessonId, count: liveRooms.get(lessonId)!.size });
      }
      console.log('WebSocket connection closed');
    });
  });

  return wss;
};

export const broadcast = (event: string, data: any) => {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }

  const payload = JSON.stringify({ event, data });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

export const getLiveViewerCount = (lessonId: number): number => {
  return liveRooms.get(lessonId)?.size || 0;
};
