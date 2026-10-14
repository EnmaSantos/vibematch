import SwiftUI
import VibeMatchCore

@main
struct VibeMatchApp: App {
    @State private var model = AppModel()
    var body: some Scene {
        WindowGroup {
            RootView(model: model)
                .tint(Color(red: 0.94, green: 0.71, blue: 0.30))
                .preferredColorScheme(.dark)
                .task { await model.restore() }
        }
    }
}

struct RootView: View {
    @Bindable var model: AppModel
    @Environment(\.scenePhase) private var scenePhase
    var body: some View {
        Group {
            if model.profile == nil { SignInView(model: model) }
            else {
                TabView(selection: $model.tab) {
                    DashboardView(model: model).tabItem { Label("Home", systemImage: "house") }.tag(0)
                    RoundView(model: model).tabItem { Label("Swipe", systemImage: "rectangle.stack") }.tag(1)
                    MatchesView(model: model).tabItem { Label("Matches", systemImage: "heart") }.tag(2)
                    ProfileView(model: model).tabItem { Label("Profile", systemImage: "person") }.tag(3)
                }
                .safeAreaInset(edge: .top, spacing: 0) {
                    if model.isDemo {
                        Text("DEMO · simulated partner · changes stay on this device")
                            .font(.caption2).foregroundStyle(.secondary).padding(8).frame(maxWidth: .infinity)
                    }
                }
                .task(id: model.session?.id) {
                    while !Task.isCancelled {
                        do { try await Task.sleep(for: .seconds(10)) } catch { return }
                        if scenePhase == .active { await model.refresh(includeMovies: false, quiet: true) }
                    }
                }
            }
        }
        .overlay(alignment: .top) { if model.busy { ProgressView().padding(10).background(.regularMaterial, in: Capsule()) } }
        .alert("Couldn’t finish that", isPresented: Binding(get: { model.error != nil }, set: { if !$0 { model.error = nil } })) {
            Button("OK") { model.error = nil }
        } message: { Text(model.error ?? "") }
        .sheet(isPresented: $model.showSetup) { SetupView(model: model) }
        .onOpenURL { url in Task { await model.finishGoogleSignIn(url) } }
    }
}

private struct SignInView: View {
    @Bindable var model: AppModel
    @State private var email = ""
    @State private var password = ""
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Image(systemName: "sparkles").font(.system(size: 58)).foregroundStyle(.tint).padding(.top, 55)
                    Text("VibeMatch").font(.largeTitle.bold())
                    Text("Less scrolling.\nMore movie nights.").font(.system(.largeTitle, design: .rounded, weight: .bold))
                    Text("Find something you both want to watch.").foregroundStyle(.secondary)
                    VStack(spacing: 14) {
                        TextField("Email", text: $email).textContentType(.emailAddress).keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never).autocorrectionDisabled()
                        SecureField("Password", text: $password).textContentType(.password)
                    }.textFieldStyle(.roundedBorder)
                    Button("Sign in") {
                        let enteredPassword = password
                        password = ""
                        Task { await model.signIn(email: email, password: enteredPassword) }
                    }.buttonStyle(.borderedProminent).disabled(email.isEmpty || password.isEmpty || model.busy || model.websiteURL == nil)
                    Button("Continue with Google") { Task { await model.beginGoogleSignIn() } }
                        .buttonStyle(.bordered).disabled(model.busy || model.websiteURL == nil)
                    if let url = model.websiteURL {
                        HStack {
                            Link("Create account", destination: url.appendingPathComponent("signup"))
                            Spacer()
                            Link("Forgot password?", destination: url.appendingPathComponent("forgot-password"))
                        }.font(.subheadline)
                    } else {
                        Text("Live sign-in will be available once a server is configured.").font(.footnote).foregroundStyle(.secondary)
                    }
                    Divider()
                    Button("Explore the demo", systemImage: "play.circle") { Task { await model.startDemo() } }
                        .buttonStyle(.bordered).disabled(model.busy)
                }.padding(24).frame(maxWidth: 520)
            }.frame(maxWidth: .infinity).background(Color(red: 0.035, green: 0.043, blue: 0.067))
        }
    }
}

