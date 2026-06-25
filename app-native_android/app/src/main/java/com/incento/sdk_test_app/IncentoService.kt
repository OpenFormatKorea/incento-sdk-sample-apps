// IncentoService.kt
// 이 파일을 프로젝트에 추가하고 사용하세요. 외부 의존성 없음.
// 요구사항: Android API 28+, Kotlin 1.7+

package com.incento.sdk_test_app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.graphics.Outline
import android.view.Gravity
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ImageView
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.URL
import javax.net.ssl.HttpsURLConnection

object IncentoService {
    private const val BASE_API_URL = "https://api.incento.kr/api/open"
    private const val WIDGET_BASE_URL = "https://widget.incento.kr/v2"
    private const val PREFS_NAME = "incento_prefs"
    private const val PREFS_AUTH_KEY = "incento_customer_auth"

    private var apiKey = ""
    private var userId: String? = null
    private var userCreatedAt: String? = null
    private var launcherVisible = true
    private var debugMode = false
    private var widgetUrl = ""
    private var pendingOpen = false
    private var currentPath = "/"
    private var sessionPath: String? = null

    private var webView: WebView? = null
    private var containerView: FrameLayout? = null
    private var backdropView: View? = null
    private var launcherView: FrameLayout? = null
    private var drawerHeight: Int = 0
    private lateinit var prefs: SharedPreferences

    private val eventHandlers = mutableMapOf<String, MutableList<() -> Unit>>()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private fun log(message: String) {
        if (debugMode) android.util.Log.d("Incento", message)
    }

    // MARK: - Public API

    /**
     * 위젯을 초기화하고 런처를 띄운다. 앱 시작 시 1회 호출한다.
     * @param pagePath 초기 화면 경로. 미지정 시 "/". 이후 전환분은 setPath(...)로 갱신.
     */
    fun boot(
        activity: Activity,
        apiKey: String,
        userId: String? = null,
        userCreatedAt: String? = null,
        pagePath: String? = null,
        visible: Boolean = true,
        autoOpen: Boolean = false,
        debug: Boolean = false,
    ) {
        this.apiKey = apiKey
        this.userId = userId
        this.userCreatedAt = userCreatedAt
        if (pagePath != null) this.currentPath = pagePath
        this.launcherVisible = visible
        this.pendingOpen = autoOpen
        this.debugMode = debug
        this.prefs = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        scope.launch {
            log("boot — apiKey: $apiKey, userId: $userId, userCreatedAt: $userCreatedAt, visible: $visible, autoOpen: $autoOpen, debug: $debug")
            val token = handleAuth()
            log("auth — token: ${if (token != null) "ok" else "none"}")
            val campaignId = fetchCampaignId() ?: run {
                log("boot — no valid campaign, aborting")
                return@launch
            }
            log("boot — campaignId: $campaignId")

            val launcherConfigDeferred = async { fetchLauncherConfig(campaignId) }

            val params = "hostingType=sdk" +
                "&apiKey=$apiKey" +
                "&campaignId=$campaignId" +
                "&pagePath=${java.net.URLEncoder.encode(currentPath, "UTF-8")}" +
                "&isLoggedIn=${token != null}"
            widgetUrl = "$WIDGET_BASE_URL?$params"
            sessionPath = currentPath
            log("[TEST] 위젯 로드 path=$currentPath (세션은 오픈 시 생성됨)")

            val launcherConfig = launcherConfigDeferred.await()
            mainHandler.post { mountWidget(activity, launcherConfig) }
        }
    }

    /** 런처를 표시한다. */
    fun show() = mainHandler.post {
        launcherView?.visibility = android.view.View.VISIBLE
        launcherVisible = true
    }

    /** 런처를 숨긴다. 열려 있던 드로어가 있으면 닫는다. */
    fun hide() = mainHandler.post {
        launcherView?.visibility = android.view.View.GONE
        launcherVisible = false
        closeWidget()
    }

