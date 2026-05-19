//
//  ProductsView.swift
//  app-native_ios
//

import SwiftUI

struct ProductsView: View {
    var body: some View {
        NavigationStack {
            Text("상품")
                .navigationTitle("상품")
        }
        .onAppear { IncentoService.shared.hide() }
    }
}

#Preview {
    ProductsView()
}
