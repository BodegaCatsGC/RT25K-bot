import Foundation

func fetchStandings(spreadsheetId: String, sheetName: String = "s4-standings", apiKey: String) async throws -> [[String]] {
    let urlString = "https://sheets.googleapis.com/v4/spreadsheets/\(spreadsheetId)/values/\(sheetName)?key=\(apiKey)"
    guard let url = URL(string: urlString) else {
        throw URLError(.badURL)
    }
    let (data, _) = try await URLSession.shared.data(from: url)
    let response = try JSONDecoder().decode(SheetResponse.self, from: data)
    return response.values
}

private struct SheetResponse: Decodable {
    let values: [[String]]
}
