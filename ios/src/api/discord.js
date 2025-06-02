import axios from 'axios';

export async function sendMessage(token, channelId, content) {
  const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
  const headers = {
    Authorization: `Bot ${token}`,
    'Content-Type': 'application/json'
  };
  await axios.post(url, { content }, { headers });
}
