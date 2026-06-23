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

                    VStack(spacing: 4) {
                        Text("마이페이지 넛징 배너").font(.headline)
                        Text("친구 초대 시 3,000원 즉시 지급!")
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 160)
                    .overlay(Rectangle().stroke(Color.black, lineWidth: 1))
                    .contentShape(Rectangle())
                    .onTapGesture {
                        IncentoService.shared.open()
                    }
                    .padding(.horizontal)
                }
                .navigationTitle("마이페이지")
            } else {
                LoginView()
                    .navigationTitle("마이페이지")
            }
        }
        .onAppear {
            if auth.isLoggedIn {
                IncentoService.shared.setPath("/mypage")
                IncentoService.shared.show()
            } else {
                IncentoService.shared.setPath("/login")
                IncentoService.shared.hide()
            }
        }
    }
}

#Preview {
    MyPageView()
        .environmentObject(AuthManager())
}
