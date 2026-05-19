// IncentoService.swift
// 이 파일을 프로젝트에 추가하고 사용하세요. 외부 의존성 없음.
// 요구사항: iOS 15+, Swift 5.7+

import UIKit
import WebKit

public final class IncentoService: NSObject {
    public static let shared = IncentoService()

    private let baseApiUrl = "https://api.incento.kr/api/open"
    private let widgetBaseUrl = "https://widget.incento.kr/v2"
    private let prefsKey = "incento_customer_auth"

    private var apiKey = ""
    private var userId: String?
    private var launcherVisible = true
    private var debugMode = false
    private var widgetUrl = ""
    private var pendingOpen = false

    private var webView: WKWebView?
    private var containerView: UIView?
    private var backdropView: UIView?
    private var launcherButton: UIButton?
    private var eventHandlers: [String: [() -> Void]] = [:]
    private var windowRef: UIWindow?
    private var drawerHeight: CGFloat = 0

    private override init() {}

    private func log(_ message: String) {
        if debugMode { print("[Incento] \(message)") }
    }

    // MARK: - Public API

    public func boot(
        apiKey: String,
        userId: String? = nil,
        visible: Bool = true,
        autoOpen: Bool = false,
        debug: Bool = false
    ) {
        self.apiKey = apiKey
        self.userId = userId
        self.launcherVisible = visible
        self.debugMode = debug
        self.pendingOpen = autoOpen

        Task { await performBoot() }
    }

    public func show() {
        DispatchQueue.main.async {
            self.launcherButton?.isHidden = false
            self.launcherVisible = true
        }
    }

    public func hide() {
        DispatchQueue.main.async {
            self.launcherButton?.isHidden = true
            self.launcherVisible = false
            self.closeWidget()
        }
    }

    public func shutdown() {
        DispatchQueue.main.async {
            self.containerView?.removeFromSuperview()
            self.launcherButton?.removeFromSuperview()
            self.backdropView?.removeFromSuperview()
            self.containerView = nil
            self.launcherButton = nil
            self.webView = nil
            self.backdropView = nil
        }
    }

    public func open() {
        DispatchQueue.main.async {
            guard self.containerView != nil else { return }
            self.log("widgetOpen (programmatic)")
            self.openDrawer()
        }
    }

    public func on(_ eventName: String, handler: @escaping () -> Void) {
        eventHandlers[eventName, default: []].append(handler)
    }

    // MARK: - Boot

    private func performBoot() async {
        log("boot — apiKey: \(apiKey), userId: \(userId ?? "nil"), visible: \(launcherVisible), autoOpen: \(pendingOpen), debug: \(debugMode)")
        let token = await handleAuth()
        log("auth — token: \(token != nil ? "ok" : "none")")

        guard let campaignId = await fetchCampaignId() else {
            log("boot — no valid campaign, aborting")
            return
        }
        log("boot — campaignId: \(campaignId)")

        async let launcherImage = fetchLauncherImage(campaignId: campaignId)

        var components = URLComponents(string: widgetBaseUrl)!
        components.queryItems = [
            URLQueryItem(name: "hostingType", value: "sdk"),
            URLQueryItem(name: "apiKey", value: apiKey),
            URLQueryItem(name: "campaignId", value: campaignId),
            URLQueryItem(name: "pagePath", value: "/"),
            URLQueryItem(name: "isLoggedIn", value: token != nil ? "true" : "false"),
        ]
        widgetUrl = components.url?.absoluteString ?? ""

        let image = await launcherImage
        await MainActor.run { mountWidget(launcherImage: image) }
    }

    // MARK: - Auth

    private func handleAuth() async -> String? {
        guard let userId else {
            UserDefaults.standard.removeObject(forKey: prefsKey)
            return nil
        }

        if let cached = UserDefaults.standard.string(forKey: prefsKey),
           let data = cached.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: String],
           let access = json["access"],
           let cachedUserId = json["_userId"],
           cachedUserId == userId,
           !willTokenExpire(access) {
            return access
        }

