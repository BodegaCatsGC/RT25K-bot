import axios from 'axios';

export async function getTournament(tournamentId = 'final_drive', apiKey) {
  const url = `https://api.challonge.com/v1/tournaments/${tournamentId}.json?api_key=${apiKey}&include_matches=1&include_participants=1`;
  const res = await axios.get(url);
  return res.data;
}
