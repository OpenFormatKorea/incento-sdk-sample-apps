//
//  HomeView.swift
//  app-native_ios
//

import SwiftUI

struct HomeView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Text("홈")
                Button("혜택 받기") {
                    IncentoService.shared.open()
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.blue, lineWidth: 2))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .navigationTitle("홈")
        }
        .onAppear {
            IncentoService.shared.setPath("/")
            IncentoService.shared.show()
        }
    }
}

#Preview {
    HomeView()
}