        guard let res = await requestLoginOrRegister(userId: userId) else { return nil }

        let dict: [String: String] = ["access": res.access, "refresh": res.refresh, "_userId": userId]
        if let data = try? JSONSerialization.data(withJSONObject: dict),
           let str = String(data: data, encoding: .utf8) {
            UserDefaults.standard.set(str, forKey: prefsKey)
        }
        return res.access
    }

    private func willTokenExpire(_ token: String, minutes: Int = 10) -> Bool {
        let parts = token.split(separator: ".")
        guard parts.count == 3 else { return true }
        var base64 = String(parts[1])
        let pad = base64.count % 4
        if pad != 0 { base64 += String(repeating: "=", count: 4 - pad) }
        guard let data = Data(base64Encoded: base64),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let exp = json["exp"] as? TimeInterval else { return true }
        return exp * 1000 <= Date().timeIntervalSince1970 * 1000 + Double(minutes * 60 * 1000)
    }

    // MARK: - API

    private struct AuthResponse: Decodable {
        let access: String
        let refresh: String
    }

    private struct CampaignResponse: Decodable {
        let campaign_id: String?
    }

    private struct ButtonVisualsResponse: Decodable {
        let MOBILE: String?
        let PC: String?
    }

    private struct Envelope<T: Decodable>: Decodable {
        let data: T
    }

    private func requestLoginOrRegister(userId: String) async -> AuthResponse? {
        guard let url = URL(string: "\(baseApiUrl)/sdk/auth/login-or-register/") else { return nil }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(apiKey, forHTTPHeaderField: "X-Incento-Key")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["user_id": userId])
        guard let (data, _) = try? await URLSession.shared.data(for: req) else { return nil }
        return try? JSONDecoder().decode(Envelope<AuthResponse>.self, from: data).data
    }

    private func fetchCampaignId() async -> String? {
        guard let url = URL(string: "\(baseApiUrl)/sdk/campaign/valid/") else { return nil }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(apiKey, forHTTPHeaderField: "X-Incento-Key")

        var body: [String: Any] = ["request_url_path": "app://"]
        body["customer"] = userId.map { ["user_id": $0] } ?? NSNull()
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)

        guard let (data, _) = try? await URLSession.shared.data(for: req) else { return nil }
        let res = try? JSONDecoder().decode(Envelope<CampaignResponse>.self, from: data)
        return res?.data.campaign_id
    }

    private func fetchLauncherImage(campaignId: String) async -> UIImage? {
        guard let url = URL(string: "\(baseApiUrl)/sdk/widget/button-visuals/\(campaignId)/") else { return nil }
        var req = URLRequest(url: url)
        req.setValue(apiKey, forHTTPHeaderField: "X-Incento-Key")
        guard let (data, _) = try? await URLSession.shared.data(for: req),
              let res = try? JSONDecoder().decode(Envelope<ButtonVisualsResponse>.self, from: data),
              let css = res.data.MOBILE,
              let imageUrl = extractBackgroundImageUrl(from: css),
              let (imageData, _) = try? await URLSession.shared.data(from: imageUrl) else { return nil }
        return UIImage(data: imageData)
    }

    private func extractBackgroundImageUrl(from css: String) -> URL? {
        // CSS 예: "... background-image: url(https://...); ..."
        guard let regex = try? NSRegularExpression(pattern: #"background-image:\s*url\(([^)]+)\)"#),
              let match = regex.firstMatch(in: css, range: NSRange(css.startIndex..., in: css)),
              let range = Range(match.range(at: 1), in: css) else { return nil }
        return URL(string: String(css[range]).trimmingCharacters(in: .whitespaces))
    }

    // MARK: - UI

    private func mountWidget(launcherImage: UIImage? = nil) {
        guard let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first?.windows.first(where: { $0.isKeyWindow }) else { return }

        let config = WKWebViewConfiguration()
        // window.parent.postMessage를 네이티브 브릿지로 연결
        let bridge = """
            window.parent = {
                postMessage: function(data, origin) {
                    window.webkit.messageHandlers.incentoBridge.postMessage(data);
                }
            };
        """
        config.userContentController.addUserScript(
            WKUserScript(source: bridge, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        )
        // retain cycle 방지를 위해 weak wrapper 사용
        config.userContentController.add(WeakMessageHandler(self), name: "incentoBridge")
        config.allowsInlineMediaPlayback = true

        let wv = WKWebView(frame: .zero, configuration: config)
        wv.scrollView.isScrollEnabled = false
        if let url = URL(string: widgetUrl) { wv.load(URLRequest(url: url)) }
        webView = wv

        windowRef = window
        drawerHeight = window.bounds.height * 0.85

        // 배경 딤 레이어
        let backdrop = UIView(frame: window.bounds)
        backdrop.backgroundColor = UIColor.black.withAlphaComponent(0)
        backdrop.isHidden = true
        backdrop.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(backdropTapped)))
        window.addSubview(backdrop)
        backdropView = backdrop

        // 드로어 컨테이너 (화면 아래에서 시작)
        let container = UIView(frame: CGRect(x: 0, y: window.bounds.height, width: window.bounds.width, height: drawerHeight))
        container.backgroundColor = .white
        container.layer.cornerRadius = 20
        container.layer.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
        container.clipsToBounds = true
        window.addSubview(container)
        containerView = container

        // 드래그 핸들
        let handle = UIView()
        handle.backgroundColor = UIColor.systemGray4
        handle.layer.cornerRadius = 2.5
        handle.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(handle)
        NSLayoutConstraint.activate([
            handle.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            handle.topAnchor.constraint(equalTo: container.topAnchor, constant: 10),
            handle.widthAnchor.constraint(equalToConstant: 36),
            handle.heightAnchor.constraint(equalToConstant: 5),
        ])

        // 웹뷰
        wv.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(wv)
        NSLayoutConstraint.activate([
            wv.topAnchor.constraint(equalTo: container.topAnchor, constant: 28),
            wv.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            wv.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            wv.trailingAnchor.constraint(equalTo: container.trailingAnchor),
        ])

        // 드래그로 닫기
        container.addGestureRecognizer(UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:))))

        // 런처 버튼
        let btn = UIButton(type: .custom)
        if let launcherImage {
            btn.setImage(launcherImage, for: .normal)
            btn.imageView?.contentMode = .scaleAspectFit
        } else {
            btn.backgroundColor = UIColor(red: 0.15, green: 0.39, blue: 0.92, alpha: 1)
        }
        btn.layer.cornerRadius = 28
        btn.clipsToBounds = true
        btn.frame = CGRect(x: window.bounds.width - 76, y: window.bounds.height - 120, width: 56, height: 56)
        btn.isHidden = !launcherVisible
        btn.addTarget(self, action: #selector(launcherTapped), for: .touchUpInside)
        window.addSubview(btn)
        launcherButton = btn

        if pendingOpen {
            pendingOpen = false
            openDrawer()
        }
    }

    private func openDrawer() {
        guard let container = containerView, let window = windowRef else { return }
        backdropView?.isHidden = false
        UIView.animate(withDuration: 0.4, delay: 0, usingSpringWithDamping: 0.85, initialSpringVelocity: 0.3) {
            container.frame.origin.y = window.bounds.height - self.drawerHeight
            self.backdropView?.backgroundColor = UIColor.black.withAlphaComponent(0.4)
        }
        launcherButton?.isHidden = true
        emit("widgetOpen")
    }

    @objc private func backdropTapped() {
        closeWidget()
    }

    @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
        guard let container = containerView, let window = windowRef else { return }
        let translation = gesture.translation(in: window)
        switch gesture.state {
        case .changed:
            if translation.y > 0 {
                container.frame.origin.y = window.bounds.height - drawerHeight + translation.y
                let progress = min(translation.y / drawerHeight, 1)
                backdropView?.backgroundColor = UIColor.black.withAlphaComponent(0.4 * (1 - progress))
            }
        case .ended:
            if translation.y > drawerHeight * 0.3 || gesture.velocity(in: window).y > 800 {
                closeWidget()
            } else {
                UIView.animate(withDuration: 0.3, delay: 0, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5) {
                    container.frame.origin.y = window.bounds.height - self.drawerHeight
                    self.backdropView?.backgroundColor = UIColor.black.withAlphaComponent(0.4)
                }
            }
        default: break
        }
    }

    @objc private func launcherTapped() {
        log("widgetOpen")
        openDrawer()
    }

    private func closeWidget() {
        guard let container = containerView, let window = windowRef else { return }
        log("widgetClose")
        UIView.animate(withDuration: 0.35, delay: 0, usingSpringWithDamping: 0.9, initialSpringVelocity: 0) {
            container.frame.origin.y = window.bounds.height
            self.backdropView?.backgroundColor = UIColor.black.withAlphaComponent(0)
        } completion: { _ in
            self.backdropView?.isHidden = true
        }
        if launcherVisible { launcherButton?.isHidden = false }
        sendToWidget(["type": "close", "message": ""])
        emit("widgetClose")
    }

    private func emit(_ event: String) {
        eventHandlers[event]?.forEach { $0() }
    }

    private func sendToWidget(_ data: [String: Any]) {
        guard let json = try? JSONSerialization.data(withJSONObject: data),
              let str = String(data: json, encoding: .utf8) else { return }
        webView?.evaluateJavaScript("window.postMessage(\(str), '*')", completionHandler: nil)
    }
}

