// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "VibeMatchCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "VibeMatchCore", targets: ["VibeMatchCore"])],
    targets: [
        .target(name: "VibeMatchCore"),
        .executableTarget(name: "CoreVerification", dependencies: ["VibeMatchCore"], path: "Tests/VibeMatchCoreTests")
    ]
)