    /**
     * 화면 전환 시 현재 경로를 갱신한다(예: onResume). 정규화된 경로를 넘긴다.
     * 열려 있던 드로어가 있으면 닫는다.
     *
     * 경로별 리퍼럴 시도 추적이 이 호출에 의존한다. 화면 전환 시점에 올바른
     * 경로로 호출하지 않으면 해당 화면의 리퍼럴 시도가 집계되지 않는다.
     */
    fun setPath(path: String) {
        if (path != currentPath && backdropView?.visibility == View.VISIBLE) {
            closeWidget()
        }
        log("[TEST] setPath $currentPath → $path")
        currentPath = path
    }

    /** 위젯과 런처를 화면에서 제거한다. */
    fun shutdown() = mainHandler.post {
        (containerView?.parent as? ViewGroup)?.removeView(containerView)
        (backdropView?.parent as? ViewGroup)?.removeView(backdropView)
        (launcherView?.parent as? ViewGroup)?.removeView(launcherView)
        containerView = null
        backdropView = null
        launcherView = null
        webView = null
    }

    /** 위젯 드로어를 프로그래밍 방식으로 연다. */
    fun open() = mainHandler.post {
        if (containerView == null) return@post
        log("widgetOpen (programmatic)")
        openWidget("E")
    }

    /** 위젯 드로어를 프로그래밍 방식으로 닫는다. 열려 있지 않으면 아무 동작도 하지 않는다. */
    fun close() = mainHandler.post {
        if (containerView == null) return@post
        log("widgetClose (programmatic)")
        closeWidget()
    }

    /** 위젯 이벤트 핸들러를 등록한다. (eventName: "widgetOpen" / "widgetClose" / "loginRequired") */
    fun on(eventName: String, handler: () -> Unit) {
        eventHandlers.getOrPut(eventName) { mutableListOf() }.add(handler)
    }

    // MARK: - Auth

    private fun handleAuth(): String? {
        val uid = userId ?: run {
            prefs.edit().remove(PREFS_AUTH_KEY).apply()
            return null
        }

        prefs.getString(PREFS_AUTH_KEY, null)?.let { cached ->
            runCatching {
                val json = JSONObject(cached)
                val access = json.getString("access")
                val cachedUid = json.getString("_userId")
                if (cachedUid == uid && !willTokenExpire(access)) return access
            }
        }

        val res = requestLoginOrRegister(uid) ?: return null
        val json = JSONObject()
            .put("access", res.first)
            .put("refresh", res.second)
            .put("_userId", uid)
        prefs.edit().putString(PREFS_AUTH_KEY, json.toString()).apply()
        return res.first
    }

    private fun willTokenExpire(token: String, minutes: Int = 10): Boolean {
        return runCatching {
            val payload = token.split(".")[1]
            val decoded = Base64.decode(payload, Base64.URL_SAFE or Base64.NO_PADDING)
            val exp = JSONObject(String(decoded)).getLong("exp")
            exp * 1000L <= System.currentTimeMillis() + minutes * 60 * 1000L
        }.getOrDefault(true)
    }

    // MARK: - API

    private fun requestLoginOrRegister(userId: String): Pair<String, String>? {
        return runCatching {
            val conn = openPost("$BASE_API_URL/sdk/auth/login-or-register/")
            val body = JSONObject().apply {
                put("user_id", userId)
                userCreatedAt?.let { put("user_created_at", it) }
            }
            conn.outputStream.write(body.toString().toByteArray())
            val data = JSONObject(conn.inputStream.bufferedReader().readText()).getJSONObject("data")
            data.getString("access") to data.getString("refresh")
        }.getOrNull()
    }

    private fun fetchCampaignId(): String? {
        return runCatching {
            val conn = openPost("$BASE_API_URL/sdk/campaign/valid/")
            val body = JSONObject().apply {
                put("request_url_path", "app://")
                if (userId != null) put("customer", JSONObject().put("user_id", userId))
                else put("customer", JSONObject.NULL)
            }
            conn.outputStream.write(body.toString().toByteArray())
            val data = JSONObject(conn.inputStream.bufferedReader().readText()).getJSONObject("data")
            data.optString("campaign_id").takeIf { it.isNotEmpty() }
        }.getOrNull()
    }

