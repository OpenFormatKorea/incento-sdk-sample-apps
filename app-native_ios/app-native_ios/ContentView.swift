//
//  ContentView.swift
//  app-native_ios
//
//  Created by Suzy Park on 5/19/26.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("홈", systemImage: "house")
                }

            ProductsView()
                .tabItem {
                    Label("상품", systemImage: "bag")
                }

            MyPageView()
                .tabItem {
                    Label("My", systemImage: "person")
                }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager())
}
