import 'package:shared_preferences/shared_preferences.dart';

const String kApiBaseUrl = 'http://192.168.1.7/unite/api';
const String kWsBaseUrl = 'http://192.168.1.7';

class AppConfig {
  String serverUrl;
  String wsUrl;
  String phoneToken;
  String phoneName;

  AppConfig({
    this.serverUrl = kApiBaseUrl,
    this.wsUrl = kWsBaseUrl,
    this.phoneToken = '',
    this.phoneName = '',
  });

  bool get isConfigured => phoneToken.isNotEmpty && phoneName.isNotEmpty;

  factory AppConfig.fromMap(Map<String, dynamic> map) {
    return AppConfig(
      serverUrl: map['server_url'] ?? kApiBaseUrl,
      wsUrl: map['ws_url'] ?? kWsBaseUrl,
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
    serverUrl = prefs.getString('server_url') ?? kApiBaseUrl;
    wsUrl = prefs.getString('ws_url') ?? kWsBaseUrl;
    phoneToken = prefs.getString('phone_token') ?? '';
    phoneName = prefs.getString('phone_name') ?? '';
  }
}
