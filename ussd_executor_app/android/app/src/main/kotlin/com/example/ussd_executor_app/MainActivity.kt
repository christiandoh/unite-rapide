package com.example.ussd_executor_app

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.BatteryManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import android.accessibilityservice.AccessibilityServiceInfo
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import com.ussdautomator.USSDService

class MainActivity : FlutterActivity() {
    private val USSD = "com.app/ussd"
    private val PHONE = "com.app/phone_state"
    private val PERMS = "com.app/permissions"
    private val REQ_CALL = 1001
    private val REQ_NOTIF = 1002
    private var callResult: MethodChannel.Result? = null
    private var notifResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(engine: FlutterEngine) {
        super.configureFlutterEngine(engine)

        MethodChannel(engine.dartExecutor.binaryMessenger, PERMS).setMethodCallHandler { call, result ->
            when (call.method) {
                "checkCallPhone" -> result.success(checkPerm(Manifest.permission.CALL_PHONE))
                "requestCallPhone" -> { callResult = result; requestPerm(arrayOf(Manifest.permission.CALL_PHONE), REQ_CALL) }
                "checkNotification" -> result.success(if (api33()) checkPerm(Manifest.permission.POST_NOTIFICATIONS) else true)
                "requestNotification" -> { if (api33()) { notifResult = result; requestPerm(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQ_NOTIF) } else result.success(true) }
                else -> result.notImplemented()
            }
        }

        MethodChannel(engine.dartExecutor.binaryMessenger, USSD).setMethodCallHandler { call, result ->
            when (call.method) {
                "isAccessibilityEnabled" -> {
                    val am = getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
                    val inEnabledList = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
                        .any { it.resolveInfo.serviceInfo.packageName == packageName }
                    result.success(inEnabledList || USSDService.wasServiceConnected)
                }
                "waitForAccessibility" -> {
                    if (USSDService.wasServiceConnected) {
                        result.success(true)
                    } else {
                        USSDService.onServiceReady {
                            runOnUiThread { result.success(true) }
                        }
                    }
                }
                "openAccessibilitySettings" -> { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)); result.success(true) }
                "executeUSSD" -> {
                    val code = call.argument<String>("code") ?: ""
                    val seq = call.argument<List<String>>("sequence") ?: emptyList()
                    val timeout = call.argument<Int>("timeout") ?: 30
                    val mainHandler = Handler(Looper.getMainLooper())
                    var resolved = false

                    // Acquire wake lock to prevent screen-off during USSD
                    val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
                    val wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP, "ussd:wakelock")
                    wakeLock.acquire(timeout * 1000L + 10000L)

                    USSDService.callback = object : USSDService.USSDCallback {
                        private var idx = 0
                        private var responseCount = 0

                        private val timer = Runnable {
                            if (!resolved) {
                                resolved = true
                                if (wakeLock.isHeld) wakeLock.release()
                                USSDService.resetSession()
                                USSDService.callback = null
                                updateNotif("Timeout")
                                result.error("TIMEOUT", "Délai dépassé ($timeout s)", null)
                            }
                        }

                        init {
                            mainHandler.postDelayed(timer, timeout * 1000L)
                        }

                        override fun onUSSDResponse(text: String) {
                            if (resolved) return
                            responseCount++
                            if (responseCount > 1 && text == USSDService.lastDialogText) return
                            mainHandler.removeCallbacks(timer)

                            if (idx < seq.size) {
                                val input = seq[idx]; idx++
                                updateNotif("Étape $idx/${seq.size}: $input")
                                mainHandler.postDelayed({
                                    USSDService.sendInput(input)
                                }, 500)
                                mainHandler.postDelayed(timer, timeout * 1000L)
                            } else {
                                resolved = true
                                if (wakeLock.isHeld) wakeLock.release()
                                USSDService.resetSession()
                                USSDService.callback = null
                                updateNotif("Réussi")
                                result.success(mapOf("success" to true, "message" to text, "progress" to 1.0))
                            }
                        }

                        override fun onUSSDError(err: String) {
                            if (resolved) return
                            resolved = true
                            if (wakeLock.isHeld) wakeLock.release()
                            USSDService.resetSession()
                            USSDService.callback = null
                            updateNotif("Erreur: $err")
                            result.error("USSD_ERROR", err, null)
                        }
                    }
                    USSDService.dialUSSD(code)
                }
                else -> result.notImplemented()
            }
        }

        MethodChannel(engine.dartExecutor.binaryMessenger, PHONE).setMethodCallHandler { call, result ->
            if (call.method == "getBatteryStatus") {
                val bm = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                val level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                val charging = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_STATUS)
                    .let { it == BatteryManager.BATTERY_STATUS_CHARGING || it == BatteryManager.BATTERY_STATUS_FULL }
                result.success(mapOf("level" to level, "charging" to charging))
            } else result.notImplemented()
        }
    }

    private fun checkPerm(p: String) = ContextCompat.checkSelfPermission(this, p) == PackageManager.PERMISSION_GRANTED
    private fun requestPerm(p: Array<String>, code: Int) { if (Build.VERSION.SDK_INT >= 23) requestPermissions(p, code) }
    private fun api33() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
    private fun updateNotif(msg: String) { USSDService.getInstance()?.updateNotification(msg) }

    override fun onRequestPermissionsResult(code: Int, perms: Array<out String>, results: IntArray) {
        super.onRequestPermissionsResult(code, perms, results)
        val ok = results.isNotEmpty() && results[0] == PackageManager.PERMISSION_GRANTED
        when (code) { REQ_CALL -> { callResult?.success(ok); callResult = null }
            REQ_NOTIF -> { notifResult?.success(ok); notifResult = null } }
    }
}
