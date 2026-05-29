import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;
import 'package:get_it/get_it.dart';
import '../../config/app_config.dart';

class WebSocketService {
  socket_io.Socket? _socket;
  final StreamController<Map<String, dynamic>> _commandController =
      StreamController<Map<String, dynamic>>.broadcast();
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectDelay = 30000;

  Stream<Map<String, dynamic>> get commands => _commandController.stream;
  bool get isConnected => _socket?.connected ?? false;

  void connect() {
    final config = GetIt.instance<AppConfig>();
    if (config.phoneToken.isEmpty) return;

    _socket?.disconnect();
    _socket?.clearListeners();
    _socket?.destroy();

    _socket = socket_io.io(
      '${config.wsUrl}/phones',
      socket_io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': config.phoneToken})
          .enableAutoConnect()
          .setExtraHeaders({'User-Agent': 'ussd-executor'})
          .build(),
    );

    _socket!.onConnect((_) {
      _reconnectAttempts = 0;
      sendStatus();
      _startHeartbeat();
    });

    _socket!.onConnectError((data) {
      _scheduleReconnect();
    });

    _socket!.onDisconnect((_) {
      _stopHeartbeat();
      _scheduleReconnect();
    });

    _socket!.on('ussd:execute', (data) {
      if (data is Map<String, dynamic>) {
        _commandController.add(data);
      }
    });
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => sendStatus(),
    );
  }

  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    final delay = (_reconnectAttempts < 6)
        ? (1000 * (_reconnectAttempts + 1))
        : _maxReconnectDelay;
    _reconnectAttempts++;
    _reconnectTimer = Timer(Duration(milliseconds: delay), connect);
  }

  void sendResult(Map<String, dynamic> result) {
    _socket?.emit('ussd:result', result);
  }

  void sendStatus([Map<String, dynamic>? extra]) {
    final status = extra ?? {};
    status.putIfAbsent('status', () => 'en_ligne');
    status.putIfAbsent('timestamp', () => DateTime.now().toIso8601String());
    _socket?.emit('phone:status', status);
  }

  void sendPhoneStatus(Map<String, dynamic> phoneStats) {
    sendStatus({
      'battery_level': phoneStats['battery_level'],
      'is_charging': phoneStats['is_charging'],
    });
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _stopHeartbeat();
    _socket?.disconnect();
    _socket?.clearListeners();
    _socket?.destroy();
    _commandController.close();
  }
}
