package com.vibematch.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import coil3.compose.AsyncImage
import kotlinx.coroutines.delay

private val Gold = Color(0xFFF0B44C)
private val Background = Color(0xFF090B11)
private val Cream = Color(0xFFFFF8EE)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaterialTheme(colorScheme = darkColorScheme(primary = Gold, onPrimary = Background,
                background = Background, surface = Color(0xFF141B27), onSurface = Cream, onBackground = Cream)) {
                VibeMatchRoot()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VibeMatchRoot(model: AppViewModel = viewModel()) {
    val state = model.state
    var details by remember { mutableStateOf<Movie?>(null) }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    LaunchedEffect(state.session?.id, state.demo) {
        if (state.session != null && !state.demo) lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            while (true) { delay(10_000); model.refresh(false, quiet = true) }
        }
    }
    BackHandler(state.profile != null && state.tab != 0) { model.tab(0) }
    Scaffold(
        topBar = { if (state.profile != null) TopAppBar(title = { Text("VibeMatch", fontWeight = FontWeight.Bold) }) },
        bottomBar = {
            if (state.profile != null) NavigationBar {
                val icons = listOf(Icons.Default.Home, Icons.Default.Style, Icons.Default.FavoriteBorder, Icons.Default.Person)
                listOf("Home", "Swipe", "Matches", "Profile").forEachIndexed { index, label ->
                    NavigationBarItem(selected = state.tab == index, onClick = { model.tab(index) },
                        icon = { Icon(icons[index], contentDescription = label) }, label = { Text(label) })
                }
            }
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).imePadding()) {
            if (state.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
            if (state.demo) Text("DEMO · simulated partner · changes stay on this device",
                Modifier.fillMaxWidth().padding(10.dp), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 22.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp)) {
                if (state.profile == null) SignInScreen(model)
                else when (state.tab) {
                    0 -> HomeScreen(model)
                    1 -> RoundScreen(model) { details = it }
                    2 -> MatchesScreen(model) { details = it }
                    else -> ProfileScreen(model)
                }
            }
        }
    }
    if (state.setup) ModalBottomSheet(onDismissRequest = { model.setup(false) }) {
        SetupScreen(model)
    }
    details?.let { movie -> ModalBottomSheet(onDismissRequest = { details = null }) { MovieDetails(movie) } }
    state.error?.let { error -> AlertDialog(onDismissRequest = model::clearError, title = { Text("Couldn’t finish that") },
        text = { Text(error) }, confirmButton = { TextButton(onClick = model::clearError) { Text("OK") } }) }
}

@Composable
private fun SignInScreen(model: AppViewModel) {
    var email by rememberSaveable { mutableStateOf("") }
    // Passwords are intentionally excluded from saved instance state.
    var password by remember { mutableStateOf("") }
    val uri = LocalUriHandler.current
    Spacer(Modifier.height(28.dp))
    Icon(Icons.Default.AutoAwesome, null, Modifier.size(58.dp), tint = Gold)
    Text("VibeMatch", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
    Text("Less scrolling.\nMore movie nights.", fontSize = 38.sp, lineHeight = 43.sp, fontWeight = FontWeight.Bold)
    Text("Find something you both want to watch.", color = MaterialTheme.colorScheme.onSurfaceVariant)
    OutlinedTextField(email, { email = it }, label = { Text("Email") }, singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), modifier = Modifier.fillMaxWidth())
    OutlinedTextField(password, { password = it }, label = { Text("Password") }, singleLine = true,
        visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password), modifier = Modifier.fillMaxWidth())
    Button(onClick = { model.signIn(email, password); password = "" }, enabled = !model.state.busy && model.configured && email.isNotBlank() && password.isNotEmpty(), modifier = Modifier.fillMaxWidth()) { Text("Sign in") }
    if (model.configured) Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        TextButton(onClick = { uri.openUri(BuildConfig.SERVER_URL.trimEnd('/') + "/signup") }) { Text("Create account") }
        TextButton(onClick = { uri.openUri(BuildConfig.SERVER_URL.trimEnd('/') + "/forgot-password") }) { Text("Forgot password?") }
    } else Text("Live sign-in will be available once a server is configured.", style = MaterialTheme.typography.bodySmall)
    HorizontalDivider()
    OutlinedButton(onClick = model::demo, enabled = !model.state.busy, modifier = Modifier.fillMaxWidth()) { Text("Explore the demo") }
}

