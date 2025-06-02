import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { getStandings } from '../api/googleSheets';
import { getTournament } from '../api/challonge';
import ConfigScreen from './ConfigScreen';

export default function HomeScreen({ token, config, setConfig, onLogout }) {
  const [output, setOutput] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  async function handleStandings() {
    try {
      const data = await getStandings(config.spreadsheetId, 's4-standings', config.googleApiKey);
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setOutput(err.message);
    }
  }

  async function handleTournament() {
    try {
      const data = await getTournament('final_drive', config.challongeKey);
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setOutput(err.message);
    }
  }

  if (showConfig) {
    return (
      <ConfigScreen
        onSave={(cfg) => {
          setShowConfig(false);
          setConfig({ ...config, ...cfg });
        }}
        initial={config}
      />
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Logged in</Text>
      <Button title="Fetch Standings" onPress={handleStandings} />
      <Button title="Fetch Tournament" onPress={handleTournament} />
      <Button title="Configure" onPress={() => setShowConfig(true)} />
      <Button title="Logout" onPress={onLogout} />
      {output ? <Text style={{ marginTop: 20 }}>{output}</Text> : null}
    </ScrollView>
  );
}