private struct DashboardView: View {
    @Bindable var model: AppModel
    @State private var code = ""
    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Hey, \(model.profile?.displayName ?? "movie matcher").").foregroundStyle(.secondary)
                        Text("What’s the vibe\ntonight?").font(.largeTitle.bold())
                        Text("Pick a mood. Invite your person. Find your movie.").foregroundStyle(.secondary)
                        Button("Start a movie night", systemImage: "sparkles") { model.showSetup = true }
                            .buttonStyle(.borderedProminent).padding(.top, 8)
                    }.padding(.vertical, 14)
                }
                if let room = model.session {
                    Section("Current round") {
                        Button { model.tab = room.remainingSeconds() > 0 ? 1 : 2 } label: {
                            Label("\(room.title) · \(room.code)", systemImage: "rectangle.stack")
                        }
                    }
                }
                if !model.isDemo {
                    Section("Join your person") {
                        TextField("VIBE-ABCD", text: $code).textInputAutocapitalization(.characters).autocorrectionDisabled()
                        Button("Join session", systemImage: "person.2") { Task { await model.join(code: code) } }
                            .disabled(code.trimmingCharacters(in: .whitespaces).isEmpty || model.busy)
                    }
                }
                Section("Saved sessions") {
                    if model.history.isEmpty { Text("Save a round to keep it here.").foregroundStyle(.secondary) }
                    ForEach(model.history) { room in
                        Button { Task { await model.open(room) } } label: {
                            VStack(alignment: .leading) { Text(room.title); Text(room.code).font(.caption).foregroundStyle(.secondary) }
                        }.disabled(model.busy)
                    }
                }
            }.navigationTitle("VibeMatch")
        }
    }
}

private struct SetupView: View {
    @Bindable var model: AppModel
    @Environment(\.dismiss) private var dismiss
    @State private var title = "Movie night"
    @State private var duration = 180
    var body: some View {
        NavigationStack {
            Form {
                Section("Make it a movie night") {
                    TextField("Session title", text: $title)
                    Picker("Round length", selection: $duration) {
                        ForEach([60, 180, 300, 600, 900], id: \.self) { Text("\($0 / 60) minutes").tag($0) }
                    }
                    Text("The timer starts when you create the room.").font(.caption).foregroundStyle(.secondary)
                }
                Section("Mood") { OptionGrid(options: VibeFilters.moodOptions, selection: $model.filters.moods) }
                Section("Genres") { OptionGrid(options: VibeFilters.genreOptions, selection: $model.filters.genres) }
                Section("A few preferences") {
                    Picker("Runtime", selection: $model.filters.runtime) { ForEach(VibeFilters.runtimeOptions, id: \.self) { Text($0) } }
                    Picker("Release age", selection: $model.filters.releaseAge) { ForEach(VibeFilters.releaseOptions, id: \.self) { Text($0) } }
                    Picker("Animation", selection: $model.filters.animationPreference) { ForEach(VibeFilters.animationOptions, id: \.self) { Text($0) } }
                }
                Button("Create session", systemImage: "play.fill") { Task { await model.create(title: title, duration: duration) } }
                    .disabled(model.busy || title.count > 80)
            }.navigationTitle("Vibe check")
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() }.disabled(model.busy) } }
                .interactiveDismissDisabled(model.busy)
        }
    }
}

private struct OptionGrid: View {
    let options: [String]
    @Binding var selection: [String]
    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 130))], alignment: .leading) {
            ForEach(options, id: \.self) { option in
                Button {
                    if selection.contains(option) { selection.removeAll { $0 == option } } else { selection.append(option) }
                } label: {
                    Label(option, systemImage: selection.contains(option) ? "checkmark.circle.fill" : "circle")
                        .font(.subheadline).frame(maxWidth: .infinity, alignment: .leading).padding(.vertical, 5)
                }.buttonStyle(.borderless).accessibilityAddTraits(selection.contains(option) ? .isSelected : [])
            }
        }
    }
}