@Composable
private fun HomeScreen(model: AppViewModel) {
    val state = model.state
    var code by rememberSaveable { mutableStateOf("") }
    Text("Hey, ${state.profile?.displayName}.", color = MaterialTheme.colorScheme.onSurfaceVariant)
    Text("What’s the vibe\ntonight?", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
    Text("Pick a mood. Invite your person. Find your movie.")
    Button(onClick = { model.setup(true) }, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Start a movie night") }
    state.session?.let { room ->
        ElevatedCard(onClick = { model.tab(if (room.remainingSeconds() > 0) 1 else 2) }, modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Current round", style = MaterialTheme.typography.labelMedium, color = Gold)
                Text(room.title, fontWeight = FontWeight.Bold)
                Text(room.code)
            }
        }
    }
    if (!state.demo) {
        Text("Join your person", style = MaterialTheme.typography.titleMedium)
        OutlinedTextField(code, { code = it }, label = { Text("VIBE-ABCD") }, singleLine = true,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters), modifier = Modifier.fillMaxWidth())
        OutlinedButton(onClick = { model.join(code) }, enabled = code.isNotBlank() && !state.busy) { Text("Join session") }
    }
    Text("Saved sessions", style = MaterialTheme.typography.titleLarge)
    if (state.history.isEmpty()) Text("Save a round to keep it here.", color = MaterialTheme.colorScheme.onSurfaceVariant)
    state.history.forEach { room ->
        OutlinedCard(onClick = { model.open(room) }, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(18.dp)) { Text(room.title, fontWeight = FontWeight.Bold); Text(room.code) }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Chips(options: List<String>, selected: List<String>, onChange: (List<String>) -> Unit) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        options.forEach { option -> FilterChip(selected = option in selected,
            onClick = { onChange(if (option in selected) selected - option else selected + option) }, label = { Text(option) }) }
    }
}

