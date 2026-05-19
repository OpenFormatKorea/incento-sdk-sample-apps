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
            apiKey: "inc_pk_live_9230dc93331a446b4b81362b613a9faa26740f70aa40fe8b541f5e0c9d2ae934",
            userId: auth.username,
            visible: auth.isLoggedIn,
            autoOpen: shouldOpen,
            debug: true,
        )
    }
}
