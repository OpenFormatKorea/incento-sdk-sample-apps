//
//  LoginView.swift
//  app-native_ios
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var auth: AuthManager
    @State private var username = ""
    @State private var password = ""

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            VStack(spacing: 8) {
                Text("로그인")
                    .font(.largeTitle)
                    .bold()
                Text("마이페이지를 이용하려면 로그인이 필요해요.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 12) {
                TextField("아이디를 입력하세요", text: $username)
                    .textFieldStyle(.roundedBorder)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)

                SecureField("비밀번호를 입력하세요", text: $password)
                    .textFieldStyle(.roundedBorder)

                Button {
                    auth.login(username: username.isEmpty ? "사용자" : username)
                } label: {
                    Text("로그인")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(username.isEmpty || password.isEmpty)
            }

            Spacer()
        }
        .padding(.horizontal, 32)
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthManager())
}