@Composable
private fun SetupScreen(model: AppViewModel) {
    var title by rememberSaveable { mutableStateOf("Movie night") }
    var duration by rememberSaveable { mutableIntStateOf(180) }
    val state = model.state
    val filters = state.filters
    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).imePadding().padding(24.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("Vibe check", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
        OutlinedTextField(title, { title = it }, label = { Text("Session title") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Choice("Round length", listOf("1 minute", "3 minutes", "5 minutes", "10 minutes", "15 minutes"), "${duration / 60} ${if (duration == 60) "minute" else "minutes"}") {
            duration = it.substringBefore(' ').toInt() * 60
        }
        Text("The timer starts when you create the room.", style = MaterialTheme.typography.bodySmall)
        Text("Mood", fontWeight = FontWeight.Bold)
        Chips(VibeFilters.moods, filters.moods) { model.filters(filters.copy(moods = it)) }
        Text("Genres", fontWeight = FontWeight.Bold)
        Chips(VibeFilters.genres, filters.genres) { model.filters(filters.copy(genres = it)) }
        Choice("Runtime", VibeFilters.runtimes, filters.runtime) { model.filters(filters.copy(runtime = it)) }
        Choice("Release age", VibeFilters.releases, filters.releaseAge) { model.filters(filters.copy(releaseAge = it)) }
        Choice("Animation", VibeFilters.animations, filters.animationPreference) { model.filters(filters.copy(animationPreference = it)) }
        Button(onClick = { model.create(title, duration) }, enabled = !state.busy && title.length <= 80, modifier = Modifier.fillMaxWidth()) { Text("Create session") }
    }
}

@Composable
private fun Choice(label: String, options: List<String>, selected: String, choose: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        OutlinedButton(onClick = { expanded = true }, modifier = Modifier.fillMaxWidth()) { Text("$label: $selected") }
        DropdownMenu(expanded, { expanded = false }) {
            options.forEach { option -> DropdownMenuItem(text = { Text(option) }, onClick = { choose(option); expanded = false }) }
        }
    }
}

@Composable
private fun RoundScreen(model: AppViewModel, details: (Movie) -> Unit) {
    val state = model.state
    val room = state.session
    val context = LocalContext.current
    var remaining by remember(room) { mutableIntStateOf(room?.remainingSeconds() ?: 0) }
    var confirmEnd by remember { mutableStateOf(false) }
    LaunchedEffect(room) { while (true) { remaining = room?.remainingSeconds() ?: 0; delay(1000) } }
    if (room == null) {
        EmptyMessage("Your next movie starts here", "Start or join a session from Home.")
        Button(onClick = { model.setup(true) }) { Text("Start a movie night") }
        return
    }
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) { Text(room.code, fontWeight = FontWeight.Bold); Text("${state.participantCount} in this round", style = MaterialTheme.typography.bodySmall) }
        Text("%d:%02d".format(remaining / 60, remaining % 60), style = MaterialTheme.typography.headlineSmall, color = Gold)
        if (!state.demo) IconButton(onClick = {
            val intent = Intent(Intent.ACTION_SEND).apply { type = "text/plain"; putExtra(Intent.EXTRA_TEXT, "Join my VibeMatch movie night with code ${room.code}") }
            context.startActivity(Intent.createChooser(intent, "Share session code"))
        }) { Icon(Icons.Default.Share, contentDescription = "Share session code") }
    }
    if (remaining == 0) {
        EmptyMessage("That’s a wrap", "See what you have in common.")
        Button(onClick = { model.tab(2) }) { Text("See matches") }
    } else if (state.movies.isNotEmpty()) {
        val movie = state.movies.first()
        Box(Modifier.pointerInput(movie.id, state.busy) {
            var horizontal = 0f
            detectHorizontalDragGestures(
                onDragStart = { horizontal = 0f },
                onDragCancel = { horizontal = 0f },
                onDragEnd = {
                    if (!state.busy && kotlin.math.abs(horizontal) > 80.dp.toPx()) model.swipe(if (horizontal > 0) "like" else "skip")
                },
                onHorizontalDrag = { _, amount -> horizontal += amount },
            )
        }) { MovieCard(movie) }
        TextButton(onClick = { details(movie) }) { Text("Movie details") }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(18.dp)) {
            OutlinedButton(onClick = { model.swipe("skip") }, enabled = !state.busy, modifier = Modifier.weight(1f).heightIn(min = 52.dp)) { Text("Skip") }
            Button(onClick = { model.swipe("like") }, enabled = !state.busy, modifier = Modifier.weight(1f).heightIn(min = 52.dp)) { Text("♥ Like") }
        }
    } else {
        EmptyMessage("You’ve reached the end", "Refresh for more titles or check your matches.")
        OutlinedButton(onClick = { model.refresh() }, enabled = !state.demo && !state.busy) { Text("Refresh deck") }
        Button(onClick = { model.tab(2) }) { Text("See matches") }
    }
    TextButton(onClick = model::save, enabled = !state.busy) { Text(if (room.saved) "Remove from saved sessions" else "Save this session") }
    if (room.isHost && remaining > 0) TextButton(onClick = { confirmEnd = true }, enabled = !state.busy) { Text("End round for everyone", color = MaterialTheme.colorScheme.error) }
    if (confirmEnd) AlertDialog(onDismissRequest = { confirmEnd = false }, title = { Text("End the round for everyone?") },
        confirmButton = { TextButton(onClick = { confirmEnd = false; model.endRound() }) { Text("End round") } },
        dismissButton = { TextButton(onClick = { confirmEnd = false }) { Text("Keep swiping") } })
}

