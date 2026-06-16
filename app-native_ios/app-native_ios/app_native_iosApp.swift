//
//  app_native_iosApp.swift
//  app-native_ios
//
//  Created by Suzy Park on 5/19/26.
//

import SwiftUI

@main
struct app_native_iosApp: App {
    @StateObject private var auth = AuthManager()
    @State private var hooksRegistered = false

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(auth)
                .onAppear {
                    if !hooksRegistered {
                        hooksRegistered = true
                        IncentoService.shared.on("loginRequired") {
                            DispatchQueue.main.async {
                                auth.pendingWidgetOpen = true
                                IncentoService.shared.hide()
                                auth.selectedTab = 2
                            }
                        }
                    }
                    bootIncento()
                }
                .onChange(of: auth.isLoggedIn) {
                    bootIncento()
                }
        }
    }

    private func bootIncento() {
        let shouldOpen = auth.pendingWidgetOpen && auth.isLoggedIn
        auth.pendingWidgetOpen = false
        IncentoService.shared.shutdown()
        IncentoService.shared.boot(
            apiKey: Secrets.incentoApiKey,
            userId: auth.username,
            userCreatedAt: mockUserCreatedAt(auth.username),
            pagePath: "/",
            visible: auth.isLoggedIn,
            autoOpen: shouldOpen,
            debug: true,
        )
    }

    // 독립몰 자체 회원 DB를 시뮬레이션합니다.
    // 실제 서비스에서는 고객사 백엔드/세션에서 회원의 원래 가입 일시를 읽어와 전달합니다.
    // 알려진 기존 회원이면 가입 일시(예시 A: 2년 전)를, 신규 회원이면 nil을 반환합니다.
    private func mockUserCreatedAt(_ userId: String?) -> String? {
        switch userId {
        case "member_001": return "2023-03-15T09:30:00+09:00"
        default: return nil
        }
    }
}
