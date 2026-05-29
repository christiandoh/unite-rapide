package com.ussdautomator

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import androidx.core.app.NotificationCompat

class USSDService : AccessibilityService() {

    companion object {
        var callback: USSDCallback? = null

        @Volatile var wasServiceConnected = false
        @Volatile var lastDialogText = ""
        @Volatile private var inSession = false

        private var instance: USSDService? = null
        private val serviceReadyListeners: MutableList<() -> Unit> = mutableListOf()
        private const val CHANNEL_ID = "ussd_executor"
        private const val NOTIF_ID = 1001
        private val mainHandler = Handler(Looper.getMainLooper())

        private val sessionTimeoutRunnable = Runnable {
            if (inSession) {
                inSession = false
                lastDialogText = ""
                callback?.onUSSDError("Session expirée (timeout)")
            }
        }

        fun onServiceReady(listener: () -> Unit) {
            if (wasServiceConnected) listener()
            else serviceReadyListeners.add(listener)
        }

        fun dialUSSD(code: String) {
            try {
                val intent = Intent(Intent.ACTION_CALL).apply {
                    data = Uri.parse("tel:${Uri.encode(code)}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                instance?.startActivity(intent)
                scheduleSessionTimeout()
            } catch (e: SecurityException) {
                callback?.onUSSDError("Permission appel refusée: ${e.message}")
            } catch (e: Exception) {
                callback?.onUSSDError("Échec dial: ${e.message}")
            }
        }

        fun sendInput(input: String) {
            instance?.performInput(input)
        }

        fun getInstance() = instance

        fun resetSession() {
            inSession = false
            lastDialogText = ""
            cancelSessionTimeout()
        }

        private fun scheduleSessionTimeout() {
            mainHandler.removeCallbacks(sessionTimeoutRunnable)
            mainHandler.postDelayed(sessionTimeoutRunnable, 30_000L)
        }

        private fun cancelSessionTimeout() {
            mainHandler.removeCallbacks(sessionTimeoutRunnable)
        }
    }

    interface USSDCallback {
        fun onUSSDResponse(response: String)
        fun onUSSDError(error: String)
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        wasServiceConnected = true
        val info = serviceInfo
        info.flags = info.flags or AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        serviceInfo = info
        createChannel()
        startForeground(NOTIF_ID, buildNotif("Service actif"))
        serviceReadyListeners.forEach { it() }
        serviceReadyListeners.clear()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            event.eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) return
        if (!isPhonePkg(event.packageName?.toString() ?: "")) return

        val text = extractText(event)
        if (text.isBlank()) return
        if (text == lastDialogText) return

        lastDialogText = text
        inSession = true
        scheduleSessionTimeout()
        callback?.onUSSDResponse(text)
    }

    private fun isPhonePkg(pkg: String): Boolean {
        return pkg.contains("com.android.phone") ||
               pkg.contains("com.android.incallui") ||
               pkg.contains("com.android.dialer") ||
               pkg.contains("com.android.server.telecom") ||
               pkg.contains("com.samsung.android") ||
               pkg.contains("com.sec.android")
    }

    private fun extractText(event: AccessibilityEvent): String {
        val sb = StringBuilder()
        for (t in event.text) sb.append(t).append(' ')
        val sourceNode = event.source
        appendText(sourceNode, sb, 0)
        sourceNode?.recycle()
        return sb.toString().trim()
    }

    private fun appendText(node: AccessibilityNodeInfo?, sb: StringBuilder, depth: Int) {
        if (node == null || depth > 15) return
        if (node.text != null) sb.append(node.text).append(' ')
        for (i in 0 until node.childCount) {
            val child = try { node.getChild(i) } catch (_: Exception) { null } ?: continue
            appendText(child, sb, depth + 1)
            child.recycle()
        }
    }

    private fun performInput(input: String) {
        try {
            val root = rootInActiveWindow ?: run {
                callback?.onUSSDError("Fenêtre active non disponible")
                return
            }

            if (!isPhonePkg(root.packageName?.toString() ?: "")) {
                root.recycle()
                return
            }

            val clicked = clickOption(root, input)

            if (!clicked) {
                val editText = findEditText(root)
                if (editText != null) {
                    pasteToEditText(editText, input)
                    editText.recycle()
                } else {
                    root.recycle()
                    callback?.onUSSDError("Aucun champ de saisie trouvé")
                    return
                }
            }

            if (!clicked) {
                clickSend(root)
            }

            root.recycle()
        } catch (e: Exception) {
            callback?.onUSSDError("Erreur input: ${e.message}")
        }
    }

    private fun pasteToEditText(editText: AccessibilityNodeInfo, input: String) {
        val clipboard = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("ussd", input))
        editText.performAction(AccessibilityNodeInfo.ACTION_FOCUS)
        editText.performAction(AccessibilityNodeInfo.ACTION_PASTE)
    }

    private fun clickOption(root: AccessibilityNodeInfo, input: String): Boolean {
        val inputStr = input.replace(Regex("[^0-9]"), "")
        if (inputStr.isEmpty()) return false

        for (suffix in listOf(".", ")", ":", " ", "\n")) {
            val matches = root.findAccessibilityNodeInfosByText("$inputStr$suffix")
            for (node in matches) {
                val text = node.text?.toString()?.trim() ?: ""
                if (text.startsWith(inputStr) && node.isClickable &&
                    node.isVisibleToUser && node.isEnabled) {
                    node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    node.recycle()
                    return true
                }
                node.recycle()
            }
        }

        val exact = root.findAccessibilityNodeInfosByText(inputStr)
        for (node in exact) {
            val text = node.text?.toString()?.trim() ?: ""
            if (text == inputStr && node.isClickable &&
                node.isVisibleToUser && node.isEnabled) {
                node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                node.recycle()
                return true
            }
            node.recycle()
        }

        return false
    }

    private fun clickSend(root: AccessibilityNodeInfo) {
        val labels = listOf(
            "Envoyer", "Valider", "OK", "Confirmer", "Suivant",
            "Continuer", "Send", "Ok", "ok", "GO", "Appeler", "Oui"
        )
        for (text in labels) {
            for (node in root.findAccessibilityNodeInfosByText(text)) {
                if (node.isClickable && node.isEnabled) {
                    node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    node.recycle()
                    return
                }
                node.recycle()
            }
        }
    }

    private fun findEditText(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        val cn = node.className?.toString()?.lowercase() ?: ""
        if (cn.contains("edittext") && node.isVisibleToUser) return node
        for (i in 0 until node.childCount) {
            val child = try { node.getChild(i) } catch (_: Exception) { null } ?: continue
            val found = findEditText(child)
            if (found != null) {
                child.recycle()
                return found
            }
            child.recycle()
        }
        return null
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(
                CHANNEL_ID, "USSD Executor", NotificationManager.IMPORTANCE_LOW
            )
            ch.setSound(null, null)
            ch.enableVibration(false)
            getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
        }
    }

    private fun buildNotif(content: String): android.app.Notification {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pi = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("USSD Executor")
            .setContentText(content)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pi)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setSilent(true)
            .build()
    }

    fun updateNotification(text: String) {
        try {
            getSystemService(NotificationManager::class.java).notify(NOTIF_ID, buildNotif(text))
        } catch (_: Exception) {}
    }

    override fun onInterrupt() {
        inSession = false
        cancelSessionTimeout()
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        callback = null
        inSession = false
        cancelSessionTimeout()
    }
}
