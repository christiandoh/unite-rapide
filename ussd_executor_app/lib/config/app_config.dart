import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  String serverUrl;
  String wsUrl;
  String phoneToken;
  String phoneName;

  AppConfig({
    this.serverUrl = 'http://192.168.1.2',
    this.wsUrl = 'http://192.168.1.2:8080',
    this.phoneToken = '',
    this.phoneName = '',
  });

  bool get isConfigured => phoneToken.isNotEmpty && phoneName.isNotEmpty;

  factory AppConfig.fromMap(Map<String, dynamic> map) {
    return AppConfig(
      serverUrl: map['server_url'] ?? 'http://192.168.1.2',
      wsUrl: map['ws_url'] ?? 'http://192.168.1.2:8080',
      phoneToken: map['token'] ?? '',
      phoneName: map['name'] ?? '',
    );
  }

  Future<void> saveToPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('server_url', serverUrl);
    await prefs.setString('ws_url', wsUrl);
    await prefs.setString('phone_token', phoneToken);
    await prefs.setString('phone_name', phoneName);
  }

  Future<void> loadFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    serverUrl = prefs.getString('server_url') ?? 'http://192.168.1.2';
    wsUrl = prefs.getString('ws_url') ?? 'http://192.168.1.2:8080';
    phoneToken = prefs.getString('phone_token') ?? '';
    phoneName = prefs.getString('phone_name') ?? '';
  }
}
