//
//  MyPageView.swift
//  app-native_ios
//

import SwiftUI

struct MyPageView: View {
    @EnvironmentObject var auth: AuthManager

    var body: some View {
        NavigationStack {
            if auth.isLoggedIn {
                VStack(spacing: 16) {
                    Text("안녕하세요, \(auth.username ?? "")님!")
                        .font(.title2)
                    Button("로그아웃", role: .destructive) {
                        auth.logout()
                    }
                }
                .navigationTitle("마이페이지")
            } else {
                LoginView()
                    .navigationTitle("마이페이지")
            }
        }
        .onAppear {
            if auth.isLoggedIn {
                IncentoService.shared.show()
            } else {
                IncentoService.shared.hide()
            }
        }
    }
}

#Preview {
    MyPageView()
        .environmentObject(AuthManager())
}
