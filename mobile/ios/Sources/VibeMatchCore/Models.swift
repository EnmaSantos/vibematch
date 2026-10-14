import Foundation

public struct VibeFilters: Codable, Equatable, Sendable {
    public var moods: [String] = ["Cozy", "Funny"]
    public var runtime = "Anything"
    public var genres: [String] = []
    public var releaseAge = "Any year"
    public var animationPreference = "Either"
    public init() {}

    public static let moodOptions = ["Cozy", "Funny", "Romantic", "Scary", "Intense", "Mind-bending", "Comfort watch", "Background watch", "Actually pay attention"]
    public static let genreOptions = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", "Romance", "Science Fiction", "Thriller", "War", "Western"]
    public static let runtimeOptions = ["Under 90 minutes", "Under 2 hours", "Anything"]
    public static let releaseOptions = ["New/recent", "Last 5 years", "2000s and newer", "90s and newer", "Classics are fine", "Any year"]
    public static let animationOptions = ["Live action", "Animation", "Either"]

    public func accepts(_ movie: Movie, year: Int = Calendar.current.component(.year, from: Date())) -> Bool {
        func canonical(_ value: String) -> String { value.lowercased().replacingOccurrences(of: "sci-fi", with: "science fiction") }
        if !genres.isEmpty && !movie.genres.contains(where: { genres.map(canonical).contains(canonical($0)) }) { return false }
        if runtime == "Under 90 minutes" && movie.runtimeMinutes >= 90 { return false }
        if runtime == "Under 2 hours" && movie.runtimeMinutes > 120 { return false }
        let animated = movie.genres.contains("Animation")
        if animationPreference == "Animation" && !animated { return false }
        if animationPreference == "Live action" && animated { return false }
        let minimum = ["New/recent": 2024, "Last 5 years": year - 5, "2000s and newer": 2000, "90s and newer": 1990][releaseAge] ?? 0
        return (Int(movie.year) ?? year) >= minimum
    }
}

public struct WatchProvider: Codable, Sendable {
    public let name: String
    public let type: String
    public let lastCheckedAt: String
}

public struct Movie: Codable, Identifiable, Sendable {
    public let id: String
    public let title: String
    public let overview: String
    public let posterUrl: String?
    public let year: String
    public let runtimeMinutes: Int
    public let genres: [String]
    public let rating: Double
    public let providers: [WatchProvider]
}

public struct Profile: Codable, Sendable {
    public let id: String
    public let displayName: String
    public let email: String
    public init(id: String, displayName: String, email: String) {
        self.id = id; self.displayName = displayName; self.email = email
    }
}

public struct MovieSession: Codable, Identifiable, Sendable {
    public let id: String
    public let code: String
    public let title: String
    public var status: String
    public let expiresAt: String?
    public let durationSeconds: Int
    public let filters: VibeFilters
    public var saved: Bool
    public let isHost: Bool

    public init(id: String, code: String, title: String, status: String, expiresAt: String?, durationSeconds: Int, filters: VibeFilters, saved: Bool, isHost: Bool) {
        self.id = id; self.code = code; self.title = title; self.status = status
        self.expiresAt = expiresAt; self.durationSeconds = durationSeconds
        self.filters = filters; self.saved = saved; self.isHost = isHost
    }

    public func remainingSeconds(at now: Date = Date()) -> Int {
        guard status == "live", let expiresAt else { return 0 }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: expiresAt) ?? ISO8601DateFormatter().date(from: expiresAt)
        guard let date else { return 0 }
        return min(durationSeconds, max(0, Int(ceil(date.timeIntervalSince(now)))))
    }
}

public struct MovieMatch: Codable, Identifiable, Sendable {
    public let movie: Movie
    public let kind: String
    public let reason: String
    public var id: String { movie.id }
    public var label: String {
        switch kind {
        case "perfect": "Perfect match"
        case "almost": "Almost a match"
        default: "Liked title"
        }
    }
    public init(movie: Movie, kind: String, reason: String) {
        self.movie = movie; self.kind = kind; self.reason = reason
    }
}

public struct Bootstrap: Decodable, Sendable {
    public let profile: Profile
    public let filters: VibeFilters
}
public struct SessionEnvelope: Decodable, Sendable { public let session: MovieSession }
public struct SessionList: Decodable, Sendable { public let sessions: [MovieSession] }
public struct SessionSnapshot: Codable, Sendable {
    public let session: MovieSession
    public let participantCount: Int
    public let movies: [Movie]
    public let matches: [MovieMatch]
    public init(session: MovieSession, participantCount: Int, movies: [Movie], matches: [MovieMatch]) {
        self.session = session; self.participantCount = participantCount; self.movies = movies; self.matches = matches
    }
}
public struct AuthTokens: Codable, Sendable {
    public let accessToken: String
    public let refreshToken: String
    public let expiresAt: Double
}
public struct Acknowledgement: Decodable, Sendable { public let ok: Bool }

public enum APIError: Error, LocalizedError, Sendable {
    case configuration
    case response(Int, String)
    public var errorDescription: String? {
        switch self {
        case .configuration: "Configure a valid HTTPS VibeMatch server URL to sign in, or explore the demo."
        case .response(_, let message): message
        }
    }
    public var isUnauthorized: Bool {
        if case .response(401, _) = self { return true }
        return false
    }
    public var statusCode: Int {
        if case .response(let status, _) = self { return status }
        return 0
    }
}