private struct RoundView: View {
    @Bindable var model: AppModel
    @State private var details: Movie?
    @State private var confirmEnd = false
    var body: some View {
        NavigationStack {
            ScrollView {
                if let room = model.session {
                    VStack(spacing: 18) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(room.code).font(.headline.monospaced())
                                Text("\(model.participantCount) in this round").font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            TimelineView(.periodic(from: .now, by: 1)) { context in
                                let seconds = room.remainingSeconds(at: context.date)
                                Text(String(format: "%d:%02d", seconds / 60, seconds % 60)).font(.title2.monospacedDigit().bold())
                            }
                            if !model.isDemo { ShareLink(item: "Join my VibeMatch movie night with code \(room.code)") { Image(systemName: "square.and.arrow.up") }.accessibilityLabel("Share session code") }
                        }
                        TimelineView(.periodic(from: .now, by: 1)) { context in
                            if room.remainingSeconds(at: context.date) == 0 {
                                ContentUnavailableView("That’s a wrap", systemImage: "checkmark.circle", description: Text("See what you have in common."))
                                Button("See matches") { model.tab = 2 }
                            } else if let movie = model.movies.first {
                                MovieCard(movie: movie).onTapGesture { details = movie }.accessibilityAddTraits(.isButton)
                                    .gesture(DragGesture(minimumDistance: 30).onEnded { value in
                                        guard abs(value.translation.width) > 80, abs(value.translation.width) > abs(value.translation.height), !model.busy else { return }
                                        Task { await model.swipe(value.translation.width > 0 ? "like" : "skip") }
                                    })
                                Button("Movie details", systemImage: "info.circle") { details = movie }
                                HStack(spacing: 24) {
                                    Button("Skip", systemImage: "xmark") { Task { await model.swipe("skip") } }.buttonStyle(.bordered)
                                    Button("Like", systemImage: "heart.fill") { Task { await model.swipe("like") } }.buttonStyle(.borderedProminent)
                                }.controlSize(.large).disabled(model.busy)
                            } else if model.loadingDeck {
                                ProgressView("Finding more movies…")
                                    .frame(maxWidth: .infinity).padding(.vertical, 80)
                            } else {
                                ContentUnavailableView("You’ve reached the end", systemImage: "rectangle.stack", description: Text("Refresh for more titles or check your matches."))
                                Button("Refresh deck") { Task { await model.refresh() } }.disabled(model.isDemo || model.busy)
                                Button("See matches") { model.tab = 2 }
                            }
                        }
                        Button(room.saved ? "Remove from saved sessions" : "Save this session", systemImage: room.saved ? "bookmark.fill" : "bookmark") { Task { await model.saveSession() } }.disabled(model.busy)
                        if room.isHost && room.remainingSeconds() > 0 {
                            Button("End round for everyone", role: .destructive) { confirmEnd = true }.font(.footnote).disabled(model.busy)
                        }
                    }.padding(20).frame(maxWidth: 540)
                } else {
                    ContentUnavailableView("Your next movie starts here", systemImage: "popcorn", description: Text("Start or join a session from Home."))
                    Button("Start a movie night") { model.showSetup = true }
                }
            }.frame(maxWidth: .infinity).navigationTitle(model.session?.title ?? "Swipe").navigationBarTitleDisplayMode(.inline)
                .refreshable { await model.refresh() }
                .sheet(item: $details) { MovieDetailView(movie: $0) }
                .confirmationDialog("End the round for everyone?", isPresented: $confirmEnd) {
                    Button("End round", role: .destructive) { Task { await model.endRound() } }
                }
        }
    }
}

