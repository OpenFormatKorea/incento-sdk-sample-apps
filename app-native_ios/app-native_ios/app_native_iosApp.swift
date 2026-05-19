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

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(auth)
        }
    }
}
