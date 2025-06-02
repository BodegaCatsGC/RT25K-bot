import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function ConfigScreen({ onSave, initial }) {
  const [spreadsheetId, setSpreadsheetId] = useState(initial?.spreadsheetId || '');
  const [challongeKey, setChallongeKey] = useState(initial?.challongeKey || '');
  const [googleApiKey, setGoogleApiKey] = useState(initial?.googleApiKey || '');

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Configuration</Text>
      <TextInput
        placeholder="Google Spreadsheet ID"
        value={spreadsheetId}
        onChangeText={setSpreadsheetId}
        style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Google API Key"
        value={googleApiKey}
        onChangeText={setGoogleApiKey}
        style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Challonge API Key"
        value={challongeKey}
        onChangeText={setChallongeKey}
        style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
      />
      <Button title="Save" onPress={() => onSave({ spreadsheetId, challongeKey, googleApiKey })} />
    </View>
  );
}
