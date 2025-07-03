import { NextResponse } from 'next/server';
import axios from 'axios';
import { UAParser } from 'ua-parser-js';

const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!;
const ROLE_ID_TO_ASSIGN = process.env.DISCORD_ROLE_ID!;
const DISCORD_WEBHOOK_URL = process.env.WEBHOOK_DISCORD_URL_SEND!;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) return new NextResponse('Missing code', { status: 400 });

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'IP sconosciuto';

    const userAgent = request.headers.get('user-agent') || 'Unknown';
  const parser = new UAParser();
  parser.setUA(userAgent);
  const deviceType = parser.getDevice().type || 'desktop';
  const os = parser.getOS();
  const browser = parser.getBrowser();

  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);

  try {
    const tokenRes = await axios.post(DISCORD_TOKEN_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    });

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const user = userRes.data;
    const userId = user.id;
    const username = `${user.username}#${user.discriminator || '0000'}`;

    await axios.put(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${ROLE_ID_TO_ASSIGN}`,
      {},
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    await axios.post(
      DISCORD_WEBHOOK_URL,
      {
        username: 'OAuth Logger',
        embeds: [
          {
            title: 'Nuova persona Autenticata',
            color: 0x00ff00,
            image: {
              url: 'https://cdn.discordapp.com/attachments/1389325406569763020/1390328980422393916/2fc69__3_-removebg-preview.png?ex=6867dc43&is=68668ac3&hm=4b0a57e4d7df9c83788fc835e2087a65541e1262cd82f6b5a87f0200346389c8&',
            },
            fields: [
              { name: '👤 Utente', value: `\`${username}\` (${userId})`, inline: false },
              { name: '🌍 IP', value: `\`${ip}\``, inline: true },
              { name: '💻 Dispositivo', value: `\`${deviceType}\``, inline: true },
              { name: '🧠 OS', value: `\`${os.name} ${os.version}\``, inline: true },
              { name: '🌐 Browser', value: `\`${browser.name} ${browser.version}\``, inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return new NextResponse('Successo', { status: 200 });
  } catch (error: any) {
    console.error('Errore OAuth/ruolo/webhook:', error.response?.data || error.message);
    return new NextResponse('Errore interno', { status: 500 });
  }
}
