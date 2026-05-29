import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../core/di/injection_container.dart' as di;
import '../../core/network/websocket_client.dart';
import '../../config/app_config.dart';
import '../../theme.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key});

  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final _ipCtrl = TextEditingController(text: 'sense-cookbook-quoted-wishing.trycloudflare.com');
  final _codeCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _setup() async {
    final raw = _ipCtrl.text.trim();
    final code = _codeCtrl.text.trim().toUpperCase();
    final phone = _phoneCtrl.text.trim();

    if (code.isEmpty || phone.isEmpty) {
      setState(() => _error = 'Code et numero requis');
      return;
    }

    setState(() { _loading = true; _error = null; });

    try {
      final hasScheme = raw.startsWith('http://') || raw.startsWith('https://');
      final host = hasScheme ? Uri.parse(raw).host : raw;
      final scheme = hasScheme ? Uri.parse(raw).scheme : (host.contains('.') ? 'https' : 'http');
      final port = hasScheme ? (Uri.parse(raw).port == 80 || Uri.parse(raw).port == 443 ? '' : ':${Uri.parse(raw).port}') : '';
      final base = '${scheme}://$host$port';
      final url = '$base/unite/api/phone/lookup';

      final res = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'code': code, 'telephone': phone}),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final token = data['token'] as String;
        final wsUrl = (data['serveur'] as Map)['ws'] as String;
        final apiUrl = (data['serveur'] as Map)['api'] as String;

        final config = di.getIt<AppConfig>();
        config.serverUrl = apiUrl;
        config.wsUrl = wsUrl;
        config.phoneToken = token;
        config.phoneName = code;
        await config.saveToPrefs();

        final ws = di.getIt<WebSocketService>();
        ws.connect();

        if (mounted) Navigator.pushReplacementNamed(context, '/permissions');
      } else {
        final body = jsonDecode(res.body);
        setState(() => _error = body['error'] ?? 'Erreur de configuration');
      }
    } on SocketException {
      setState(() => _error = 'Impossible de joindre le serveur');
    } catch (e) {
      setState(() => _error = 'Erreur: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _ipCtrl.dispose();
    _codeCtrl.dispose();
    _phoneCtrl.dispose();
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
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 40),
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppTheme.primaryGradient,
                    boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.4), blurRadius: 30, spreadRadius: 4)],
                  ),
                  child: Icon(PhosphorIcons.phoneCall(PhosphorIconsStyle.fill), color: Colors.white, size: 36),
                ),
                const SizedBox(height: 24),
                const Text('Configuration', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 8),
                Text('Entrez le code et le numero fournis par l\'administrateur',
                  style: TextStyle(fontSize: 14, color: AppTheme.textSecondary),
                  textAlign: TextAlign.center),
                const SizedBox(height: 40),
                _Input(label: 'Adresse du serveur (IP ou domaine)', ctrl: _ipCtrl, hint: 'sense-cookbook-quoted-wishing.trycloudflare.com'),
                const SizedBox(height: 16),
                _Input(label: 'Code identifiant', ctrl: _codeCtrl, hint: 'OMCI01'),
                const SizedBox(height: 16),
                _Input(label: 'Numero de telephone', ctrl: _phoneCtrl, hint: '0700000001', type: TextInputType.phone),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.error.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.error.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        Icon(PhosphorIcons.warning(PhosphorIconsStyle.fill), color: AppTheme.error, size: 18),
                        const SizedBox(width: 10),
                        Expanded(child: Text(_error!, style: TextStyle(color: AppTheme.error, fontSize: 13))),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity, height: 52,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _setup,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: _loading
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(PhosphorIcons.plugs(PhosphorIconsStyle.bold), size: 20),
                            const SizedBox(width: 10),
                            const Text('Connecter', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                          ],
                        ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Input extends StatelessWidget {
  final String label;
  final String hint;
  final TextEditingController ctrl;
  final TextInputType? type;
  const _Input({required this.label, required this.ctrl, this.hint = '', this.type});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.textSecondary)),
        const SizedBox(height: 8),
        TextField(
          controller: ctrl,
          keyboardType: type,
          style: const TextStyle(color: Colors.white, fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: AppTheme.textTertiary),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.05),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: AppTheme.border.withValues(alpha: 0.5)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: AppTheme.border.withValues(alpha: 0.5)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ],
    );
  }
}