    private data class LauncherConfig(
        val image: Bitmap?,
        val widthDp: Float,
        val heightDp: Float,
        val rightDp: Float,
        val bottomDp: Float,
        val cornerRadiusDp: Float,
    )

    private fun fetchLauncherConfig(campaignId: String): LauncherConfig {
        val fallback = LauncherConfig(image = null, widthDp = 56f, heightDp = 56f, rightDp = 16f, bottomDp = 80f, cornerRadiusDp = 0f)
        return runCatching {
            val conn = (URL("$BASE_API_URL/sdk/widget/button-visuals/$campaignId/").openConnection() as HttpsURLConnection).apply {
                setRequestProperty("X-Incento-Key", apiKey)
            }
            val json = JSONObject(conn.inputStream.bufferedReader().readText()).getJSONObject("data")
            val css = json.optString("MOBILE").takeIf { it.isNotEmpty() } ?: return fallback

            var widthDp = 56f
            var heightDp = 56f
            var rightDp = 16f
            var bottomDp = 80f
            var cornerRadiusDp = 0f

            parseCssPixelValue(css, "width")?.let { widthDp = it }
            parseCssPixelValue(css, "height")?.let { heightDp = it }
            parseCssPixelValue(css, "right")?.let { rightDp = it }
            parseCssPixelValue(css, "bottom")?.let { bottomDp = it }
            parseCssPixelValue(css, "border-radius")?.let { cornerRadiusDp = it }

            val image = extractBackgroundImageUrl(css)?.let { imageUrl ->
                val imgConn = URL(imageUrl).openConnection() as HttpsURLConnection
                BitmapFactory.decodeStream(imgConn.inputStream)
            }

            LauncherConfig(image, widthDp, heightDp, rightDp, bottomDp, cornerRadiusDp)
        }.getOrDefault(fallback)
    }

    private fun parseCssPixelValue(css: String, property: String): Float? {
        val match = Regex("""${Regex.escape(property)}:\s*([\d.]+)px""").find(css) ?: return null
        return match.groupValues[1].toFloatOrNull()
    }

    private fun extractBackgroundImageUrl(css: String): String? {
        val match = Regex("""background-image:\s*url\(([^)]+)\)""").find(css) ?: return null
        return match.groupValues[1].trim()
    }

    private fun openPost(urlStr: String): HttpsURLConnection {
        return (URL(urlStr).openConnection() as HttpsURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("X-Incento-Key", apiKey)
            doOutput = true
        }
    }

    // MARK: - UI

