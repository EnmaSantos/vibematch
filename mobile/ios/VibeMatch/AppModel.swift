import Foundation
import Observation
import UIKit
import VibeMatchCore

@MainActor @Observable
final class AppModel {
    var profile: Profile?
    var filters = VibeFilters()
    var session: MovieSession?
    var movies: [Movie] = []
    var matches: [MovieMatch] = []
    var history: [MovieSession] = []
    var participantCount = 1
    var isDemo = false
    var busy = false
    var error: String?
    var tab = 0
    var showSetup = false
    private var demoMovies: [Movie] = []
    private var demoSnapshots: [String: SessionSnapshot] = [:]
    private var api: APIClient?

    var websiteURL: URL? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: "VibeMatchServerURL") as? String,
              !value.contains("example.com"), let url = URL(string: value), url.scheme == "https", url.host != nil else { return nil }
        return url
    }

    init() {
        if let url = websiteURL {
            api = try? APIClient(baseURL: url,
                store: KeychainTokenStore(service: "com.vibematch.auth.\(url.host ?? "")"),
                oauthStore: KeychainTokenStore(service: "com.vibematch.oauth.\(url.host ?? "")"))
        }
    }

    func perform(quiet: Bool = false, _ action: () async throws -> Void) async {
        guard !busy else { return }
        busy = true
        if !quiet { error = nil }
        defer { busy = false }
        do { try await action() }
        catch is CancellationError {}
        catch let failure as APIError where failure.isUnauthorized {
            profile = nil; session = nil; movies = []; matches = []; history = []
            error = failure.localizedDescription
        }
        catch { if !quiet { self.error = error.localizedDescription } }
    }

    func restore() async {
        guard let api else { return }
        await perform {
            if try await api.restore() { try await loadAccount() }
        }
    }

    func signIn(email: String, password: String) async {
        await perform {
            guard let api else { throw APIError.configuration }
            try await api.signIn(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
            isDemo = false
            try await loadAccount()
        }
    }

    func beginGoogleSignIn() async {
        await perform {
            guard let api else { throw APIError.configuration }
            let url = try await api.beginGoogleSignIn()
            _ = await UIApplication.shared.open(url)
        }
    }

    func finishGoogleSignIn(_ url: URL) async {
        guard url.scheme == "com.vibematch.ios" else { return }
        await perform {
            guard let api else { throw APIError.configuration }
            try await api.finishGoogleSignIn(callback: url)
            isDemo = false
            try await loadAccount()
        }
    }

    private func loadAccount() async throws {
        guard let api else { throw APIError.configuration }
        let result: Bootstrap = try await api.request("bootstrap")
        profile = result.profile; filters = result.filters
        let list: SessionList = try await api.request("sessions")
        history = list.sessions
        if let id = UserDefaults.standard.string(forKey: "activeSession.\(result.profile.id)") {
            do { try await loadSession(id) }
            catch let failure as APIError where [403, 404].contains(failure.statusCode) {
                UserDefaults.standard.removeObject(forKey: "activeSession.\(result.profile.id)")
            }
        }
    }

    func startDemo() async {
        await perform {
            guard let url = Bundle.main.url(forResource: "demo", withExtension: "json") else {
                throw APIError.response(500, "The demo catalog is missing.")
            }
            let snapshot = try JSONDecoder().decode(SessionSnapshot.self, from: Data(contentsOf: url))
            demoMovies = snapshot.movies
            demoSnapshots = [:]
            profile = Profile(id: "demo", displayName: "Movie matcher", email: "Demo account")
            isDemo = true; filters = VibeFilters(); history = []; session = nil; tab = 0
        }
    }

    func create(title: String, duration: Int) async {
        await perform {
            if isDemo {
                session = MovieSession(id: UUID().uuidString, code: "DEMO-LOCAL", title: title.isEmpty ? "Movie night" : title,
                    status: "live", expiresAt: ISO8601DateFormatter().string(from: Date().addingTimeInterval(Double(duration))),
                    durationSeconds: duration, filters: filters, saved: false, isHost: true)
                movies = demoMovies.filter { filters.accepts($0) }; matches = []; participantCount = 2
            } else {
                guard let api else { throw APIError.configuration }
                let body = try JSONEncoder().encode(CreateSession(title: title.isEmpty ? "Movie night" : title, durationSeconds: duration, filters: filters))
                let result: SessionEnvelope = try await api.request("sessions", method: "POST", body: body)
                session = result.session; movies = []; matches = []; showSetup = false; tab = 1
                rememberSession()
                try await loadSession(result.session.id)
            }
            showSetup = false; tab = 1
        }
    }

    func join(code: String) async {
        await perform {
            guard let api, !isDemo else { return }
            let result: SessionEnvelope = try await api.request("sessions/join", method: "POST", body: JSONEncoder().encode(JoinSession(code: code)))
            session = result.session; movies = []; matches = []; tab = 1; rememberSession()
            try await loadSession(result.session.id); tab = 1
        }
    }

    func open(_ room: MovieSession) async {
        await perform {
            if isDemo {
                if let snapshot = demoSnapshots[room.id] {
                    session = snapshot.session; movies = snapshot.movies; matches = snapshot.matches
                }
                tab = 2; return
            }
            try await loadSession(room.id); tab = room.remainingSeconds() > 0 ? 1 : 2
        }
    }

    func refresh(includeMovies: Bool = true, quiet: Bool = false) async {
        guard let session, !isDemo else { return }
        await perform(quiet: quiet) { try await loadSession(session.id, includeMovies: includeMovies) }
    }

    private func loadSession(_ id: String, includeMovies: Bool = true) async throws {
        guard let api else { throw APIError.configuration }
        let snapshot: SessionSnapshot = try await api.request("sessions/\(id)?includeMovies=\(includeMovies)")
        session = snapshot.session; participantCount = snapshot.participantCount
        matches = snapshot.matches
        if includeMovies { movies = snapshot.movies }
        rememberSession()
    }

    private func rememberSession() {
        if let profile, let session, !isDemo { UserDefaults.standard.set(session.id, forKey: "activeSession.\(profile.id)") }
    }

    func swipe(_ intent: String) async {
        guard let session, session.remainingSeconds() > 0, let movie = movies.first else { return }
        await perform {
            if isDemo {
                if intent == "like" {
                    let partnerLiked = ["tmdb-329865", "tmdb-614934"].contains(movie.id)
                    matches.append(MovieMatch(movie: movie, kind: partnerLiked ? "perfect" : "saved-like",
                        reason: partnerLiked ? "You and the simulated partner both liked this." : "One of your liked titles in this demo."))
                }
                movies.removeFirst()
                syncDemoHistory()
            } else {
                guard let api else { throw APIError.configuration }
                let _: Acknowledgement = try await api.request("sessions/\(session.id)/swipes", method: "POST",
                    body: JSONEncoder().encode(SwipeBody(movieId: movie.id, intent: intent)))
                movies.removeAll { $0.id == movie.id }
                try await loadSession(session.id, includeMovies: movies.isEmpty)
            }
        }
    }

    func saveSession() async {
        guard var room = session else { return }
        await perform {
            if !isDemo {
                guard let api else { throw APIError.configuration }
                let _: Acknowledgement = try await api.request("sessions/\(room.id)/save", method: "POST",
                    body: JSONEncoder().encode(SaveBody(saved: !room.saved)))
            }
            room.saved.toggle(); session = room
            if isDemo { syncDemoHistory() }
            else if let api { let result: SessionList = try await api.request("sessions"); history = result.sessions }
        }
    }

    func endRound() async {
        guard var room = session, room.isHost else { return }
        await perform {
            if !isDemo {
                guard let api else { throw APIError.configuration }
                let _: Acknowledgement = try await api.request("sessions/\(room.id)/complete", method: "POST", body: Data("{}".utf8))
            }
            room.status = "complete"; session = room; tab = 2
            if isDemo { syncDemoHistory() }
            if !isDemo { try await loadSession(room.id, includeMovies: false) }
        }
    }

    func signOut() async {
        await perform {
            if !isDemo { try await api?.signOut() }
            profile = nil; session = nil; movies = []; matches = []; history = []
            isDemo = false; tab = 0
            demoSnapshots = [:]
        }
    }

    private func syncDemoHistory() {
        guard let room = session else { return }
        history.removeAll { $0.id == room.id }
        if room.saved {
            demoSnapshots[room.id] = SessionSnapshot(session: room, participantCount: participantCount, movies: movies, matches: matches)
            history.insert(room, at: 0)
        } else { demoSnapshots.removeValue(forKey: room.id) }
    }
}

private struct CreateSession: Encodable { let title: String; let durationSeconds: Int; let filters: VibeFilters }
private struct JoinSession: Encodable { let code: String }
private struct SwipeBody: Encodable { let movieId: String; let intent: String }
private struct SaveBody: Encodable { let saved: Bool }
