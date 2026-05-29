import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:get_it/get_it.dart';
import 'core/di/injection_container.dart' as di;
import 'config/app_config.dart';
import 'theme.dart';
import 'features/dashboard/screens/executor_dashboard.dart';
import 'features/setup/setup_screen.dart';
import 'features/setup/permissions_screen.dart';
import 'features/settings/screens/settings_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent),
  );
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  await di.setupDependencies();
  runApp(const USSDExecutorApp());
}

class USSDExecutorApp extends StatefulWidget {
  const USSDExecutorApp({super.key});
  @override
  State<USSDExecutorApp> createState() => _USSDExecutorAppState();
}

class _USSDExecutorAppState extends State<USSDExecutorApp> {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'USSD Executor',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      initialRoute: '/splash',
      routes: {
        '/splash': (_) => const _SplashScreen(),
        '/setup': (_) => const SetupScreen(),
        '/permissions': (_) => const PermissionsScreen(),
        '/dashboard': (_) => const AppShell(),
      },
    );
  }
}

class _SplashScreen extends StatefulWidget {
  const _SplashScreen();
  @override
  State<_SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<_SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;
  late Animation<double> _glowScale;
  late Animation<double> _subtitleOpacity;
  late Animation<double> _progress;

  @override
  void initState() {
    super.initState();
    Timer(const Duration(seconds: 3), () {
      if (mounted) {
        final configured = GetIt.instance<AppConfig>().isConfigured;
        Navigator.pushReplacementNamed(context, configured ? '/dashboard' : '/setup');
      }
    });
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200));
    _scale = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: const Interval(0.0, 0.5, curve: Curves.elasticOut)),
    );
    _glowScale = Tween<double>(begin: 0.5, end: 1.2).animate(
      CurvedAnimation(parent: _ctrl, curve: const Interval(0.1, 0.8, curve: Curves.easeOut)),
    );
    _subtitleOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: const Interval(0.4, 0.7, curve: Curves.easeOut)),
    );
    _progress = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: const Interval(0.5, 1.0, curve: Curves.easeInOutCubic)),
    );
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity, height: double.infinity,
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0.2, -0.3), radius: 2.0,
            colors: [Color(0xFF1A1A30), Color(0xFF0A0A15), Color(0xFF08080F)],
          ),
        ),
        child: Stack(
          children: [
            ...List.generate(3, (i) => Positioned(
              top: -60 - i * 40.0, left: -60 - i * 40.0,
              child: AnimatedBuilder(
                animation: _glowScale,
                builder: (_, __) => Transform.scale(
                  scale: _glowScale.value * (1 + i * 0.15),
                  child: Container(
                    width: 200 + i * 60.0, height: 200 + i * 60.0,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.primary.withValues(alpha: 0.12 - i * 0.03),
                    ),
                  ),
                ),
              ),
            )),
            Positioned(bottom: -80, right: -80,
              child: Container(
                width: 300, height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.secondary.withValues(alpha: 0.06),
                ),
              ),
            ),
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedBuilder(
                    animation: _scale,
                    builder: (_, child) => Transform.scale(scale: _scale.value, child: child),
                    child: Container(
                      width: 96, height: 96,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: AppTheme.primaryGradient,
                        boxShadow: [
                          BoxShadow(color: AppTheme.primary.withValues(alpha: 0.5), blurRadius: 40, spreadRadius: 8),
                        ],
                      ),
                      child: Icon(PhosphorIcons.phoneCall(PhosphorIconsStyle.fill), color: Colors.white, size: 44),
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text('USSD', style: TextStyle(fontSize: 40, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -1)),
                  const Text('EXECUTOR', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w300, color: AppTheme.textTertiary, letterSpacing: 8)),
                  const SizedBox(height: 8),
                  AnimatedBuilder(
                    animation: _subtitleOpacity,
                    builder: (_, __) => Opacity(
                      opacity: _subtitleOpacity.value,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(width: 24, height: 1, color: AppTheme.primary.withValues(alpha: 0.3)),
                          const SizedBox(width: 12),
                          Text('Plateforme d\'automatisation',
                            style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, letterSpacing: 1)),
                          const SizedBox(width: 12),
                          Container(width: 24, height: 1, color: AppTheme.primary.withValues(alpha: 0.3)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 64),
                  AnimatedBuilder(
                    animation: _progress,
                    builder: (_, __) => SizedBox(
                      width: 160,
                      child: Column(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(2),
                            child: LinearProgressIndicator(
                              value: _progress.value,
                              backgroundColor: Colors.white.withValues(alpha: 0.06),
                              valueColor: const AlwaysStoppedAnimation(AppTheme.primary),
                              minHeight: 3,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text('Initialisation...',
                            style: TextStyle(fontSize: 11, color: AppTheme.textTertiary, letterSpacing: 1)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AppShell extends StatefulWidget {
  const AppShell({super.key});
  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _page = 0;

  final _pages = <Widget>[
    const ExecutorDashboard(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
        child: IndexedStack(
          index: _page,
          children: _pages,
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: AppTheme.border.withValues(alpha: 0.5))),
        ),
        child: BottomNavigationBar(
          currentIndex: _page,
          onTap: (i) => setState(() => _page = i),
          items: [
            BottomNavigationBarItem(
              icon: Icon(_page == 0 ? PhosphorIcons.gauge(PhosphorIconsStyle.fill) : PhosphorIcons.gauge(PhosphorIconsStyle.regular)),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(_page == 1 ? PhosphorIcons.gearSix(PhosphorIconsStyle.fill) : PhosphorIcons.gearSix(PhosphorIconsStyle.regular)),
              label: 'Paramètres',
            ),
          ],
        ),
      ),
    );
  }
}
