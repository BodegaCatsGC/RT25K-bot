import Foundation

func fetchTournament(id: String = "final_drive", apiKey: String) async throws -> Tournament {
    let urlString = "https://api.challonge.com/v1/tournaments/\(id).json?api_key=\(apiKey)&include_matches=1&include_participants=1"
    guard let url = URL(string: urlString) else {
        throw URLError(.badURL)
    }
    let (data, _) = try await URLSession.shared.data(from: url)
    let wrapper = try JSONDecoder().decode(TournamentWrapper.self, from: data)
    return wrapper.tournament
}

struct TournamentWrapper: Decodable {
    let tournament: Tournament
}

struct Tournament: Decodable {
    let name: String
    let id: Int
}
