import Foundation
import CryptoKit
import Security

public actor APIClient {
    private let baseURL: URL
    private let store: any TokenStore
    private let oauthStore: any TokenStore
    private let transport: URLSession
    private var tokens: AuthTokens?
    private var refreshTask: Task<AuthTokens, Error>?
    private var generation = 0

    public init(baseURL: URL, store: any TokenStore, oauthStore: any TokenStore = KeychainTokenStore(service: "com.vibematch.oauth"), transport: URLSession = .shared) throws {
        guard baseURL.scheme == "https", baseURL.host != nil,
              baseURL.user == nil, baseURL.password == nil,
              baseURL.query == nil, baseURL.fragment == nil else { throw APIError.configuration }
        self.baseURL = baseURL; self.store = store; self.oauthStore = oauthStore; self.transport = transport
    }

    public func signIn(email: String, password: String) async throws {
        let body = try JSONEncoder().encode(Login(email: email, password: password))
        let result: AuthTokens = try await send("auth/login", method: "POST", body: body, token: nil)
        try store.save(result.refreshToken)
        tokens = result
    }

    public func beginGoogleSignIn() async throws -> URL {
        var bytes = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else {
            throw APIError.response(500, "Could not start secure Google sign-in.")
        }
        let verifier = Data(bytes).base64URLEncoded()
        let challenge = Data(SHA256.hash(data: Data(verifier.utf8))).base64URLEncoded()
        try oauthStore.save(verifier)
        do {
            let start: GoogleOAuthStart = try await send("auth/google/start?platform=ios&codeChallenge=\(challenge)", method: "GET", body: nil, token: nil)
            guard let url = URL(string: start.url), url.scheme == "https" else { throw APIError.configuration }
            return url
        } catch {
            try? oauthStore.clear()
            throw error
        }
    }

    public func finishGoogleSignIn(callback: URL) async throws {
        guard callback.scheme == "com.vibematch.ios", callback.host == "auth", callback.path == "/callback" else {
            throw APIError.response(400, "Invalid Google sign-in return link.")
        }
        let code = URLComponents(url: callback, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "code" })?.value
        guard let code, !code.isEmpty else {
            try? oauthStore.clear()
            throw APIError.response(400, "Google sign-in was canceled or could not finish.")
        }
        guard let verifier = try oauthStore.load() else {
            throw APIError.response(401, "Google sign-in expired. Please try again.")
        }
        let body = try JSONEncoder().encode(GoogleOAuthExchange(code: code, codeVerifier: verifier))
        let result: AuthTokens = try await send("auth/google/exchange", method: "POST", body: body, token: nil)
        try store.save(result.refreshToken)
        try oauthStore.clear()
        tokens = result
    }

    public func restore() async throws -> Bool {
        guard try store.load() != nil else { return false }
        _ = try await refresh()
        return true
    }

    public func signOut() async throws {
        // Keep credentials on network failure so revocation can be retried.
        let _: Acknowledgement = try await request("auth/logout", method: "POST", body: Data("{}".utf8))
        try clearSession()
    }

    private func clearSession() throws {
        generation += 1
        refreshTask?.cancel(); refreshTask = nil; tokens = nil
        try store.clear()
    }

    public func request<T: Decodable & Sendable>(_ path: String, method: String = "GET", body: Data? = nil) async throws -> T {
        if tokens == nil || (tokens?.expiresAt ?? 0) < Date().timeIntervalSince1970 + 30 {
            _ = try await refresh()
        }
        let sentToken = tokens?.accessToken
        do {
            return try await send(path, method: method, body: body, token: sentToken)
        } catch let error as APIError where error.isUnauthorized {
            if sentToken == tokens?.accessToken { _ = try await refresh() }
            return try await send(path, method: method, body: body, token: tokens?.accessToken)
        }
    }

    private func refresh() async throws -> AuthTokens {
        if let refreshTask { return try await refreshTask.value }
        guard let refreshToken = try store.load() else { throw APIError.response(401, "Please sign in again.") }
        let currentGeneration = generation
        let task = Task<AuthTokens, Error> {
            let body = try JSONEncoder().encode(Refresh(refreshToken: refreshToken))
            let result: AuthTokens = try await self.send("auth/refresh", method: "POST", body: body, token: nil)
            guard currentGeneration == self.generation else { throw CancellationError() }
            try self.store.save(result.refreshToken)
            self.tokens = result
            return result
        }
        refreshTask = task
        defer { refreshTask = nil }
        do {
            return try await task.value
        } catch let error as APIError where error.isUnauthorized {
            try clearSession()
            throw error
        }
    }

    private func send<T: Decodable & Sendable>(_ path: String, method: String, body: Data?, token: String?) async throws -> T {
        // Paths are application constants; URLComponents preserves the snapshot query.
        guard let url = URL(string: baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + "/api/mobile/v1/" + path) else { throw APIError.configuration }
        var request = URLRequest(url: url, timeoutInterval: 30)
        request.httpMethod = method; request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        let (data, response) = try await transport.data(for: request)
        guard let response = response as? HTTPURLResponse else { throw APIError.response(502, "Invalid server response.") }
        guard (200..<300).contains(response.statusCode) else {
            let error = try? JSONDecoder().decode(ErrorEnvelope.self, from: data)
            throw APIError.response(response.statusCode, error?.error ?? "The server could not complete the request.")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

private struct Login: Encodable { let email: String; let password: String }
private struct Refresh: Encodable { let refreshToken: String }
private struct GoogleOAuthStart: Decodable { let url: String }
private struct GoogleOAuthExchange: Encodable { let code: String; let codeVerifier: String }
private struct ErrorEnvelope: Decodable { let error: String }

private extension Data {
    func base64URLEncoded() -> String {
        base64EncodedString().replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }
}
