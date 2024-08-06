if (process.platform !== "win32") {
  require("child_process").exec("npm install");
}
const d = require("ansi-colors");
console.log("" + d.yellow("Starting bot, this can take a while.."));
const e = require("fs");
const f = require("./package.json");
let g = "\n\n[" + new Date().toLocaleString() + "] [STARTING] Attempting to start the bot..\nNodeJS Version: " + process.version + "\nBot Version: " + f.version;
e.appendFile("./logs.txt", g, a => {
  if (a) {
    console.log(a);
  }
});
const h = Number(process.version.split(".")[0].replace("v", ""));
if (h < 18) {
  console.log("" + d.red("[ERROR] Drako Bot requires a NodeJS version of 18 or higher!\nYou can check your NodeJS by running the \"node -v\" command in your terminal."));
  console.log("" + d.blue("\n[INFO] To update Node.js, follow the instructions below for your operating system:"));
  console.log(d.green("- Windows:") + " Download and run the installer from " + d.cyan("https://nodejs.org/"));
  console.log(d.green("- Ubuntu/Debian:") + " Run the following commands in the Terminal:");
  console.log("" + d.cyan("  - sudo apt update"));
  console.log("" + d.cyan("  - sudo apt upgrade nodejs"));
  console.log(d.green("- CentOS:") + " Run the following commands in the Terminal:");
  console.log("" + d.cyan("  - sudo yum update"));
  console.log("" + d.cyan("  - sudo yum install -y nodejs"));
  let a = "\n\n[" + new Date().toLocaleString() + "] [ERROR] Drako Bot requires a NodeJS version of 18 or higher!";
  e.appendFile("./logs.txt", a, a => {
    if (a) {
      console.log(a);
    }
  });
  process.exit();
}
const {
  Collection: i,
  Client: j,
  GatewayIntentBits: k,
  Partials: l,
  EmbedBuilder: m,
  ActionRowBuilder: n,
  ButtonBuilder: o,
  ButtonStyle: p
} = require("discord.js");
const q = require("discord.js");
const r = require("discord-backup");
const s = require("axios");
const t = require("./models/inviteSchema");
const u = require("./models/UserData");
const v = require("./models/manager.js");
v().then(() => {}).catch(a => {
  console.error("Failed to connect to MongoDB: " + a.message);
});
const w = {
  intents: [k.Guilds, k.GuildMembers, k.GuildBans, k.GuildMessages, k.GuildMessageReactions, k.GuildEmojisAndStickers, k.GuildIntegrations, k.GuildWebhooks, k.GuildInvites, k.GuildVoiceStates, k.GuildPresences, k.GuildMessages, k.GuildMessageReactions, k.GuildMessageTyping, k.DirectMessages, k.DirectMessageReactions, k.DirectMessageTyping, k.MessageContent]
};
const x = new j(w);
x.invites = new Map();
x.once("ready", async () => {
  x.guilds.cache.forEach(async a => {
    try {
      const b = await a.invites.fetch();
      const c = new Map(b.map(a => [a.code, a.uses]));
      x.invites.set(a.id, c);
    } catch (b) {
      console.error("Failed to fetch invites or determine existing members for guild " + a.id + ": " + b);
    }
  });
});
x.on("inviteCreate", async a => {
  const b = await a.guild.invites.fetch();
  const c = new Map(b.map(a => [a.code, a.uses]));
  x.invites.set(a.guild.id, c);
});
x.on("inviteDelete", a => {
  const b = x.invites.get(a.guild.id);
  b.delete(a.code);
  x.invites.set(a.guild.id, b);
});
module.exports = x;
require("./utils.js");
require("./events/antiNuke")(x);
const y = require("js-yaml");
const z = y.load(e.readFileSync("./config.yml", "utf8"));
const A = y.load(e.readFileSync("././lang.yml", "utf8"));
const B = "./logs.txt";
const C = 300;
const {
  Player: D
} = require("discord-player");
const {
  YouTubeExtractor: E,
  SpotifyExtractor: F,
  SoundCloudExtractor: G,
  AppleMusicExtractor: H,
  VimeoExtractor: I,
  AttachmentExtractor: J,
  ReverbnationExtractor: K
} = require("@discord-player/extractor");
const L = new D(x);
L.extractors.unregisterAll();
L.extractors.register(E, {});
L.extractors.register(F, {});
L.extractors.register(G, {});
L.extractors.register(H, {});
function M(a, b = undefined) {
  if (b === undefined) b = {};
  if (!a) {
    return "​";
  }
  return Object.keys(b).reduce((a, c) => {
    const d = new RegExp("{" + c + "}", "gi");
    return a.replace(d, b[c] || "");
  }, a);
}
L.events.on("playerStart", (a, b) => {
  try {
    const c = N(b.extractor);
    const d = O(c);
    const e = {
      id: b.id,
      title: b?.title || "Track",
      description: b?.description || "None",
      author: c === "Spotify" || c === "Apple Music" ? "" + b?.author : "",
      url: b?.url || "None",
      thumbnail: b?.thumbnail || "None",
      duration: b?.duration || "00:00",
      durationMS: b?.durationMS || "0000",
      views: b?.views || "0",
      requestedByMention: b?.requestedBy || "Nobody",
      requestedByDisplayName: b?.requestedBy.globalName || "Nobody",
      playlistName: b?.playlist?.title || "None",
      playlistUrl: b?.playlist?.url || "None",
      playlistThumbnail: b?.playlist?.thumbnail || "None",
      platform: c || "Discord",
      platformEmoji: d || "https://imgur.com/csAsSqY",
      queueCount: a?.tracks.data.length || "0",
      queueDuration: a?.durationFormatted || "00:00"
    };
    const f = e;
    const g = z.MusicCommand.CurrentTrack;
    if (g.Enabled) {
      if (g && g.Type.toUpperCase() === "EMBED") {
        const b = new m();
        if (g.Embed.Color) {
          b.setColor(g.Embed.Color);
        }
        if (g.Embed.Title) {
          b.setTitle(M(g.Embed.Title, f));
        }
        if (g.Embed.Description) {
          b.setDescription(M(g.Embed.Description.replace(c !== "Spotify" && c !== "Apple Music" ? "-" : "", ""), f));
        }
        if (g.Embed.Fields) {
          g.Embed.Fields.forEach(a => {
            const c = M(a.Name, f);
            const d = M(a.Value, f);
            const e = {
              name: c,
              value: d,
              inline: a.Inline ?? false
            };
            b.addFields(e);
          });
        }
        if (g.Embed.Thumbnail && P(M(g.Embed.Thumbnail, f))) {
          b.setThumbnail(M(g.Embed.Thumbnail, f));
        }
        if (g.Embed.Image && P(M(g.Embed.Image, f))) {
          b.setImage(M(g.Embed.Image, f));
        }
        if (g.Embed.Author && g.Embed.Author.Text) {
          const a = M(g.Embed.Author.Icon, f);
          b.setAuthor({
            name: M(g.Embed.Author.Text, f),
            iconURL: P(a) ? a : undefined,
            url: f.url
          });
        }
        if (g.Embed.Footer && g.Embed.Footer.Text) {
          const a = g.Embed.Footer.Icon;
          b.setFooter({
            text: M(g.Embed.Footer.Text, f),
            iconURL: P(a) ? a : undefined
          });
        }
        const d = new n();
        d.addComponents(new o().setCustomId("music_back").setEmoji(z.MusicCommand.Emojis.Back).setStyle(p.Secondary));
        d.addComponents(new o().setCustomId("music_play_pause").setEmoji(z.MusicCommand.Emojis.Pause).setStyle(p.Secondary));
        d.addComponents(new o().setCustomId("music_next").setEmoji(z.MusicCommand.Emojis.Next).setStyle(p.Secondary));
        d.addComponents(new o().setCustomId("music_loop").setEmoji(z.MusicCommand.Emojis.Repeat).setStyle(p.Secondary));
        const e = {
          embeds: [b],
          components: [d]
        };
        a.metadata.channel.send(e);
      } else if (g.Message) {
        const b = M(g.Message, f);
        a.metadata.channel.send(b);
      }
    }
  } catch (a) {
    console.error("Error in playerStart event handler:", a);
  }
});
L.events.on("audioTrackAdd", (a, b) => {
  try {
    if (b.playlist) {
      return;
    }
    const c = N(b.extractor);
    const d = O(c);
    const e = {
      id: b.id,
      title: b?.title || "Track",
      description: b?.description || "None",
      author: c === "Spotify" || c === "Apple Music" ? "" + b?.author : "",
      url: b?.url || "None",
      thumbnail: b?.thumbnail || "None",
      duration: b?.duration || "00:00",
      durationMS: b?.durationMS || "0000",
      views: b?.views || "0",
      requestedByMention: b?.requestedBy || "Nobody",
      requestedByDisplayName: b?.requestedBy.globalName || "Nobody",
      platform: c || "Discord",
      platformEmoji: d || "https://imgur.com/csAsSqY",
      queueCount: a?.tracks.data.length || "0",
      queueDuration: a?.durationFormatted || "00:00"
    };
    const f = e;
    const g = z.MusicCommand.AddedTrack;
    if (g.Enabled) {
      if (g && g.Type.toUpperCase() === "EMBED") {
        const b = new m();
        if (g.Embed.Color) {
          b.setColor(g.Embed.Color);
        }
        if (g.Embed.Title) {
          b.setTitle(M(g.Embed.Title, f));
        }
        if (g.Embed.Description) {
          b.setDescription(M(g.Embed.Description.replace(c !== "Spotify" && c !== "Apple Music" ? "-" : "", ""), f));
        }
        if (g.Embed.Fields) {
          g.Embed.Fields.forEach(a => {
            const c = M(a.Name, f);
            const d = M(a.Value, f);
            const e = {
              name: c,
              value: d,
              inline: a.Inline ?? false
            };
            b.addFields(e);
          });
        }
        if (g.Embed.Thumbnail && P(M(g.Embed.Thumbnail, f))) {
          b.setThumbnail(M(g.Embed.Thumbnail, f));
        }
        if (g.Embed.Image && P(M(g.Embed.Image, f))) {
          b.setImage(M(g.Embed.Image, f));
        }
        if (g.Embed.Author && g.Embed.Author.Text) {
          const a = M(g.Embed.Author.Icon, f);
          b.setAuthor({
            name: M(g.Embed.Author.Text, f),
            iconURL: P(a) ? a : undefined,
            url: f.url
          });
        }
        if (g.Embed.Footer && g.Embed.Footer.Text) {
          const a = g.Embed.Footer.Icon;
          b.setFooter({
            text: M(g.Embed.Footer.Text, f),
            iconURL: P(a) ? a : undefined
          });
        }
        const d = {
          embeds: [b]
        };
        a.metadata.channel.send(d);
      } else if (g.Message) {
        const b = M(g.Message, f);
        a.metadata.channel.send(b);
      }
    }
  } catch (a) {
    console.error("Error in audioTrackAdd event handler:", a);
  }
});
L.events.on("audioTracksAdd", async (a, b) => {
  try {
    const c = b[0];
    const d = N(c.extractor);
    const e = O(d);
    const f = {
      id: c.id,
      url: c?.url || "None",
      requestedByMention: c?.requestedBy || "Nobody",
      requestedByDisplayName: c?.requestedBy.globalName || "Nobody",
      playlistName: b?.playlist?.title || "None",
      playlistUrl: b?.playlist?.url || "None",
      playlistThumbnail: b?.playlist?.thumbnail || "None",
      trackCount: b?.length,
      queueCount: a?.tracks.data.length || "0",
      queueDuration: a?.durationFormatted || "00:00",
      platform: d || "Discord",
      platformEmoji: e || "https://imgur.com/csAsSqY"
    };
    const g = f;
    const h = z.MusicCommand.AddedTracks;
    if (h.Enabled) {
      if (h.Type.toUpperCase() === "EMBED") {
        const b = new m();
        if (h.Embed.Color) {
          b.setColor(h.Embed.Color);
        }
        if (h.Embed.Title) {
          b.setTitle(M(h.Embed.Title, g));
        }
        if (h.Embed.Description) {
          b.setDescription(M(h.Embed.Description, g));
        }
        if (h.Embed.Fields) {
          h.Embed.Fields.forEach(a => {
            const c = M(a.Name, g);
            const d = M(a.Value, g);
            const e = {
              name: c,
              value: d,
              inline: a.Inline ?? false
            };
            b.addFields(e);
          });
        }
        if (h.Embed.Thumbnail && P(M(h.Embed.Thumbnail, g))) {
          b.setThumbnail(M(h.Embed.Thumbnail, g));
        }
        if (h.Embed.Image && P(M(h.Embed.Image, g))) {
          b.setImage(M(h.Embed.Image, g));
        }
        if (h.Embed.Author && h.Embed.Author.Text) {
          const a = M(h.Embed.Author.Icon, g);
          b.setAuthor({
            name: M(h.Embed.Author.Text, g),
            iconURL: P(a) ? a : undefined,
            url: g.url
          });
        }
        if (h.Embed.Footer && h.Embed.Footer.Text) {
          const a = h.Embed.Footer.Icon;
          b.setFooter({
            text: M(h.Embed.Footer.Text, g),
            iconURL: P(a) ? a : undefined
          });
        }
        const c = {
          embeds: [b]
        };
        await a.metadata.channel.send(c);
      } else if (h.Message) {
        const b = M(h.Message, g);
        await a.metadata.channel.send(b);
      }
    }
  } catch (b) {
    console.error("Error in audioTracksAdd event handler:", b);
    if (b.message && b.message.includes("ERR_NO_RESULT")) {
      await a.metadata.channel.send({
        content: "Sorry, I could not extract the stream for this track. Please try another track.",
        ephemeral: true
      });
    } else {
      await a.metadata.channel.send({
        content: "An unexpected error occurred while adding tracks.",
        ephemeral: true
      });
    }
  }
});
L.events.on("playerFinish", (a, b) => {
  try {
    const c = N(b.extractor);
    const d = O(c);
    const e = {
      id: b.id,
      title: b?.title || "Track",
      description: b?.description || "None",
      author: c === "Spotify" || c === "Apple Music" ? "" + b?.author : "",
      url: b?.url || "None",
      thumbnail: b?.thumbnail || "None",
      duration: b?.duration || "00:00",
      durationMS: b?.durationMS || "0000",
      views: b?.views || "0",
      requestedByMention: b?.requestedBy || "Nobody",
      requestedByDisplayName: b?.requestedBy.globalName || "Nobody",
      playlistName: b?.playlist?.title || "None",
      playlistUrl: b?.playlist?.url || "None",
      playlistThumbnail: b?.playlist?.thumbnail || "None",
      platform: c || "Discord",
      platformEmoji: d || "https://imgur.com/csAsSqY",
      queueCount: a?.tracks.data.length || "0",
      queueDuration: a?.durationFormatted || "00:00"
    };
    const f = e;
    const g = z.MusicCommand.TrackFinished;
    if (g.Enabled) {
      if (g && g.Type.toUpperCase() === "EMBED") {
        const b = new m();
        if (g.Embed.Color) {
          b.setColor(g.Embed.Color);
        }
        if (g.Embed.Title) {
          b.setTitle(M(g.Embed.Title, f));
        }
        if (g.Embed.Description) {
          b.setDescription(M(g.Embed.Description.replace(c !== "Spotify" && c !== "Apple Music" ? "-" : "", ""), f));
        }
        if (g.Embed.Fields) {
          g.Embed.Fields.forEach(a => {
            const c = M(a.Name, f);
            const d = M(a.Value, f);
            const e = {
              name: c,
              value: d,
              inline: a.Inline ?? false
            };
            b.addFields(e);
          });
        }
        if (g.Embed.Thumbnail && P(M(g.Embed.Thumbnail, f))) {
          b.setThumbnail(M(g.Embed.Thumbnail, f));
        }
        if (g.Embed.Image && P(M(g.Embed.Image, f))) {
          b.setImage(M(g.Embed.Image, f));
        }
        if (g.Embed.Author && g.Embed.Author.Text) {
          const a = M(g.Embed.Author.Icon, f);
          b.setAuthor({
            name: M(g.Embed.Author.Text, f),
            iconURL: P(a) ? a : undefined,
            url: f.url
          });
        }
        if (g.Embed.Footer && g.Embed.Footer.Text) {
          const a = g.Embed.Footer.Icon;
          b.setFooter({
            text: M(g.Embed.Footer.Text, f),
            iconURL: P(a) ? a : undefined
          });
        }
        const d = {
          embeds: [b]
        };
        a.metadata.channel.send(d);
      } else if (g.Message) {
        const b = M(g.Message, f);
        a.metadata.channel.send(b);
      }
    }
  } catch (a) {
    console.error("Error in playerFinish event handler:", a);
  }
});
function N(a) {
  let b = "Unknown Platform";
  for (const c of a.protocols) {
    switch (c) {
      case "ytsearch":
      case "youtube":
        b = "YouTube";
        break;
      case "spsearch":
      case "spotify":
        b = "Spotify";
        break;
      case "scsearch":
      case "soundcloud":
        b = "SoundCloud";
        break;
      case "amsearch":
      case "applemusic":
        b = "Apple Music";
        break;
      default:
        continue;
    }
    if (b !== "Unknown Platform") {
      break;
    }
  }
  return b;
}
function O(a) {
  let b = "";
  switch (a) {
    case "YouTube":
      b = z.MusicCommand.Emojis.Platform.YouTube;
      break;
    case "Spotify":
      b = z.MusicCommand.Emojis.Platform.Spotify;
      break;
    case "SoundCloud":
      b = z.MusicCommand.Emojis.Platform.SoundCloud;
      break;
    case "Apple Music":
      b = z.MusicCommand.Emojis.Platform.AppleMusic;
      break;
    default:
      b = "https://imgur.com/csAsSqY";
      break;
  }
  return b;
}
function P(a) {
  let b;
  try {
    b = new URL(a);
  } catch (a) {
    return false;
  }
  return b.protocol === "http:" || b.protocol === "https:";
}
if (z.TicketTranscript.Type === "WEB") {
  const a = z.TicketTranscript.WebServer.Port || 3000;
  const b = require("./server");
  const c = a || process.env.PORT || 3000;
  b.listen(c, () => {
    console.log("Server running on port " + c);
  });
} else {}
const {
  xYs123: Q
} = require("./utils.js");
const {
  url: R
} = require("inspector");
const {
  duration: S
} = require("moment");
const {
  title: T
} = require("process");
async function U() {
}
const V = {
  startBot: U
};
module.exports = V;