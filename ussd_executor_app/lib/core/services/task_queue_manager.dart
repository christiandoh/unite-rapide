import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:get_it/get_it.dart';
import '../network/websocket_client.dart';
import 'ussd_executor.dart';
import '../utils/constants.dart';

class QueuedTask {
  final String commandeId;
  final String code;
  final List<String> sequence;
  final DateTime addedAt;
  int retryCount;

  QueuedTask({
    required this.commandeId,
    required this.code,
    required this.sequence,
    required this.addedAt,
    this.retryCount = 0,
  });
}

class TaskQueueManager extends ChangeNotifier {
  final List<QueuedTask> _queue = [];
  final Set<String> _completedIds = {};
  String _currentProcessingId = '';
  bool _processing = false;
  int successCount = 0;
  int failCount = 0;
  int totalCount = 0;
  String currentStatus = 'En attente de tâches';
  final List<Map<String, dynamic>> taskLogs = [];

  bool get isProcessing => _processing;
  int get queueLength => _queue.length;

  Future<void> enqueue(Map<String, dynamic> cmd) async {
    final id = cmd['commandeId'] ?? '';
    if (id.isEmpty) return;
    if (_completedIds.contains(id)) return;
    if (_currentProcessingId == id) return;
    if (_queue.any((t) => t.commandeId == id)) return;

    final task = QueuedTask(
      commandeId: id,
      code: cmd['code'] ?? '',
      sequence: (cmd['sequence'] as List?)?.cast<String>() ?? [],
      addedAt: DateTime.now(),
    );
    _queue.add(task);
    totalCount++;
    currentStatus = 'Tâche ajoutée à la file';
    notifyListeners();
    if (!_processing) {
      await _processNext();
    }
  }

  Future<void> _processNext() async {
    if (_queue.isEmpty) {
      _processing = false;
      currentStatus = 'En attente de tâches';
      notifyListeners();
      return;
    }

    _processing = true;
    final task = _queue.removeAt(0);
    _currentProcessingId = task.commandeId;
    final ws = GetIt.instance<WebSocketService>();
    final ussd = GetIt.instance<USSDExecutor>();

    currentStatus = 'Exécution...';
    notifyListeners();

    try {
      final r = await ussd.executeUSSD(
        code: task.code,
        sequence: task.sequence,
      );

      final success = r['success'] == true;
      if (success) {
        successCount++;
        currentStatus = 'Succès';
      } else {
        failCount++;
        currentStatus = 'Échec';
      }

      taskLogs.insert(0, {
        'id': task.commandeId.length > 6
            ? task.commandeId.substring(0, 6)
            : task.commandeId,
        'success': success,
        'message': r['message'] ?? r['error'] ?? (success ? 'OK' : 'Erreur'),
        'timestamp': DateTime.now().toIso8601String(),
      });

      ws.sendResult({
        'commandeId': task.commandeId,
        'success': success,
        'message': r['message'] ?? r['error'] ?? 'OK',
        'logs': [r],
      });

      _completedIds.add(task.commandeId);

      if (!success && task.retryCount < AppConstants.maxRetries) {
        task.retryCount++;
        _completedIds.remove(task.commandeId);
        _queue.insert(0, task);
        currentStatus = 'Nouvelle tentative (${task.retryCount}/${AppConstants.maxRetries})';
      }
    } catch (e) {
      failCount++;
      currentStatus = 'Erreur: $e';
      ws.sendResult({
        'commandeId': task.commandeId,
        'success': false,
        'message': e.toString(),
        'logs': [],
      });

      _completedIds.add(task.commandeId);

      if (task.retryCount < AppConstants.maxRetries) {
        task.retryCount++;
        _completedIds.remove(task.commandeId);
        _queue.insert(0, task);
      }
    }

    _currentProcessingId = '';
    notifyListeners();
    await _processNext();
  }

  void clearLogs() {
    taskLogs.clear();
    notifyListeners();
  }
}
