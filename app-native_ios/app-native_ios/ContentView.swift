//
//  ContentView.swift
//  app-native_ios
//
//  Created by Suzy Park on 5/19/26.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var auth: AuthManager

    var body: some View {
        TabView(selection: $auth.selectedTab) {
            HomeView()
                .tabItem { Label("홈", systemImage: "house") }
                .tag(0)

            ProductsView()
                .tabItem { Label("상품", systemImage: "bag") }
                .tag(1)

            MyPageView()
                .tabItem { Label("My", systemImage: "person") }
                .tag(2)
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager())
}
