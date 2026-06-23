require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db');

const authRoutes = require('./api/auth');
const linksRoutes = require('./api/links');
const trackRoutes = require('./api/track');
const sessionsRoutes = require('./api/sessions');
const conversionRoutes = require('./api/conversion');
const trashRoutes = require('./api/trash');
const adminRoutes = require('./api/admin');
const webhookRoutes = require('./api/webhook');
const exportRoutes = require('./api/export');
const templateRoutes = require('./api/template');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.set('io', io);
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/admin/analytics', conversionRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/template', templateRoutes);

io.on('connection', (socket) => { console.log('Socket:', socket.id); socket.on('disconnect', () => console.log('Socket gone:', socket.id)); });

setInterval(() => {
  const all = db.sessions.read(); const now = Date.now(); let changed = false;
  all.forEach(s => { if(!s.lastActivity) return; const diff = (now - new Date(s.lastActivity).getTime())/1000; if(s.isLive && diff > 45) { s.isLive = false; s.status = 'Offline'; changed = true; } });
  if(changed) { db.sessions.write(all); io.emit('visitorOffline', {}); }
}, 10000);

async function seed() {
  const bcrypt = require('bcryptjs');
  const users = db.users.read();
  if (users.length === 0) {
    const h1 = await bcrypt.hash('admin123', 12); const h2 = await bcrypt.hash('user123', 12);
    db.users.write([{ _id:'u_admin', fullName:'Admin User', username:'admin', email:'admin@trackmaster.com', password:h1, role:'admin', status:'active', trackingCode:'ADMIN01', created_at:new Date().toISOString() },{ _id:'u_user', fullName:'Demo User', username:'user', email:'user@trackmaster.com', password:h2, role:'user', status:'active', trackingCode:'USER01', created_at:new Date().toISOString() }]);
    console.log('Seeded 2 users');
  }
}
const PORT = process.env.PORT || 5000;
seed().then(() => { server.listen(PORT, () => console.log('Backend running on http://localhost:' + PORT)); });