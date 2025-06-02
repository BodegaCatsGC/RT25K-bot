import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ConfigScreen from './src/screens/ConfigScreen';

export default function App() {
  const [token, setToken] = useState(null);
  const [config, setConfig] = useState(null);

  if (!token) {
    return <LoginScreen onLogin={setToken} />;
  }

  if (!config) {
    return <ConfigScreen onSave={setConfig} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <HomeScreen
        token={token}
        config={config}
        setConfig={setConfig}
        onLogout={() => {
          setConfig(null);
          setToken(null);
        }}
      />
    </SafeAreaView>
  );
}
