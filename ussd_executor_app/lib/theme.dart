import 'package:flutter/material.dart';

class AppTheme {
  static const primary = Color(0xFF7C5CFC);
  static const primaryLight = Color(0xFFA78BFF);
  static const secondary = Color(0xFF2ED3A0);
  static const secondaryLight = Color(0xFF5EE0B8);
  static const accent = Color(0xFFFFB84D);
  static const background = Color(0xFF08080F);
  static const surface = Color(0xFF111120);
  static const surfaceLight = Color(0xFF1A1A30);
  static const cardBg = Color(0xFF15152A);
  static const error = Color(0xFFFF4755);
  static const success = Color(0xFF2ED3A0);
  static const warning = Color(0xFFFFB84D);
  static const textPrimary = Color(0xFFF2F2FF);
  static const textSecondary = Color(0xFF7A7A9E);
  static const textTertiary = Color(0xFF4A4A6A);
  static const border = Color(0xFF1E1E38);

  static const primaryGradient = LinearGradient(
    colors: [primary, primaryLight],
    begin: Alignment.topLeft, end: Alignment.bottomRight,
  );
  static const secondaryGradient = LinearGradient(
    colors: [secondary, secondaryLight],
    begin: Alignment.topLeft, end: Alignment.bottomRight,
  );
  static const surfaceGradient = LinearGradient(
    colors: [Color(0xFF1A1A30), Color(0xFF15152A)],
    begin: Alignment.topLeft, end: Alignment.bottomRight,
  );

  static ThemeData get dark => ThemeData(
    brightness: Brightness.dark,
    useMaterial3: true,
    scaffoldBackgroundColor: background,
    colorScheme: const ColorScheme.dark(
      primary: primary, secondary: secondary, surface: surface, error: error,
      onPrimary: Colors.white, onSecondary: Colors.black, onSurface: textPrimary,
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: textPrimary, letterSpacing: -0.5),
      headlineMedium: TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: textPrimary),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary),
      titleMedium: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: textPrimary),
      bodyLarge: TextStyle(fontSize: 15, color: textPrimary),
      bodyMedium: TextStyle(fontSize: 13, color: textSecondary),
      bodySmall: TextStyle(fontSize: 11, color: textTertiary),
      labelLarge: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: textPrimary, letterSpacing: 0.5),
    ),
    cardTheme: CardThemeData(
      color: cardBg, elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: border.withValues(alpha: 0.6)),
      ),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: surface, selectedItemColor: primary,
      unselectedItemColor: textTertiary, type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
      unselectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: { TargetPlatform.android: CupertinoPageTransitionsBuilder(), TargetPlatform.iOS: CupertinoPageTransitionsBuilder() },
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: surfaceLight, contentTextStyle: const TextStyle(color: textPrimary, fontSize: 14),
      behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: border.withValues(alpha: 0.6))),
    ),
  );
}
