import SwiftUI

struct LoginView: View {
    @State private var token: String = ""
    var onLogin: (String) -> Void

    var body: some View {
        VStack(spacing: 20) {
            Text("Discord Bot Token")
                .font(.title)
            TextField("Bot Token", text: $token)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            Button("Login") {
                onLogin(token)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}
