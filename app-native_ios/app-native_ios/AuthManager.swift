//
//  AuthManager.swift
//  app-native_ios
//

import SwiftUI
import Combine

class AuthManager: ObservableObject {
    @Published var isLoggedIn = false
    @Published var username: String? = nil

    func login(username: String) {
        isLoggedIn = true
        self.username = username
    }

    func logout() {
        isLoggedIn = false
        username = nil
    }
}
