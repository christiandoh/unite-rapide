import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:get_it/get_it.dart';
import '../network/websocket_client.dart';

class PhoneMonitor extends ChangeNotifier {
  static const MethodChannel _channel = MethodChannel('com.app/phone_state');
  double _batteryLevel = 100;
  bool _isCharging = false;
  Timer? _timer;
  bool _disposed = false;

  double get batteryLevel => _batteryLevel;
  bool get isCharging => _isCharging;

  void startMonitoring() {
    _timer?.cancel();
    _updateBattery();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) {
      _updateBattery();
      _sendStatusToWs();
    });
  }

  Future<void> _updateBattery() async {
    try {
      final result = await _channel.invokeMethod<Map<String, dynamic>>('getBatteryStatus');
      if (result != null) {
        _batteryLevel = (result['level'] as num?)?.toDouble() ?? _batteryLevel;
        _isCharging = result['charging'] == true;
        notifyListeners();
      }
    } catch (_) {}
  }

  void _sendStatusToWs() {
    try {
      final ws = GetIt.instance<WebSocketService>();
      ws.sendPhoneStatus(getStatus());
    } catch (_) {}
  }

  void stopMonitoring() {
    _timer?.cancel();
  }

  Map<String, dynamic> getStatus() {
    return {
      'battery_level': _batteryLevel.round(),
      'is_charging': _isCharging,
      'timestamp': DateTime.now().toIso8601String(),
    };
  }

  @override
  void addListener(VoidCallback listener) {
    if (!_disposed) super.addListener(listener);
  }

  @override
  void removeListener(VoidCallback listener) {
    if (!_disposed) super.removeListener(listener);
  }

  @override
  void notifyListeners() {
    if (!_disposed) super.notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _timer?.cancel();
    super.dispose();
  }
}
