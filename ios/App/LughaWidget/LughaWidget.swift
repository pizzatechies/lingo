import WidgetKit
import SwiftUI

// MARK: - Shared data (written by the app through WidgetBridgePlugin)

let appGroup = "group.ke.lugha.app"

struct WordItem: Codable { let date: String; let t: String; let gloss: String; let emoji: String? }
struct ProverbItem: Codable { let date: String; let t: String; let meaning: String }
struct WidgetPayload: Codable {
    let streak: Int
    let practisedToday: Bool
    let xpToday: Int
    let goal: Int
    let course: String
    let updated: String
    let words: [WordItem]
    let proverbs: [ProverbItem]
}

func loadPayload() -> WidgetPayload? {
    guard let data = UserDefaults(suiteName: appGroup)?.data(forKey: "widgetData") else { return nil }
    return try? JSONDecoder().decode(WidgetPayload.self, from: data)
}

func dayKey(_ date: Date) -> String {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = .current
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: date)
}

/// Used before the app has shared any data (fresh install), so widgets are useful from day one.
let builtInWords: [(String, String, String)] = [
    ("jambo", "hello", "👋"), ("asante", "thank you", "🙏"), ("maji", "water", "💧"), ("rafiki", "friend", "🧑‍🤝‍🧑"),
    ("chakula", "food", "🍲"), ("simba", "lion", "🦁"), ("nyumba", "house", "🏠"), ("safari", "journey", "🧳"),
    ("twiga", "giraffe", "🦒"), ("karibu", "welcome", "🤗"), ("chai", "tea", "🫖"), ("jua", "sun", "☀️"),
]
let builtInProverbs: [(String, String)] = [
    ("Haba na haba hujaza kibaba.", "Little by little fills the measure."),
    ("Pole pole ndio mwendo.", "Slowly, slowly is the way to go."),
    ("Penye nia pana njia.", "Where there is a will, there is a way."),
    ("Umoja ni nguvu.", "Unity is strength."),
    ("Haraka haraka haina baraka.", "Hurry, hurry has no blessing."),
    ("Akili ni mali.", "Intelligence is wealth."),
    ("Mwenda pole hajikwai.", "One who goes slowly does not stumble."),
]

// MARK: - Timeline

struct LughaEntry: TimelineEntry {
    let date: Date
    let hasData: Bool
    let streak: Int
    let practisedToday: Bool
    let xpToday: Int
    let goal: Int
    let course: String
    let word: String
    let gloss: String
    let emoji: String
    let proverb: String
    let meaning: String

    var progress: Double { goal > 0 ? min(1, Double(xpToday) / Double(goal)) : 0 }
    var isEvening: Bool { Calendar.current.component(.hour, from: date) >= 18 }
}

