//
//  AuthManager.swift
//  app-native_ios
//

import SwiftUI
import Combine

class AuthManager: ObservableObject {
    @Published var isLoggedIn = false
    @Published var username: String? = nil
    @Published var selectedTab = 0
    var pendingWidgetOpen = false

    func login(username: String) {
        isLoggedIn = true
        self.username = username
    }

    func logout() {
        isLoggedIn = false
        username = nil
    }
}
