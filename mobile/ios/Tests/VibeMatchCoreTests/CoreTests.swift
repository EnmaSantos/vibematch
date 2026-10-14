import Foundation
import VibeMatchCore

final class CoreChecks {
    private func fixture() throws -> SessionSnapshot {
        let path = URL(fileURLWithPath: #filePath).deletingLastPathComponent().appendingPathComponent("../../../shared/demo.json")
        return try JSONDecoder().decode(SessionSnapshot.self, from: Data(contentsOf: path))
    }

    func testSharedContractAndFilters() throws {
        let snapshot = try fixture()
        try expectEqual(snapshot.participantCount, 2)
        try expectEqual(snapshot.movies.count, 4)
        try expectNil(snapshot.movies[0].posterUrl)
        var filters = VibeFilters()
        filters.genres = ["Science Fiction"]
        try expectTrue(filters.accepts(try unwrap(snapshot.movies.first { $0.title == "Arrival" })))
        filters.runtime = "Under 90 minutes"
        try expectFalse(filters.accepts(snapshot.movies[0]))
        filters = VibeFilters(); filters.animationPreference = "Animation"
        try expectFalse(filters.accepts(snapshot.movies[0]))
    }

    func testTimerAcceptsFractionalAndPlainISO8601AndNeverGoesNegative() throws {
        let snapshot = try fixture()
        let start = try unwrap(ISO8601DateFormatter().date(from: "2030-01-01T00:00:00Z"))
        try expectEqual(snapshot.session.remainingSeconds(at: start), 180)
        try expectEqual(snapshot.session.remainingSeconds(at: start.addingTimeInterval(180)), 0)
        var session = snapshot.session
        session.status = "complete"
        try expectEqual(session.remainingSeconds(at: start), 0)
        let plain = MovieSession(id: "test", code: "VIBE-TEST", title: "Test", status: "live",
            expiresAt: "2030-01-01T00:03:00+00:00", durationSeconds: 180, filters: VibeFilters(), saved: false, isHost: false)
        try expectEqual(plain.remainingSeconds(at: start.addingTimeInterval(179.5)), 1)
    }

    func testRejectsInsecureServerOrigins() throws {
        for origin in ["http://example.com", "https://user:password@example.com", "https://example.com?redirect=elsewhere"] {
            try expectThrows { try APIClient(baseURL: URL(string: origin)!, store: MemoryStore()) }
        }
    }

    func testRefreshRotationAndConcurrentRequestsUseOneRefresh() async throws {
        let store = MemoryStore("old-refresh")
        let server = StubServer()
        server.respond = { request in
            if request.url!.path.hasSuffix("auth/refresh") {
                return (200, "{\"accessToken\":\"new-access\",\"refreshToken\":\"rotated-refresh\",\"expiresAt\":4102444800}")
            }
            guard request.value(forHTTPHeaderField: "Authorization") == "Bearer new-access" else {
                return (401, "{\"error\":\"Wrong token\"}")
            }
            return (200, "{\"ok\":true}")
        }
        StubProtocol.server = server
        let client = try makeClient(store)
        async let first: Acknowledgement = client.request("first")
        async let second: Acknowledgement = client.request("second")
        let results = try await (first, second)
        try expectTrue(results.0.ok && results.1.ok)
        try expectEqual(store.load(), "rotated-refresh")
        try expectEqual(server.paths.filter { $0.hasSuffix("auth/refresh") }.count, 1)
    }

    func testRefreshOutageKeepsCredentialsAndInvalidRefreshClearsThem() async throws {
        let store = MemoryStore("still-valid")
        let server = StubServer()
        server.respond = { _ in (502, "{\"error\":\"Try again later\"}") }
        StubProtocol.server = server
        let client = try makeClient(store)
        try await expectAsyncError { _ = try await client.restore() }
        try expectEqual(store.load(), "still-valid")
        server.respond = { _ in (401, "{\"error\":\"Please sign in again\"}") }
        try await expectAsyncError { _ = try await client.restore() }
        try expectNil(store.load())
    }

    private func makeClient(_ store: MemoryStore) throws -> APIClient {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubProtocol.self]
        return try APIClient(baseURL: URL(string: "https://vibematch.test")!, store: store, transport: URLSession(configuration: configuration))
    }
}

private final class MemoryStore: TokenStore, @unchecked Sendable {
    private let lock = NSLock()
    private var value: String?
    init(_ value: String? = nil) { self.value = value }
    func load() -> String? { lock.withLock { value } }
    func save(_ token: String) { lock.withLock { value = token } }
    func clear() { lock.withLock { value = nil } }
}

private final class StubServer: @unchecked Sendable {
    private let lock = NSLock()
    private var recordedPaths: [String] = []
    var paths: [String] { lock.withLock { recordedPaths } }
    var respond: @Sendable (URLRequest) -> (Int, String) = { _ in (500, "{}") }
    func response(_ request: URLRequest) -> (Int, String) {
        lock.withLock { recordedPaths.append(request.url!.path) }
        return respond(request)
    }
}

private final class StubProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var server = StubServer()
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        let (status, body) = Self.server.response(request)
        let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data(body.utf8))
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}

// Portable checks run with the Swift command-line tools, without XCTest or Xcode.
@main
struct CoreVerification {
    static func main() async throws {
        let checks = CoreChecks()
        try checks.testSharedContractAndFilters()
        try checks.testTimerAcceptsFractionalAndPlainISO8601AndNeverGoesNegative()
        try checks.testRejectsInsecureServerOrigins()
        try await checks.testRefreshRotationAndConcurrentRequestsUseOneRefresh()
        try await checks.testRefreshOutageKeepsCredentialsAndInvalidRefreshClearsThem()
        print("Passed 5 Swift core checks: contract, filters/timers, HTTPS, refresh concurrency, auth recovery.")
    }
}
private struct CheckFailure: Error { let message: String }
private func expectEqual<T: Equatable>(_ actual: T, _ expected: T) throws {
    if actual != expected { throw CheckFailure(message: "Expected \(expected), got \(actual)") }
}
private func expectTrue(_ value: Bool) throws { try expectEqual(value, true) }
private func expectFalse(_ value: Bool) throws { try expectEqual(value, false) }
private func expectNil<T>(_ value: T?) throws { try expectTrue(value == nil) }
private func unwrap<T>(_ value: T?) throws -> T {
    guard let value else { throw CheckFailure(message: "Expected a value") }
    return value
}
private func expectThrows<T>(_ action: () throws -> T) throws {
    do { _ = try action() } catch { return }
    throw CheckFailure(message: "Expected an error")
}
private func expectAsyncError(_ action: () async throws -> Void) async throws {
    do { try await action() } catch { return }
    throw CheckFailure(message: "Expected an async error")
}