func makeEntry(for date: Date, payload: WidgetPayload?) -> LughaEntry {
    let key = dayKey(date)
    let dayIndex = Int(date.timeIntervalSince1970 / 86400)
    let fbWord = builtInWords[abs(dayIndex) % builtInWords.count]
    let fbProverb = builtInProverbs[abs(dayIndex) % builtInProverbs.count]
    guard let p = payload else {
        return LughaEntry(date: date, hasData: false, streak: 0, practisedToday: false, xpToday: 0, goal: 20, course: "Kiswahili",
                          word: fbWord.0, gloss: fbWord.1, emoji: fbWord.2, proverb: fbProverb.0, meaning: fbProverb.1)
    }
    let today = p.updated == key
    let word = p.words.first(where: { $0.date == key }) ?? p.words.last
    let proverb = p.proverbs.first(where: { $0.date == key }) ?? p.proverbs.last
    return LughaEntry(
        date: date, hasData: true, streak: p.streak,
        practisedToday: today && p.practisedToday, xpToday: today ? p.xpToday : 0, goal: p.goal, course: p.course,
        word: word?.t ?? fbWord.0, gloss: word?.gloss ?? fbWord.1, emoji: word?.emoji ?? fbWord.2,
        proverb: proverb?.t ?? fbProverb.0, meaning: proverb?.meaning ?? fbProverb.1)
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> LughaEntry { makeEntry(for: Date(), payload: nil) }

    func getSnapshot(in context: Context, completion: @escaping (LughaEntry) -> Void) {
        completion(makeEntry(for: Date(), payload: loadPayload()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LughaEntry>) -> Void) {
        let payload = loadPayload()
        let cal = Calendar.current
        let now = Date()
        var dates = [now]
        // Evening nudge if today's practice is still missing.
        if let evening = cal.date(bySettingHour: 18, minute: 0, second: 0, of: now), evening > now { dates.append(evening) }
        var day = cal.startOfDay(for: now)
        for _ in 0..<6 {
            day = cal.date(byAdding: .day, value: 1, to: day)!
            dates.append(day)
            if let evening = cal.date(bySettingHour: 18, minute: 0, second: 0, of: day) { dates.append(evening) }
        }
        completion(Timeline(entries: dates.map { makeEntry(for: $0, payload: payload) }, policy: .atEnd))
    }
}

// MARK: - Style

extension Color {
    static let terra = Color(red: 0.851, green: 0.329, blue: 0.118)
    static let terraDeep = Color(red: 0.69, green: 0.25, blue: 0.06)
    static let cream = Color(red: 1.0, green: 0.973, blue: 0.941)
    static let savanna = Color(red: 0.91, green: 0.64, blue: 0.09)
    static let earth = Color(red: 0.169, green: 0.114, blue: 0.078)
    static let earthMuted = Color(red: 0.478, green: 0.392, blue: 0.333)
}

extension View {
    @ViewBuilder func widgetBackground<S: ShapeStyle>(_ style: S) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(style, for: .widget)
        } else {
            background(style)
        }
    }
}

/// A row of beads — the app's beadwork motif.
struct BeadRow: View {
    let colors: [Color] = [Color(red: 0.78, green: 0.06, blue: 0.18), .white, Color(red: 0.11, green: 0.37, blue: 0.66), Color.savanna, Color(red: 0.12, green: 0.48, blue: 0.27)]
    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<10, id: \.self) { i in Circle().fill(colors[i % colors.count]).frame(width: 6, height: 6) }
        }
    }
}

struct GoalRing: View {
    let progress: Double
    let streak: Int
    var body: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.25), lineWidth: 8)
            Circle().trim(from: 0, to: progress)
                .stroke(Color.savanna, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 0) {
                Text("🔥").font(.system(size: 18))
                Text("\(streak)").font(.system(size: 26, weight: .black, design: .rounded)).foregroundColor(.white)
                    .minimumScaleFactor(0.5).lineLimit(1)
            }
        }
    }
}

func nudge(_ e: LughaEntry) -> String {
    if !e.hasData { return "Open Lugha Zetu to start" }
    if e.practisedToday { return e.xpToday >= e.goal ? "Goal reached · hongera!" : "\(e.xpToday)/\(e.goal) XP today" }
    return e.isEvening ? "Your streak is waiting 🔥" : "Practise today"
}

// MARK: - Streak widget

struct StreakView: View {
    @Environment(\.widgetFamily) var family
    let entry: LughaEntry

