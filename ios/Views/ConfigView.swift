import SwiftUI

struct ConfigView: View {
    @State private var spreadsheetId: String
    @State private var challongeKey: String
    @State private var googleApiKey: String
    var onSave: (Config) -> Void

    init(initial: Config?, onSave: @escaping (Config) -> Void) {
        _spreadsheetId = State(initialValue: initial?.spreadsheetId ?? "")
        _challongeKey = State(initialValue: initial?.challongeKey ?? "")
        _googleApiKey = State(initialValue: initial?.googleApiKey ?? "")
        self.onSave = onSave
    }

    var body: some View {
        Form {
            Section(header: Text("Configuration")) {
                TextField("Google Spreadsheet ID", text: $spreadsheetId)
                TextField("Google API Key", text: $googleApiKey)
                TextField("Challonge API Key", text: $challongeKey)
            }
            Button("Save") {
                onSave(Config(spreadsheetId: spreadsheetId, challongeKey: challongeKey, googleApiKey: googleApiKey))
            }
        }
    }
}
