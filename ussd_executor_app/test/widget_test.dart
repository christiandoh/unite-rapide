import 'package:flutter_test/flutter_test.dart';
import 'package:ussd_executor_app/main.dart';

void main() {
  testWidgets('App should launch', (WidgetTester tester) async {
    await tester.pumpWidget(const USSDExecutorApp());
    expect(find.byType(USSDExecutorApp), findsOneWidget);
  });
}
