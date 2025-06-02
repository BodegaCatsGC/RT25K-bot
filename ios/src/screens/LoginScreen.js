import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function LoginScreen({ onLogin }) {
  const [token, setToken] = useState('');

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Discord Bot Token</Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        placeholder="Bot Token"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 8, marginBottom: 20 }}
      />
      <Button title="Login" onPress={() => onLogin(token)} />
    </View>
  );
}
