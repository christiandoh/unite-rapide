import 'package:get_it/get_it.dart';
import '../../config/app_config.dart';
import '../network/api_client.dart';
import '../network/websocket_client.dart';
import '../services/ussd_executor.dart';
import '../services/phone_monitor.dart';
import '../services/task_queue_manager.dart';

final getIt = GetIt.instance;

Future<void> setupDependencies() async {
  final config = AppConfig();
  await config.loadFromPrefs();
  getIt.registerSingleton<AppConfig>(config);

  getIt.registerSingleton<ApiClient>(
    ApiClient(serverUrl: config.serverUrl),
  );

  getIt.registerLazySingleton<WebSocketService>(() => WebSocketService());
  getIt.registerLazySingleton<USSDExecutor>(() => USSDExecutor());
  getIt.registerLazySingleton<PhoneMonitor>(() => PhoneMonitor());
  getIt.registerLazySingleton<TaskQueueManager>(() => TaskQueueManager());
}
