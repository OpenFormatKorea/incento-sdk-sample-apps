import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

// Local Test - iOS
// const WEB_URL = 'http://localhost:5173'; 
// Local Test - Android
const WEB_URL = 'http://10.0.2.2:5173';

function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <WebView source={{ uri: WEB_URL }} style={styles.webview} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default App;