    @SuppressLint("SetJavaScriptEnabled", "ClickableViewAccessibility")
    private fun mountWidget(activity: Activity, launcherConfig: LauncherConfig) {
        val root = activity.window.decorView.findViewById<FrameLayout>(android.R.id.content)
        val dm = activity.resources.displayMetrics
        val dp = dm.density
        drawerHeight = (dm.heightPixels * 0.85f).toInt()

        // WebView 설정
        val wv = WebView(activity).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webChromeClient = WebChromeClient()
            addJavascriptInterface(JsBridge(activity), "IncentoNativeBridge")
            webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                    view?.evaluateJavascript("""
                        window.parent = {
                            postMessage: function(data, origin) {
                                IncentoNativeBridge.postMessage(JSON.stringify(data));
                            }
                        };
                    """.trimIndent(), null)
                }
            }
            loadUrl(widgetUrl)
        }
        webView = wv

        // 배경 딤 레이어
        val backdrop = View(activity).apply {
            setBackgroundColor(android.graphics.Color.BLACK)
            alpha = 0f
            visibility = View.GONE
            setOnClickListener { closeWidget() }
        }
        root.addView(backdrop, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
        ))
        backdropView = backdrop

        // 드로어 컨테이너 (화면 아래에서 시작, 상단 모서리 라운드)
        val container = FrameLayout(activity).apply {
            setBackgroundColor(android.graphics.Color.WHITE)
            translationY = drawerHeight.toFloat()
            clipToOutline = true
            outlineProvider = object : ViewOutlineProvider() {
                override fun getOutline(view: View, outline: Outline) {
                    val r = 20 * dp
                    outline.setRoundRect(0, 0, view.width, view.height + r.toInt(), r)
                }
            }
        }
        root.addView(container, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            drawerHeight,
        ).apply { gravity = Gravity.BOTTOM })
        containerView = container

        // 드래그 핸들
        val handle = View(activity).apply {
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(0xFFDDDDDD.toInt())
                cornerRadius = 2.5f * dp
            }
        }
        container.addView(handle, FrameLayout.LayoutParams(
            (36 * dp).toInt(), (5 * dp).toInt(),
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            topMargin = (10 * dp).toInt()
        })

        // 웹뷰
        container.addView(wv, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
        ).apply { topMargin = (28 * dp).toInt() })

        // 드래그로 닫기
        var velocityTracker: VelocityTracker? = null
        var touchStartY = 0f
        container.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    touchStartY = event.rawY
                    velocityTracker?.recycle()
                    velocityTracker = VelocityTracker.obtain()
                    velocityTracker?.addMovement(event)
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    velocityTracker?.addMovement(event)
                    val dy = (event.rawY - touchStartY).coerceAtLeast(0f)
                    container.translationY = dy
                    backdrop.alpha = 0.4f * (1f - (dy / drawerHeight).coerceIn(0f, 1f))
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    velocityTracker?.computeCurrentVelocity(1000)
                    val vy = velocityTracker?.yVelocity ?: 0f
                    velocityTracker?.recycle()
                    velocityTracker = null
                    val dy = event.rawY - touchStartY
                    if (dy > drawerHeight * 0.3f || vy > 800 * dp) {
                        closeWidget()
                    } else {
                        ObjectAnimator.ofFloat(container, "translationY", container.translationY, 0f).apply {
                            duration = 300
                            interpolator = DecelerateInterpolator()
                            start()
                        }
                        ObjectAnimator.ofFloat(backdrop, "alpha", backdrop.alpha, 0.4f).apply {
                            duration = 300
                            start()
                        }
                    }
                    true
                }
                else -> false
            }
        }

        // 런처
        val btnWidth = (launcherConfig.widthDp * dp).toInt()
        val btnHeight = (launcherConfig.heightDp * dp).toInt()
        val rightMargin = (launcherConfig.rightDp * dp).toInt()
        val baseBottomMargin = (launcherConfig.bottomDp * dp).toInt()
        val launcher = FrameLayout(activity).apply {
            if (launcherConfig.image == null) setBackgroundColor(0xFF2563EB.toInt())
            if (launcherConfig.cornerRadiusDp > 0) {
                clipToOutline = true
                outlineProvider = object : ViewOutlineProvider() {
                    override fun getOutline(view: View, outline: Outline) {
                        outline.setRoundRect(0, 0, view.width, view.height, launcherConfig.cornerRadiusDp * dp)
                    }
                }
            }
            visibility = if (launcherVisible) View.VISIBLE else View.GONE
            isClickable = true
            isFocusable = true
            setOnClickListener { openWidget("C") }
        }
        if (launcherConfig.image != null) {
            launcher.addView(ImageView(activity).apply {
                setImageBitmap(launcherConfig.image)
                scaleType = ImageView.ScaleType.FIT_CENTER
            }, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            ))
        }
        val launcherParams = FrameLayout.LayoutParams(btnWidth, btnHeight).apply {
            gravity = Gravity.BOTTOM or Gravity.END
            setMargins(0, 0, rightMargin, baseBottomMargin)
        }
        root.addView(launcher, launcherParams)
        launcherView = launcher

        ViewCompat.setOnApplyWindowInsetsListener(launcher) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            (view.layoutParams as FrameLayout.LayoutParams).bottomMargin = baseBottomMargin + systemBars.bottom
            view.requestLayout()
            insets
        }

        if (pendingOpen) {
            pendingOpen = false
            openWidget("E")
        }
    }

    private fun openWidget(eventType: String) {
        log("widgetOpen")
        if (sessionPath != null && currentPath != sessionPath) {
            log("[TEST] 새 세션 트리거 path=$currentPath type=$eventType")
            sendToWidget(
                JSONObject()
                    .put("type", "incentoPathChange")
                    .put("path", currentPath)
                    .put("eventType", eventType),
            )
            sessionPath = currentPath
        } else {
            log("[TEST] 경로변경 없음·세션 유지 path=$currentPath type=$eventType")
        }
        backdropView?.visibility = View.VISIBLE
        val interp = DecelerateInterpolator(2f)
        AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(containerView, "translationY", drawerHeight.toFloat(), 0f).also { it.interpolator = interp },
                ObjectAnimator.ofFloat(backdropView, "alpha", 0f, 0.4f).also { it.interpolator = interp },
            )
            duration = 380
            start()
        }
        launcherView?.visibility = View.GONE
        emit("widgetOpen")
    }

    private fun closeWidget() {
        log("widgetClose")
        val interp = AccelerateInterpolator(2f)
        val set = AnimatorSet().apply {
            playTogether(
                ObjectAnimator.ofFloat(containerView, "translationY", containerView?.translationY ?: 0f, drawerHeight.toFloat()).also { it.interpolator = interp },
                ObjectAnimator.ofFloat(backdropView, "alpha", backdropView?.alpha ?: 0.4f, 0f).also { it.interpolator = interp },
            )
            duration = 320
        }
        set.addListener(object : AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: android.animation.Animator) {
                backdropView?.visibility = View.GONE
            }
        })
        set.start()
        if (launcherVisible) launcherView?.visibility = View.VISIBLE
        log("[TEST] close 전송 → 세션 종료 PATCH path=$currentPath")
        webView?.evaluateJavascript("window.postMessage({ type: 'close', message: '' }, '*')", null)
        emit("widgetClose")
    }

    private fun emit(eventName: String) {
        mainHandler.post { eventHandlers[eventName]?.forEach { it() } }
    }

    private fun sendToWidget(data: JSONObject) {
        mainHandler.post {
            webView?.evaluateJavascript("window.postMessage($data, '*')", null)
        }
    }

    // MARK: - JS Bridge

    private class JsBridge(private val context: Context) {
        @JavascriptInterface
        fun postMessage(jsonStr: String) {
            val body = runCatching { JSONObject(jsonStr) }.getOrNull() ?: return

            when (body.optString("type")) {
                "getCookie" -> when (body.optString("key")) {
                    "incentoCustomerAuth" -> {
                        val cached = prefs.getString(PREFS_AUTH_KEY, "") ?: ""
                        sendToWidget(JSONObject().put("type", "authTokens").put("message", cached))
                    }
                    "incentoCustomerInfo" -> {
                        val info = userId?.let {
                            JSONObject().put("member_id", it).toString()
                        } ?: ""
                        sendToWidget(JSONObject().put("type", "customerInfo").put("message", info))
                    }
                }

                "getLocalStorage" -> {
                    val key = body.optString("args")
                    val value = prefs.getString("incento_ls_$key", "") ?: ""
                    sendToWidget(JSONObject().put("type", key).put("message", value))
                }

                "setLocalStorage" -> {
                    val args = body.optJSONArray("args") ?: return
                    if (args.length() == 2) {
                        prefs.edit()
                            .putString("incento_ls_${args.getString(0)}", args.getString(1))
                            .apply()
                    }
                }

                "removeLocalStorage" -> {
                    prefs.edit().remove("incento_ls_${body.optString("args")}").apply()
                }

                "copyLink" -> {
                    val link = body.optString("referralLink")
                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    clipboard.setPrimaryClip(ClipData.newPlainText("incento", link))
                }

                "widgetOpen" -> emit("widgetOpen")
                "widgetClose" -> mainHandler.post { closeWidget() }
                "requestLogin" -> emit("loginRequired")
            }
        }
    }
}
