import SwiftUI

struct HomeView: View {
    let token: String
    @State var config: Config
    var onLogout: () -> Void
    var onUpdateConfig: (Config) -> Void

    @State private var output: String = ""
    @State private var showingConfig = false

    var body: some View {
        NavigationView {
            VStack(alignment: .leading, spacing: 16) {
                Button("Fetch Standings") {
                    Task {
                        await loadStandings()
                    }
                }
                Button("Fetch Tournament") {
                    Task {
                        await loadTournament()
                    }
                }
                Button("Configure") { showingConfig = true }
                Button("Logout") { onLogout() }
                if !output.isEmpty {
                    ScrollView { Text(output).frame(maxWidth: .infinity, alignment: .leading) }
                }
            }
            .padding()
            .navigationTitle("Home")
            .sheet(isPresented: $showingConfig) {
                ConfigView(initial: config) { newConfig in
                    config = newConfig
                    onUpdateConfig(newConfig)
                    showingConfig = false
                }
            }
        }
    }

    private func loadStandings() async {
        do {
            let values = try await fetchStandings(spreadsheetId: config.spreadsheetId, apiKey: config.googleApiKey)
            output = String(describing: values)
        } catch {
            output = error.localizedDescription
        }
    }

    private func loadTournament() async {
        do {
            let t = try await fetchTournament(apiKey: config.challongeKey)
            output = String(describing: t)
        } catch {
            output = error.localizedDescription
        }
    }
}
