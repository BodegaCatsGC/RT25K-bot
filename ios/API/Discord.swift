import Foundation

func sendDiscordMessage(token: String, channelId: String, content: String) async throws {
    let urlString = "https://discord.com/api/v10/channels/\(channelId)/messages"
    guard let url = URL(string: urlString) else {
        throw URLError(.badURL)
    }
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.addValue("Bot \(token)", forHTTPHeaderField: "Authorization")
    request.addValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONEncoder().encode(["content": content])
    _ = try await URLSession.shared.data(for: request)
}