// MARK: - WKScriptMessageHandler

extension IncentoService: WKScriptMessageHandler {
    public func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard let body = message.body as? [String: Any],
              let type = body["type"] as? String else { return }

        switch type {
        case "getCookie":
            switch body["key"] as? String {
            case "incentoCustomerAuth":
                let cached = UserDefaults.standard.string(forKey: prefsKey) ?? ""
                sendToWidget(["type": "authTokens", "message": cached])
            case "incentoCustomerInfo":
                var info = ""
                if let uid = userId,
                   let data = try? JSONSerialization.data(withJSONObject: ["member_id": uid]),
                   let str = String(data: data, encoding: .utf8) { info = str }
                sendToWidget(["type": "customerInfo", "message": info])
            default: break
            }

        case "getLocalStorage":
            let key = body["args"] as? String ?? ""
            let value = UserDefaults.standard.string(forKey: "incento_ls_\(key)") ?? ""
            sendToWidget(["type": key, "message": value])

        case "setLocalStorage":
            if let args = body["args"] as? [String], args.count == 2 {
                UserDefaults.standard.set(args[1], forKey: "incento_ls_\(args[0])")
            }

        case "removeLocalStorage":
            let key = body["args"] as? String ?? ""
            UserDefaults.standard.removeObject(forKey: "incento_ls_\(key)")

        case "copyLink":
            if let link = body["referralLink"] as? String {
                UIPasteboard.general.string = link
            }

        case "widgetOpen":
            emit("widgetOpen")

        case "widgetClose":
            DispatchQueue.main.async { self.closeWidget() }

        case "requestLogin":
            emit("loginRequired")

        default: break
        }
    }
}

// MARK: - WeakMessageHandler (retain cycle 방지)

private final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
    private weak var delegate: WKScriptMessageHandler?
    init(_ delegate: WKScriptMessageHandler) { self.delegate = delegate }
    func userContentController(_ c: WKUserContentController, didReceive message: WKScriptMessage) {
        delegate?.userContentController(c, didReceive: message)
    }
}