@Composable
private fun MovieCard(movie: Movie) {
    Box(Modifier.fillMaxWidth().height(420.dp).clip(RoundedCornerShape(24.dp))
        .background(Brush.verticalGradient(listOf(Color(0xFF3B356A), Color(0xFF101827), Color(0xFF775237))))) {
        Icon(Icons.Default.Movie, null, Modifier.size(72.dp).align(Alignment.Center), tint = Cream.copy(alpha = 0.25f))
        AsyncImage(model = movie.posterUrl, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
        Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.95f)))))
        Column(Modifier.align(Alignment.BottomStart).padding(22.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(movie.genres.joinToString(" · "), style = MaterialTheme.typography.labelMedium, color = Color.White)
            Text(movie.title, style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, color = Color.White)
            Text("${movie.year} · ${if (movie.runtimeMinutes > 0) "${movie.runtimeMinutes} min" else "Runtime unavailable"} · ★ ${"%.1f".format(movie.rating)}", color = Color.White)
        }
    }
}

@Composable
private fun MovieDetails(movie: Movie) {
    Column(Modifier.verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        MovieCard(movie)
        Text("The story", style = MaterialTheme.typography.titleLarge)
        Text(movie.overview)
        Text("Where to watch · US", style = MaterialTheme.typography.titleLarge)
        if (movie.providers.isEmpty()) Text("Availability isn’t listed yet.")
        movie.providers.forEach { provider ->
            Column {
                Text("${provider.name} · ${provider.type.replaceFirstChar { it.uppercase() }}")
                Text("Checked ${provider.lastCheckedAt.take(10)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Attribution()
    }
}

@Composable
private fun MatchesScreen(model: AppViewModel, details: (Movie) -> Unit) {
    val state = model.state
    Text("Your matches", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
    state.session?.let { room ->
        Text("${room.title} · ${room.code}")
        TextButton(onClick = model::save, enabled = !state.busy) { Text(if (room.saved) "Session saved" else "Save this session") }
        OutlinedButton(onClick = { model.refresh(false) }, enabled = !state.busy && !state.demo) { Text("Refresh matches") }
    }
    if (state.matches.isEmpty()) EmptyMessage("Still finding your overlap", "Like a few movies. Shared likes will appear here as your partner swipes.")
    state.matches.forEach { match ->
        ElevatedCard(onClick = { details(match.movie) }, modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(match.label, color = Gold, style = MaterialTheme.typography.labelMedium)
                Text(match.movie.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                Text(match.reason, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun ProfileScreen(model: AppViewModel) {
    val uri = LocalUriHandler.current
    Text("Profile", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
    Text(model.state.profile?.displayName.orEmpty(), style = MaterialTheme.typography.titleLarge)
    Text(model.state.profile?.email.orEmpty())
    OutlinedButton(onClick = model::signOut, enabled = !model.state.busy) { Text(if (model.state.demo) "Leave demo" else "Sign out") }
    HorizontalDivider()
    Text("Movie nights, together.\nMovies and US watch availability.")
    if (model.configured) TextButton(onClick = { uri.openUri(BuildConfig.SERVER_URL) }) { Text("Open VibeMatch on the web") }
    Attribution()
}

@Composable
private fun EmptyMessage(title: String, subtitle: String) {
    Column(Modifier.fillMaxWidth().padding(vertical = 26.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Icon(Icons.Default.LocalMovies, null, Modifier.size(44.dp), tint = Gold)
        Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun Attribution() {
    Text("Movie data: TMDB. Watch availability: JustWatch. This product uses the TMDB API but is not endorsed or certified by TMDB.",
        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
}
