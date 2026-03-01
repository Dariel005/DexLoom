import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DexLoom preview";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

function chipStyle(background: string, color: string) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 18px",
    borderRadius: 999,
    border: "2px solid rgba(0,0,0,0.15)",
    background,
    color,
    fontSize: 24,
    fontWeight: 700 as const,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const
  };
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 28,
          background:
            "linear-gradient(160deg, #ef5c55 0%, #da3a39 28%, #ba2223 100%)",
          color: "#111",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            borderRadius: 36,
            border: "4px solid #7d1110",
            padding: 26,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.08))"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              padding: "18px 22px",
              borderRadius: 24,
              border: "2px solid rgba(82, 18, 17, 0.5)",
              background: "rgba(0,0,0,0.14)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 999, background: "#33d17a" }} />
              <div style={{ width: 14, height: 14, borderRadius: 999, background: "#52dcc6" }} />
              <div style={{ width: 14, height: 14, borderRadius: 999, background: "#f4d64e" }} />
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 36,
                fontWeight: 800,
                color: "#fff5ee",
                letterSpacing: "0.12em",
                textTransform: "uppercase"
              }}
            >
              DexLoom
            </div>
            <div
              style={{
                display: "flex",
                width: 58,
                height: 58,
                borderRadius: 18,
                border: "2px solid rgba(0,0,0,0.65)",
                background:
                  "radial-gradient(circle at 35% 35%, #7fd4ff 0%, #3f6b91 35%, #191f22 100%)"
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              marginTop: 24,
              gap: 22
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1.1,
                borderRadius: 28,
                border: "2px solid rgba(36, 82, 35, 0.62)",
                padding: 24,
                background:
                  "linear-gradient(180deg, rgba(145, 214, 103, 0.96), rgba(97, 160, 74, 0.96))"
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: "18px 22px",
                  borderRadius: 26,
                  border: "2px solid rgba(89, 136, 173, 0.42)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(240,246,248,0.9))",
                  color: "#5f676d",
                  fontSize: 32
                }}
              >
                Search Pokemon, cards, maps, games...
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  marginTop: 22
                }}
              >
                <div style={chipStyle("#eef2eb", "#37474f")}>Pokedex</div>
                <div style={chipStyle("#eef2eb", "#536a49")}>Maps</div>
                <div style={chipStyle("#eef2eb", "#56617c")}>Cards</div>
                <div style={chipStyle("#f7e1f0", "#9f3a77")}>ROM Hacks</div>
                <div style={chipStyle("#eef2eb", "#5e6f34")}>Games</div>
                <div style={chipStyle("#e0f3f7", "#3f7098")}>Pokemon GO</div>
                <div style={chipStyle("#efe5ff", "#764fa6")}>Mega Evolutions</div>
                <div style={chipStyle("#e5f4e6", "#38764d")}>Trainer Social</div>
              </div>

              <div
                style={{
                  display: "flex",
                  marginTop: 22,
                  gap: 16
                }}
              >
                {[
                  { id: "#001", name: "Bulbasaur", typeA: "Grass", typeB: "Poison", color: "#67b85d" },
                  { id: "#006", name: "Charizard", typeA: "Fire", typeB: "Flying", color: "#f0882f" },
                  { id: "#025", name: "Pikachu", typeA: "Electric", typeB: "Dex", color: "#d6b539" }
                ].map((card) => (
                  <div
                    key={card.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      borderRadius: 22,
                      border: "2px solid rgba(39, 71, 34, 0.18)",
                      padding: 16,
                      background:
                        "linear-gradient(165deg, rgba(248,250,248,0.96), rgba(234,240,233,0.92))"
                    }}
                  >
                    <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#6b6b6b" }}>
                      {card.id}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        marginTop: 6,
                        fontSize: 28,
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      {card.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: 1,
                        minHeight: 120,
                        marginTop: 14,
                        borderRadius: 18,
                        background:
                          "radial-gradient(circle at 50% 40%, rgba(205, 229, 194, 0.95), rgba(225, 233, 220, 0.25))",
                        fontSize: 52
                      }}
                    >
                      {card.name === "Bulbasaur" ? "🌿" : card.name === "Charizard" ? "🔥" : "⚡"}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <div style={chipStyle(card.color, "#ffffff")}>{card.typeA}</div>
                      <div style={chipStyle("#9c50cb", "#ffffff")}>{card.typeB}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: 336,
                gap: 16
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 28,
                  border: "2px solid rgba(59, 83, 99, 0.24)",
                  padding: 22,
                  background:
                    "linear-gradient(165deg, rgba(231,236,241,0.96), rgba(201,208,216,0.94))"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#47505a"
                  }}
                >
                  DexLoom Hub
                </div>
                <div
                  style={{
                    display: "flex",
                    marginTop: 14,
                    fontSize: 22,
                    lineHeight: 1.45,
                    color: "#21252b"
                  }}
                >
                  Interactive Pokemon encyclopedia with Pokedex entries, TCG cards, maps, games,
                  mega evolutions, trainer profiles, social features and advanced tools.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  borderRadius: 28,
                  border: "2px solid rgba(59, 83, 99, 0.24)",
                  padding: 22,
                  background:
                    "linear-gradient(165deg, rgba(231,236,241,0.96), rgba(201,208,216,0.94))"
                }}
              >
                {[
                  "Pokemon entries with stats, evolutions and variants",
                  "Cards, maps, games and Pokemon GO data",
                  "Mega Evolutions, favorites, social and admin"
                ].map((line) => (
                  <div
                    key={line}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 22,
                      color: "#24282f"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: "#d93c40"
                      }}
                    />
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
