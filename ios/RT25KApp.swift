import SwiftUI

@main
struct RT25KApp: App {
    @State private var token: String? = nil
    @State private var config: Config? = nil

    var body: some Scene {
        WindowGroup {
            contentView()
        }
    }

    @ViewBuilder
    private func contentView() -> some View {
        if token == nil {
            LoginView(onLogin: { token = $0 })
        } else if config == nil {
            ConfigView(initial: nil, onSave: { config = $0 })
        } else {
            HomeView(token: token!, config: config!, onLogout: {
                token = nil
                config = nil
            }, onUpdateConfig: { config = $0 })
        }
    }
}
