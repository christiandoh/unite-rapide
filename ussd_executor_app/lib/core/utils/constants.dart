class AppConstants {
  static const String appName = 'USSD Executor';
  static const String version = '1.0.0';
  static const int reconnectDelay = 5000;
  static const int statusInterval = 30000;
  static const int defaultUssdTimeout = 30;
  static const int maxRetries = 2;
  static const List<String> supportedOperators = ['Orange', 'MTN', 'Moov'];
}
