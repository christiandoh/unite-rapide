import 'package:flutter/services.dart';

class USSDExecutor {
  static const MethodChannel _ussd = MethodChannel('com.app/ussd');
  static const MethodChannel _perms = MethodChannel('com.app/permissions');

  Future<Map<String, dynamic>> executeUSSD({
    required String code,
    required List<String> sequence,
    int timeout = 30,
  }) async {
    final hasCallPhone = await _checkPermission('checkCallPhone');
    if (!hasCallPhone) {
      await _requestPermission('requestCallPhone');
      final granted = await _checkPermission('checkCallPhone');
      if (!granted) {
        return {'success': false, 'error': 'Permission appel requise dans les parametres Android'};
      }
    }

    try {
      final result = await _ussd.invokeMethod('executeUSSD', {
        'code': code,
        'sequence': sequence,
        'timeout': timeout,
      });

      if (result is Map<String, dynamic>) {
        return result;
      }
      return {'success': false, 'error': 'Format de reponse invalide'};
    } on PlatformException catch (e) {
      return {'success': false, 'error': e.message ?? 'Erreur USSD inconnue'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<bool> checkAccessibility() async {
    try {
      final result = await _ussd.invokeMethod<bool>('isAccessibilityEnabled');
      return result ?? false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> waitForAccessibility() async {
    try {
      final result = await _ussd.invokeMethod<bool>('waitForAccessibility');
      return result ?? false;
    } catch (e) {
      return false;
    }
  }

  Future<void> openAccessibilitySettings() async {
    await _ussd.invokeMethod('openAccessibilitySettings');
  }

  Future<bool> hasCallPhonePermission() async {
    return _checkPermission('checkCallPhone');
  }

  Future<bool> requestCallPhonePermission() async {
    return _requestPermission('requestCallPhone');
  }

  Future<bool> hasNotificationPermission() async {
    return _checkPermission('checkNotification');
  }

  Future<bool> requestNotificationPermission() async {
    return _requestPermission('requestNotification');
  }

  Future<bool> _checkPermission(String method) async {
    try {
      final result = await _perms.invokeMethod<bool>(method);
      return result ?? false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> _requestPermission(String method) async {
    try {
      final result = await _perms.invokeMethod<bool>(method);
      return result ?? false;
    } catch (_) {
      return false;
    }
  }
}
