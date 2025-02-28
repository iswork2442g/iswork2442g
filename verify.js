const express = require('express');
const app = express();
const cors = require('cors');
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 從環境變數讀取敏感資訊
require('dotenv').config();

// 添加檢查確保所有必要的環境變數都存在
const requiredEnvVars = [
  'DISCORD_BOT_TOKEN',
  'GUILD_ID',
  'ROLE_ID', 
  'LOG_CHANNEL_ID',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'REDIRECT_URI'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Discord Bot token和設定
const TOKEN = process.env.DISCORD_BOT_TOKEN;  // 改用環境變數
const GUILD_ID = process.env.GUILD_ID;        // 改用環境變數
const ROLE_ID = process.env.ROLE_ID;          // 改用環境變數
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;  // 改用環境變數

// 啟用CORS和JSON解析
app.use(cors());
app.use(express.json());

// 添加 session 支援
const session = require('express-session');
app.use(session({
    secret: 'your_session_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Discord OAuth2 設定
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;         // 改用環境變數
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET; // 改用環境變數
const REDIRECT_URI = process.env.REDIRECT_URI;                   // 改用環境變數

// 處理 Discord 登入
app.get('/auth/discord', (req, res) => {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(authUrl);
});

// Discord OAuth2 callback
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.redirect('/error');
    }

    try {
        // 交換 code 獲取 token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();
        
        // 獲取用戶資訊
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });

        const userData = await userResponse.json();
        req.session.discordId = userData.id;
        
        res.redirect('/verify.html');
    } catch (error) {
        console.error(error);
        res.redirect('/error');
    }
});

// 驗證 API
app.post('/verify', async (req, res) => {
    if (!req.session.discordId) {
        return res.status(401).json({ success: false, error: '請先登入' });
    }

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(req.session.discordId);
        
        await member.roles.add(ROLE_ID);
        
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        await logChannel.send(
            `使用者 ${member.user.tag} (${req.session.discordId}) 已通過驗證\n` +
            `IP地址: ${req.ip}`
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 啟動伺服器和Bot
client.login(TOKEN);
app.listen(3000, () => {
    console.log('Verification server running on port 3000');
});