    var body: some View {
        switch family {
        case .accessoryCircular:
            Gauge(value: entry.progress) { Text("🔥") } currentValueLabel: { Text("\(entry.streak)") }
                .gaugeStyle(.accessoryCircularCapacity)
                .widgetBackground(.clear)
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 1) {
                Text("🔥 \(entry.streak)-day streak").font(.headline).widgetAccentable()
                Text(nudge(entry)).font(.caption)
                Text("\(entry.word) · \(entry.gloss)").font(.caption2).foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .widgetBackground(.clear)
        case .accessoryInline:
            Text("🔥 \(entry.streak) · \(entry.word) = \(entry.gloss)")
                .widgetBackground(.clear)
        case .systemMedium:
            HStack(spacing: 14) {
                GoalRing(progress: entry.progress, streak: entry.streak).frame(width: 96, height: 96)
                VStack(alignment: .leading, spacing: 4) {
                    Text("LUGHA ZETU · \(entry.course.uppercased())").font(.system(size: 10, weight: .bold)).foregroundColor(.white.opacity(0.8))
                    Text(entry.practisedToday ? "Streak safe today" : "Keep your streak").font(.system(size: 17, weight: .heavy)).foregroundColor(.white)
                    Text(nudge(entry)).font(.system(size: 13)).foregroundColor(.white.opacity(0.9))
                    Spacer(minLength: 2)
                    HStack(spacing: 6) {
                        Text(entry.emoji)
                        Text(entry.word).font(.system(size: 14, weight: .bold)).foregroundColor(.white)
                        Text(entry.gloss).font(.system(size: 13)).foregroundColor(.white.opacity(0.85)).lineLimit(1)
                    }
                    BeadRow()
                }
                Spacer(minLength: 0)
            }
            .widgetBackground(LinearGradient(colors: [.terra, .terraDeep], startPoint: .topLeading, endPoint: .bottomTrailing))
        default:
            VStack(spacing: 6) {
                GoalRing(progress: entry.progress, streak: entry.streak).frame(width: 84, height: 84)
                Text(nudge(entry)).font(.system(size: 12, weight: .semibold)).foregroundColor(.white)
                    .multilineTextAlignment(.center).lineLimit(2).minimumScaleFactor(0.8)
            }
            .widgetBackground(LinearGradient(colors: [.terra, .terraDeep], startPoint: .topLeading, endPoint: .bottomTrailing))
        }
    }
}

struct StreakWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "LughaStreak", provider: Provider()) { entry in
            StreakView(entry: entry)
        }
        .configurationDisplayName("Streak & goal")
        .description("Your streak and today's progress in Lugha Zetu.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

// MARK: - Word of the day widget

struct WordView: View {
    @Environment(\.widgetFamily) var family
    let entry: LughaEntry

    var body: some View {
        if family == .systemMedium {
            HStack(alignment: .top, spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("NENO LA LEO").font(.system(size: 10, weight: .bold)).foregroundColor(.terra)
                    Text(entry.emoji).font(.system(size: 34))
                    Text(entry.word).font(.system(size: 22, weight: .black, design: .rounded)).foregroundColor(.earth)
                        .minimumScaleFactor(0.6).lineLimit(1)
                    Text(entry.gloss).font(.system(size: 14)).foregroundColor(.earthMuted).lineLimit(2)
                }
                .frame(width: 120, alignment: .leading)
                Rectangle().fill(Color.terra.opacity(0.25)).frame(width: 1)
                VStack(alignment: .leading, spacing: 4) {
                    Text("METHALI").font(.system(size: 10, weight: .bold)).foregroundColor(.terra)
                    Text(entry.proverb).font(.system(size: 14, weight: .bold)).foregroundColor(.earth).minimumScaleFactor(0.8)
                    Text(entry.meaning).font(.system(size: 12)).foregroundColor(.earthMuted).minimumScaleFactor(0.8)
                    Spacer(minLength: 0)
                    BeadRow()
                }
            }
            .widgetBackground(Color.cream)
        } else {
            VStack(alignment: .leading, spacing: 3) {
                Text("NENO LA LEO").font(.system(size: 10, weight: .bold)).foregroundColor(.terra)
                Spacer(minLength: 0)
                Text(entry.emoji).font(.system(size: 32))
                Text(entry.word).font(.system(size: 22, weight: .black, design: .rounded)).foregroundColor(.earth)
                    .minimumScaleFactor(0.6).lineLimit(1)
                Text(entry.gloss).font(.system(size: 13)).foregroundColor(.earthMuted).lineLimit(2)
                BeadRow().padding(.top, 2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .widgetBackground(Color.cream)
        }
    }
}

struct WordWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "LughaWord", provider: Provider()) { entry in
            WordView(entry: entry)
        }
        .configurationDisplayName("Neno la Leo")
        .description("A new word every day, plus a methali (proverb).")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Bundle

@main
struct LughaWidgets: WidgetBundle {
    var body: some Widget {
        StreakWidget()
        WordWidget()
    }
}