private struct MovieCard: View {
    let movie: Movie
    var body: some View {
        ZStack(alignment: .bottomLeading) {
            AsyncImage(url: movie.posterUrl.flatMap(URL.init(string:))) { phase in
                if let image = phase.image { image.resizable().scaledToFill() }
                else { LinearGradient(colors: [.indigo, .black, .brown], startPoint: .topLeading, endPoint: .bottomTrailing).overlay { Image(systemName: "film").font(.system(size: 64)).foregroundStyle(.white.opacity(0.25)) } }
            }
            LinearGradient(colors: [.clear, .black.opacity(0.95)], startPoint: .center, endPoint: .bottom)
            VStack(alignment: .leading, spacing: 8) {
                Text(movie.genres.joined(separator: " · ")).font(.caption.weight(.semibold))
                Text(movie.title).font(.largeTitle.bold())
                Text("\(movie.year) · \(movie.runtimeMinutes > 0 ? "\(movie.runtimeMinutes) min" : "Runtime unavailable") · ★ \(movie.rating, specifier: "%.1f")").font(.subheadline)
            }.foregroundStyle(.white).padding(22)
        }.frame(height: 430).clipped().clipShape(RoundedRectangle(cornerRadius: 24))
    }
}

private struct MovieDetailView: View {
    let movie: Movie
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            List {
                MovieCard(movie: movie).listRowInsets(EdgeInsets())
                Section("The story") { Text(movie.overview) }
                Section("Where to watch · US") {
                    if movie.providers.isEmpty { Text("Availability isn’t listed yet.").foregroundStyle(.secondary) }
                    ForEach(Array(movie.providers.enumerated()), id: \.offset) { _, provider in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(provider.name) · \(provider.type.capitalized)")
                            Text("Checked \(provider.lastCheckedAt.prefix(10))").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
                Text("Movie data: TMDB. Watch availability: JustWatch. This product uses the TMDB API but is not endorsed or certified by TMDB.")
                    .font(.caption).foregroundStyle(.secondary)
            }.navigationTitle(movie.title).navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
    }
}

private struct MatchesView: View {
    @Bindable var model: AppModel
    @State private var details: Movie?
    var body: some View {
        NavigationStack {
            List {
                if let room = model.session {
                    Section {
                        Text(room.title).font(.headline)
                        Text(room.code).font(.caption.monospaced()).foregroundStyle(.secondary)
                        Button(room.saved ? "Session saved" : "Save this session", systemImage: "bookmark") { Task { await model.saveSession() } }.disabled(model.busy)
                        Button("Refresh matches", systemImage: "arrow.clockwise") { Task { await model.refresh(includeMovies: false) } }.disabled(model.busy || model.isDemo)
                    }
                }
                if model.matches.isEmpty {
                    ContentUnavailableView("Still finding your overlap", systemImage: "heart", description: Text("Like a few movies. Shared likes will appear here as your partner swipes."))
                }
                ForEach(model.matches) { match in
                    Button { details = match.movie } label: {
                        VStack(alignment: .leading, spacing: 8) {
                            Label(match.label, systemImage: match.kind == "perfect" ? "heart.fill" : "sparkles").font(.caption.bold()).foregroundStyle(.tint)
                            Text(match.movie.title).font(.title3.bold()).foregroundStyle(.primary)
                            Text(match.reason).font(.subheadline).foregroundStyle(.secondary)
                        }.padding(.vertical, 8)
                    }
                }
            }.navigationTitle("Your matches").refreshable { await model.refresh(includeMovies: false) }
                .sheet(item: $details) { MovieDetailView(movie: $0) }
        }
    }
}

private struct ProfileView: View {
    @Bindable var model: AppModel
    var body: some View {
        NavigationStack {
            List {
                Section("Your account") {
                    Label(model.profile?.displayName ?? "Movie matcher", systemImage: "person.crop.circle")
                    Text(model.profile?.email ?? "").foregroundStyle(.secondary)
                    Button(model.isDemo ? "Leave demo" : "Sign out", role: .destructive) { Task { await model.signOut() } }.disabled(model.busy)
                }
                Section("VibeMatch") {
                    Text("Movie nights, together.\nMovies and US watch availability.")
                    if let url = model.websiteURL { Link("Open VibeMatch on the web", destination: url) }
                    Text("Movie data: TMDB. Watch availability: JustWatch. This product uses the TMDB API but is not endorsed or certified by TMDB.").font(.caption).foregroundStyle(.secondary)
                }
            }.navigationTitle("Profile")
        }
    }
}
