const {
  Client: d,
  GatewayIntentBits: e,
  EmbedBuilder: f,
  ActionRowBuilder: g,
  ButtonBuilder: h,
  ButtonStyle: i,
  ActivityType: j,
  SlashCommandBuilder: k,
  ApplicationCommandType: l,
  ContextMenuCommandBuilder: m,
  REST: n,
  Events: o,
  Collection: p
} = require("discord.js");
const {
  Font: q
} = require("canvacord");
const r = require("fs");
const s = require("js-yaml");
const t = require("path");
const u = require("ansi-colors");
const v = require("axios");
const w = require("glob");
const {
  Routes: x
} = require("discord-api-types/v10");
const y = require("moment-timezone");
const z = s.load(r.readFileSync("./config.yml", "utf8"));
const A = s.load(r.readFileSync("./commands.yml", "utf8"));
const B = s.load(r.readFileSync("././lang.yml", "utf8"));
const C = require("./index.js");
const D = require("./models/UserData.js");
const E = require("./models/ReactionRole");
const F = require("./package.json");
const G = require("./events/Giveaways/giveawayScheduler.js");
const H = require("./events/AFK/afkScheduler.js");
const {
  handleUserJoiningTriggerChannel: I,
  handleUserLeavingChannel: J
} = require("./events/voiceStateUpdate");
const {
  startAlertScheduler: K
} = require("./events/Tickets/checkAlerts");
const L = require("./models/TempVoiceChannel");
const M = require("./models/TempRole");
const N = require("./models/twitch");
const O = require("./models/reminder");
const P = require("./models/poll");
const Q = require("./models/tickets");
const R = require("./models/guildDataSchema");
C.commands = new p();
C.slashCommands = new p();
C.snipes = new p();
const S = new Map();
C.on("messageCreate", Z);
C.on("messageDelete", _);
C.on("presenceUpdate", aa);
C.on("interactionCreate", async a => ca(a));
C.on("messageUpdate", ga);
C.on("guildMemberAdd", ha);
C.on("messageReactionAdd", ea);
C.on("messageReactionRemove", fa);
C.on("ready", ia);
C.on("error", ma);
C.on("warn", na);
const T = [];
const U = new Set();
const V = {};
const W = new Map();
function X(a, b) {
  V[a] = b;
}
function Y(a) {
  return parseInt(a.replace("#", ""), 16);
}
function Z(a) {
  if (a.author.bot) {
    return;
  }
  if (a.mentions.users.size) {
    if (!z.AntiGhostPing.Enabled) {
      return;
    }
    const b = oa(a.member, z.AntiGhostPing.BypassPerms, z.AntiGhostPing.BypassRoles);
    if (b) {
      return;
    }
    S.set(a.id, {
      timestamp: Date.now(),
      authorId: a.author.id,
      mentions: a.mentions.users.map(a => a.id)
    });
  }
  $(a);
}
async function $(a) {
  const b = {
    channelId: a.channel.id,
    status: "open"
  };
  const c = await Q.findOne(b);
  if (c && a.author.id === c.userId) {
    c.alertTime = null;
    if (c.alertMessageId) {
      const b = await a.channel.messages.fetch(c.alertMessageId).catch(() => null);
      if (b) {
        await b.delete();
      }
      c.alertMessageId = null;
    }
    await c.save();
  }
}
function _(a) {
  if (!a.guild || a.author.bot) {
    return;
  }
  if (!C.snipes.has(a.guild.id)) {
    C.snipes.set(a.guild.id, new p());
  }
  const b = C.snipes.get(a.guild.id);
  b.set(a.channel.id, {
    content: a.content,
    author: a.author.tag,
    member: a.member,
    timestamp: new Date()
  });
  if (S.has(a.id)) {
    const b = S.get(a.id);
    const c = qa(z.AntiGhostPing.TimeLimit);
    if (Date.now() - b.timestamp < c) {
      const c = a.guild.members.cache.get(b.authorId);
      if (c) {
        const d = qa(z.AntiGhostPing.TimeoutTime);
        c.timeout(d, "Ghost Pinging (Auto Moderation)").catch(console.error);
        const f = ra("Auto Moderation", "#FF0000", "Ghost Ping Detected", "**User:** <@" + b.authorId + "> \n**Action:** Timeout", [{
          name: "Reason",
          value: "Ghost Pinging",
          inline: true
        }, {
          name: "Duration",
          value: sa(d),
          inline: true
        }], "User ID: " + b.authorId);
        ta(a.guild, z.AntiGhostPing.LogsChannelID, f);
        if (z.AntiGhostPing.SendDM) {
          const b = {
            guildName: a.guild.name,
            messageContent: a.content,
            timeoutDuration: sa(d)
          };
          ua(c.user, z.AntiGhostPing.DirectMessage, b);
        }
      }
    }
    S.delete(a.id);
  }
}
async function aa(a, b) {
  if (!b.guild || !z.statusRoles.Log.Enabled) {
    return;
  }
  Object.entries(z.statusRoles.status).forEach(async ([c, d]) => {
    const e = b.activities.some(a => a.type === j.Custom && a.state && a.state.includes(c));
    const f = await b.guild.members.fetch(b.userId);
    if (!f) {
      return;
    }
    d.forEach(async d => {
      const g = b.guild.roles.cache.get(d);
      if (!g) {
        return;
      }
      if (e) {
        if (!f.roles.cache.has(g.id)) {
          await f.roles.add(g).catch(console.error);
          va(f, g, true, c);
        }
      } else if (a) {
        const b = a.activities.some(a => a.type === j.Custom && a.state && a.state.includes(c));
        if (b && f.roles.cache.has(g.id)) {
          await f.roles.remove(g).catch(console.error);
          va(f, g, false, c);
        }
      }
    });
  });
}
function ba(a) {
  return async b => {
    const c = a.Reactions.find(a => a.Emoji === b.customId);
    if (!c) {
      return;
    }
    const d = b.guild.roles.cache.get(c.RoleID);
    if (!d) {
      console.log("[REACTION ROLES] Role (" + c.RoleID + ") not found in ReactionRoles.roleID");
      return;
    }
    const e = b.guild.members.cache.get(b.user.id);
    try {
      if (!b.replied && !b.deferred) {
        await b.deferReply({
          ephemeral: true
        });
      }
      if (e.roles.cache.has(d.id)) {
        await e.roles.remove(d);
        const a = {
          content: "Removed the " + c.Name + " role from you."
        };
        await b.editReply(a);
      } else {
        await e.roles.add(d);
        const a = {
          content: "Added the " + c.Name + " role to you."
        };
        await b.editReply(a);
      }
    } catch (a) {
      console.error(a);
    }
  };
}
Object.keys(z.ReactionRoles).forEach(a => {
  const b = z.ReactionRoles[a];
  if (b.useButtons) {
    const c = ba(b);
    X(a, c);
  }
});
async function ca(a) {
  if (a.isCommand()) {
    const b = C.slashCommands.get(a.commandName);
    if (!b) {
      return;
    }
    try {
      await b.execute(a, C);
    } catch (b) {
      console.error(b);
      if (!a.replied && !a.deferred) {
        await a.reply({
          content: "There was an error while executing this command!",
          ephemeral: true
        });
      } else if (a.deferred) {
        await a.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true
        });
      }
    }
  }
  if (a.isButton()) {
    const b = a.user.id + "-" + a.customId;
    if (W.has(b)) {
      clearTimeout(W.get(b));
    }
    W.set(b, setTimeout(async () => {
      try {
        if (!a.replied && !a.deferred) {
          for (const [b, c] of Object.entries(V)) {
            await c(a);
          }
          const b = {
            "transactionLogs.interactionId": a.message.interaction.id
          };
          const c = await D.findOne(b);
          if (a.customId === "get_wallet_address") {
            if (c) {
              const b = {
                content: "Wallet Address: `" + c.address + "`",
                ephemeral: true
              };
              await a.reply(b);
            } else {
              await a.reply({
                content: "Wallet address not found.",
                ephemeral: true
              });
            }
          } else if (a.customId === "show_qr_code") {
            if (c) {
              const b = {
                content: "" + c.qrCodeURL,
                ephemeral: true
              };
              await a.reply(b);
            } else {
              await a.reply({
                content: "QR code not found.",
                ephemeral: true
              });
            }
          }
        } else {
          console.warn("Interaction " + a.id + " has already been replied or deferred.");
        }
      } catch (b) {
        console.error("Error handling interaction: " + a.id, b);
      } finally {
        W.delete(b);
      }
    }, 100));
  }
}
const da = new Set();
async function ea(a, b) {
  if (b.bot) {
    return;
  }
  const c = Object.values(z.ReactionRoles).find(b => b.ChannelID === a.message.channel.id);
  if (!c || c.useButtons) {
    return;
  }
  const d = a.emoji.id ? "<" + (a.emoji.animated ? "a" : "") + ":" + a.emoji.name + ":" + a.emoji.id + ">" : a.emoji.name;
  const e = c.Reactions.find(a => a.Emoji === d);
  if (!e) {
    return;
  }
  const f = a.message.guild.roles.cache.get(e.RoleID);
  if (!f) {
    console.log("[REACTION ROLES] Role (" + e.RoleID + ") not found in ReactionRoles.roleID");
    return;
  }
  const g = a.message.guild.members.cache.get(b.id);
  if (g.roles.cache.has(f.id)) {
    await g.roles.remove(f).catch(console.error);
  } else {
    await g.roles.add(f).catch(console.error);
  }
  if (c.resetReacts) {
    da.add(a.message.id + "-" + b.id);
    await a.users.remove(b).catch(console.error);
    da.delete(a.message.id + "-" + b.id);
  }
}
async function fa(a, b) {
  if (b.bot) {
    return;
  }
  const c = Object.values(z.ReactionRoles).find(b => b.ChannelID === a.message.channel.id);
  if (!c || c.useButtons) {
    return;
  }
  const d = a.emoji.id ? "<" + (a.emoji.animated ? "a" : "") + ":" + a.emoji.name + ":" + a.emoji.id + ">" : a.emoji.name;
  const e = c.Reactions.find(a => a.Emoji === d);
  if (!e) {
    return;
  }
  const f = a.message.guild.roles.cache.get(e.RoleID);
  if (!f) {
    console.log("[REACTION ROLES] Role (" + e.RoleID + ") not found in ReactionRoles.roleID");
    return;
  }
  if (da.has(a.message.id + "-" + b.id)) {
    return;
  }
}
function ga(a, b) {
  if (!a.guild || a.author.bot) {
    return;
  }
  if (a.content === b.content) {
    return;
  }
  if (!C.snipes.has(a.guild.id)) {
    C.snipes.set(a.guild.id, new p());
  }
  const c = C.snipes.get(a.guild.id);
  c.set(a.channel.id, {
    oldContent: a.content,
    newContent: b.content,
    author: a.author.tag,
    member: a.member,
    timestamp: new Date(),
    edited: true
  });
}
function ha(a) {
  const b = z.AutoKick;
  if (!b.Enabled || a.user.bot) {
    return;
  }
  const c = b.Role;
  const d = Wa(b.Time);
  setTimeout(async () => {
    try {
      a = await a.guild.members.fetch(a.id);
      if (!a) {
        return;
      }
      const d = c.some(b => a.roles.cache.has(b));
      if (!d) {
        if (b.DM.Enabled) {
          const c = new f().setTitle(b.DM.Embed.Title).setDescription(b.DM.Embed.Description.join("\n")).setColor(b.DM.Embed.Color).setFooter({
            text: b.DM.Embed.Footer
          });
          const d = {
            embeds: [c]
          };
          await a.send(d).catch(b => {
            if (b.code !== 50007) {
              console.error("Failed to send DM to " + a.displayName + ": " + b);
            }
          });
        }
        await a.kick("Auto-Kick: Failed to acquire the required role in time.");
        console.log("Auto-kicked " + a.displayName + ". Did not acquire required role within " + b.Time + ".");
      }
    } catch (b) {
      console.error("Failed to process auto-kick for " + a.displayName + ": " + b);
    }
  }, d);
}
async function ia() {
  const a = A.giveaway;
  Ma();
  setInterval(Oa, 12500);
  setInterval(Ja, 300000);
  await ja();
  if (a) {
    G();
    console.log(u.green("[SCHEDULER]") + " Giveaway scheduler enabled!");
  }
  za();
  const b = process.version;
  const c = F.version;
  const d = new Date();
  const e = d.getHours() + ":" + d.getMinutes() + " (" + d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear() + ")";
  r.appendFile("logs.txt", e + " - Bot started up - Node.js " + b + " - App Version " + c + "\n", a => {
    if (a) {
      console.error("Failed to write to log file:", a);
    }
  });
  if (z.AFK.Enabled) {
    console.log(u.green("[SCHEDULER]") + " AFK scheduler enabled!");
    await H();
  }
  if (z.Twitch.Enabled) {
    await Aa();
  }
  if (z.Alert && z.Alert.Enabled) {
    K(C);
  }
  await Ka();
  await Ra();
  setInterval(async () => {
    await Na(C);
  }, 300000);
  if (z.Twitch.Enabled) {
    setInterval(async () => {
      await Aa();
    }, 60000);
  }
  try {
    const a = await L.find({});
    for (const b of a) {
      const a = C.guilds.cache.get(b.guildId);
      if (a) {
        const c = a.channels.cache.get(b.tempChannelId);
        if (!c || c.members.filter(a => !a.user.bot).size === 0) {
          if (c) {
            await c.delete();
          }
          const a = {
            _id: b._id
          };
          await L.deleteOne(a);
          console.log("Cleaned up temp voice channel: " + b.tempChannelId);
        }
      }
    }
  } catch (a) {
    console.error("Error during temp voice channel cleanup:", a);
  }
  const f = await C.application.commands.fetch();
  for (const a of f.values()) {
    await C.application.commands.delete(a.id);
  }
  const h = new n({
    version: "10"
  }).setToken(z.BotToken);
  try {
    const a = {
      body: T
    };
    await h.put(x.applicationGuildCommands(C.user.id, z.GuildID), a);
  } catch (a) {
    console.error(u.red("[ERROR]") + " Failed to register slash commands.");
    console.error(a);
    r.appendFileSync("logs.txt", new Date().toISOString() + " - ERROR: " + JSON.stringify(a, null, 2) + "\n");
    if (a.message.includes("application.commands scope")) {
      console.error(u.red("[ERROR]") + " Application.commands scope wasn't selected when inviting the bot.");
      console.error(u.red("[ERROR]") + " Invite the bot using the following URL:");
      console.error("" + u.red("[ERROR] https://discord.com/api/oauth2/authorize?client_id=" + C.user.id + "&permissions=8&scope=bot%20applications.commands"));
    }
  }
  Ya();
}
async function ja() {
  const a = C.guilds.cache;
  for (const [b, c] of a) {
    try {
      const a = await c.members.fetch();
      const d = new Set(a.map(a => a.id));
      const e = {
        guildID: b
      };
      let f = await R.findOne(e);
      if (!f) {
        const a = {
          guildID: b,
          members: []
        };
        f = new R(a);
      }
      const g = new Set(f.members);
      const h = [...g].filter(a => !d.has(a));
      for (const a of h) {
        await ka(c, a);
      }
      await la(f, d);
    } catch (a) {
      console.error("Error checking for left members in guild " + b + ":", a);
    }
  }
}
async function ka(a, b) {
  const c = await a.members.fetch(b).catch(() => null);
  if (c) {
    await sendLeaveMessage(c);
    await updateInviteUsage(c);
  }
}
async function la(a, b) {
  a.members = [...b];
  await a.save();
}
function ma(a) {
  r.appendFile("logs.txt", new Date().toISOString() + " - ERROR: " + a + "\n", a => {
    if (a) {
      console.error("Failed to write to log file:", a);
    }
  });
}
function na(a) {
  r.appendFile("logs.txt", new Date().toISOString() + " - WARN: " + a + "\n", a => {
    if (a) {
      console.error("Failed to write to log file:", a);
    }
  });
}
function oa(a, b, c) {
  return b.some(b => a.permissions.has(b)) || c.some(b => a.roles.cache.has(b));
}
function pa(a) {
  const b = /(\d+)([smhd])/g;
  let c;
  let d = 0;
  while ((c = b.exec(a)) !== null) {
    const a = parseInt(c[1], 10);
    const b = c[2];
    switch (b) {
      case "s":
        d += a * 1000;
        break;
      case "m":
        d += a * 60 * 1000;
        break;
      case "h":
        d += a * 60 * 60 * 1000;
        break;
      case "d":
        d += a * 24 * 60 * 60 * 1000;
        break;
      default:
        break;
    }
  }
  return d;
}
function qa(a) {
  const c = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000
  };
  return a.split(" ").reduce((a, b) => {
    const d = b.slice(-1);
    const e = parseInt(b.slice(0, -1), 10);
    return a + e * (c[d] || 0);
  }, 0);
}
function ra(a, b, c, d, e, g) {
  const h = {
    name: a
  };
  const i = {
    text: g
  };
  return new f().setAuthor(h).setColor(b).setTitle(c).setDescription(d).addFields(e).setTimestamp().setFooter(i);
}
function sa(a) {
  if (a < 1000) {
    return "Less than a second";
  }
  let b = Math.floor(a / 1000);
  let c = Math.floor(b / 60);
  let d = Math.floor(c / 60);
  let e = Math.floor(d / 24);
  let f = Math.floor(e / 7);
  let g = Math.floor(e / 30);
  let h = Math.floor(e / 365);
  b %= 60;
  c %= 60;
  d %= 24;
  e %= 7;
  f %= 4;
  g %= 12;
  let i = "";
  if (h > 0) {
    i += h + " year" + (h > 1 ? "s" : "") + ", ";
  }
  if (g > 0) {
    i += g + " month" + (g > 1 ? "s" : "") + ", ";
  }
  if (f > 0) {
    i += f + " week" + (f > 1 ? "s" : "") + ", ";
  }
  if (e > 0) {
    i += e + " day" + (e > 1 ? "s" : "") + ", ";
  }
  if (d > 0) {
    i += d + " hour" + (d > 1 ? "s" : "") + ", ";
  }
  if (c > 0) {
    i += c + " minute" + (c > 1 ? "s" : "") + ", ";
  }
  if (b > 0) {
    i += b + " second" + (b > 1 ? "s" : "");
  }
  return i.replace(/,\s*$/, "");
}
function ta(a, b, c) {
  const d = a.channels.cache.get(b);
  if (d) {
    const a = {
      embeds: [c]
    };
    d.send(a);
  }
}
async function ua(a, b, c) {
  let d = b.replace(/{user}/g, a.username).replace(/{guildname}/g, c.guildName).replace(/{message}/g, c.messageContent).replace(/{time}/g, c.timeoutDuration);
  try {
    await a.send(d);
  } catch (b) {
    console.log("Could not send DM to " + a.username + ": " + b);
  }
}
function va(a, b, c, d) {
  const e = a.guild.channels.cache.get(z.statusRoles.Log.channelID);
  if (!e) {
    console.error("Log channel not found. Check the provided channel ID.");
    return;
  }
  const g = "<@&" + b.id + ">";
  const h = c ? z.statusRoles.Log.Description.roleAdded : z.statusRoles.Log.Description.roleRemoved;
  const i = h.map(b => b.replace("{userName}", a.displayName).replace("{role}", g).replace("{status}", d)).join("\n");
  const j = new f().setTitle(z.statusRoles.Log.Title).setDescription(i).setColor(z.statusRoles.Log.Color).setFooter({
    text: z.statusRoles.Log.Footer
  }).setTimestamp();
  if (z.statusRoles.Log.Thumbnail) {
    j.setThumbnail(a.user.displayAvatarURL());
  }
  if (z.statusRoles.Log.Image) {
    j.setImage(z.statusRoles.Log.Image);
  }
  const k = {
    embeds: [j]
  };
  e.send(k);
}
function wa(a) {
  const c = r.readdirSync(a, {
    withFileTypes: true
  });
  for (const b of c) {
    const c = t.join(a, b.name);
    if (b.isDirectory()) {
      wa(c);
    } else if (b.isFile() && b.name.endsWith(".js")) {
      try {
        const a = require(c);
        if (a.data instanceof k) {
          if (A[a.data.name]) {
            console.log(u.green("[SLASH COMMAND]") + " " + a.data.name + " loaded!");
            T.push(a.data.toJSON());
            C.slashCommands.set(a.data.name, a);
          } else {
            console.log(u.yellow("[SLASH COMMAND]") + " " + a.data.name + " is disabled! (commands.yml)");
          }
        } else if (a.data instanceof m) {
          if (A[a.data.name]) {
            console.log(u.green("[CONTEXT MENU COMMAND]") + " " + a.data.name + " loaded!");
            T.push(a.data.toJSON());
            C.slashCommands.set(a.data.name, a);
          } else {
            console.log(u.yellow("[CONTEXT MENU COMMAND]") + " " + a.data.name + " is disabled! (commands.yml)");
          }
        } else if (Array.isArray(a.data) && a.data.every(a => a instanceof m)) {
          a.data.forEach(b => {
            if (A[b.name]) {
              console.log(u.green("[CONTEXT MENU COMMAND]") + " " + b.name + " loaded!");
              T.push(b.toJSON());
              C.slashCommands.set(b.name, a);
            } else {
              console.log(u.yellow("[CONTEXT MENU COMMAND]") + " " + b.name + " is disabled! (commands.yml)");
            }
          });
        }
      } catch (a) {
        console.error(u.red("[ERROR]") + " Error loading " + b.name + ":", a);
      }
    }
  }
}
wa(t.join(__dirname, "commands"));
w("./addons/**/*.js", function (a, b) {
  if (a) {
    return console.error(a);
  }
  const c = [];
  b.forEach(a => {
    if (a.endsWith(".js")) {
      const b = a.match(/\/addons\/([^/]+)/)[1];
      if (!c.includes(b)) {
        c.push(b);
        console.log(u.green("[ADDON]") + " " + b + " loaded!");
      }
      try {
        if (a.search("cmd_") >= 0) {
          let b = require(a);
          if (b && b.data && b.data.toJSON && typeof b.data.toJSON === "function") {
            T.push(b.data.toJSON());
            C.slashCommands.set(b.data.name, b);
          }
        } else {
          let b = require(a);
          if (b && b.run && typeof b.run === "function") {
            b.run(C);
          }
        }
      } catch (a) {
        console.error("" + u.red("[ERROR] " + b + ": " + a.message));
        console.error(a.stack);
      }
    }
  });
});
const xa = {
  PRIMARY: i.Primary,
  SECONDARY: i.Secondary,
  SUCCESS: i.Success,
  DANGER: i.Danger,
  LINK: i.Link
};
const ya = xa;
async function za() {
  if (!z.ReactionRoles.Enabled) {
    return;
  }
  for (const a in z.ReactionRoles) {
    if (a === "Enabled") {
      continue;
    }
    const b = z.ReactionRoles[a];
    const c = C.channels.cache.get(b.ChannelID);
    if (!c) {
      continue;
    }
    const d = {
      panelName: a
    };
    const e = await E.findOne(d);
    if (e) {
      const a = await c.messages.fetch(e.messageID).catch(() => null);
      if (a) {
        continue;
      } else {}
    }
    const i = b.Embed.Description.map(a => a.trim()).join("\n");
    const j = new f().setDescription(i);
    if (b.Embed.Title) {
      j.setTitle(b.Embed.Title);
    }
    if (b.Embed.Footer.Text) {
      j.setFooter({
        text: b.Embed.Footer.Text,
        iconURL: b.Embed.Footer.Icon || undefined
      });
    }
    if (b.Embed.Author.Text) {
      j.setAuthor({
        name: b.Embed.Author.Text,
        iconURL: b.Embed.Author.Icon || undefined
      });
    }
    if (b.Embed.Color) {
      j.setColor(b.Embed.Color);
    }
    if (b.Embed.Image) {
      j.setImage(b.Embed.Image);
    }
    if (b.Embed.Thumbnail) {
      j.setThumbnail(b.Embed.Thumbnail);
    }
    let k;
    if (b.useButtons) {
      const d = [];
      let e = new g();
      let f = 0;
      b.Reactions.forEach((b, c) => {
        const i = ya[b.Style.toUpperCase()];
        if (!i) {
          console.error("Invalid button style: " + b.Style + " for panel: " + a);
          return;
        }
        if (f >= 25) {
          console.error("Exceeded the button limit for panel: " + a + ". Maximum 25 buttons are allowed.");
          return;
        }
        if (typeof b.Description !== "string") {
          console.error("Invalid description type: " + typeof b.Description + " for reaction: " + b.Name + " in panel: " + a);
          return;
        }
        const j = new h().setCustomId(b.Emoji).setLabel(b.Description).setStyle(i).setEmoji(b.Emoji);
        e.addComponents(j);
        f++;
        if (e.components.length === 5) {
          d.push(e);
          e = new g();
        }
      });
      if (e.components.length > 0) {
        d.push(e);
      }
      if (d.length > 0) {
        const a = {
          embeds: [j],
          components: d
        };
        k = await c.send(a);
      }
    } else {
      const a = {
        embeds: [j]
      };
      k = await c.send(a);
      for (const a of b.Reactions) {
        await k.react(a.Emoji);
      }
    }
    if (e) {
      e.messageID = k.id;
      await e.save();
    } else {
      const c = {
        panelName: a,
        channelID: b.ChannelID,
        messageID: k.id
      };
      const d = new E(c);
      await d.save();
    }
  }
}
async function Aa() {
  const {
    AnnouncementChannelID: a,
    AssignRole: b
  } = z.Twitch;
  let c;
  try {
    c = C.channels.cache.get(a);
    if (!c) {
      throw new Error("Announcement channel with ID " + a + " not found.");
    }
    const d = await Ba();
    if (!d) {
      throw new Error("Failed to obtain Twitch access token.");
    }
    const e = await N.find();
    for (const a of e) {
      try {
        const e = await Ea(a.name, d);
        let f;
        if (a.discordUserId) {
          f = await c.guild.members.fetch(a.discordUserId).catch(b => {
            console.error("Error fetching guild member for " + a.name + ":", b);
          });
        }
        if (!e) {
          if (U.has(a.name) && f && f.roles.cache.has(b)) {
            await f.roles.remove(b);
          }
          U.delete(a.name);
          continue;
        }
        if (U.has(a.name)) {
          continue;
        }
        await Ga(c, a, e, d);
        if (f && !f.roles.cache.has(b)) {
          await f.roles.add(b).catch(b => {
            console.error("Error adding role to member for " + a.name + ":", b);
          });
        }
        U.add(a.name);
      } catch (b) {
        console.error("Error processing stream for " + a.name + ":", b);
      }
    }
  } catch (a) {
    console.error("Error in announceTwitchStreams function:", a);
  }
}
async function Ba() {
  try {
    const a = {
      client_id: z.Twitch.ClientID,
      client_secret: z.Twitch.ClientSecret,
      grant_type: "client_credentials"
    };
    const b = {
      params: a
    };
    const c = await v.post("https://id.twitch.tv/oauth2/token", null, b);
    return c.data.access_token;
  } catch (a) {
    console.error("Error fetching Twitch token:", a.response ? a.response.data : a.message);
    return null;
  }
}
async function Ca(a, b) {
  try {
    const c = {
      "Client-ID": z.Twitch.ClientID,
      Authorization: "Bearer " + b
    };
    const d = {
      headers: c
    };
    const e = await v.get("https://api.twitch.tv/helix/games?id=" + a, d);
    const f = e.data.data[0];
    if (f) {
      const a = f.box_art_url.replace("{width}", "144").replace("{height}", "192");
      return a;
    }
    return null;
  } catch (b) {
    console.error("Error fetching game icon for game ID: " + a, b);
    return null;
  }
}
async function Da(a, b) {
  try {
    const c = {
      "Client-ID": z.Twitch.ClientID,
      Authorization: "Bearer " + b
    };
    const d = {
      headers: c
    };
    const e = await v.get("https://api.twitch.tv/helix/users?id=" + a, d);
    return e.data.data[0]?.profile_image_url;
  } catch (b) {
    console.error("Error fetching Twitch user profile for user ID: " + a, b);
    return null;
  }
}
async function Ea(a, b) {
  try {
    const c = {
      "Client-ID": z.Twitch.ClientID,
      Authorization: "Bearer " + b
    };
    const d = {
      user_login: a
    };
    const e = {
      headers: c,
      params: d
    };
    const f = await v.get("https://api.twitch.tv/helix/streams", e);
    return f.data.data[0];
  } catch (b) {
    console.error("Error fetching Twitch stream info for " + a + ":", b.response ? b.response.data : b.message);
    return null;
  }
}
function Fa(a, b) {
  return "[" + a + "](" + b + ")";
}
async function Ga(a, b, c, d) {
  const e = z.Streamers[b.name] || z.Streamers.Default;
  const j = "https://www.twitch.tv/" + b.name;
  const k = e.Embed.Description.map(a => a.replace("{streamTitle}", c.title || "Live Stream").replace("{streamURL}", j).replace("{markdownTitle}", Fa(c.title || "Live Stream", j)).replace("{viewerCount}", c.viewer_count.toString()).replace("{streamer}", b.name)).filter(a => a).join("\n");
  const l = c.thumbnail_url.replace("{width}", "320").replace("{height}", "180");
  const m = await Ca(c.game_id, d);
  const n = await Da(c.user_id, d);
  const o = e.Embed.Title.replace("{streamer}", b.name) || "Twitch Stream";
  const p = new f().setColor(e.Embed.Color || "#FF4500").setTitle(o).setAuthor({
    name: e.Embed.AuthorName.replace("{streamer}", b.name),
    iconURL: n || undefined,
    url: j
  }).setDescription(k).setThumbnail(m).setImage(l).setFooter({
    text: e.Embed.Footer || "Twitch Stream",
    iconURL: e.Embed.FooterIcon || undefined
  });
  const q = new g();
  e.Embed.Components.forEach(a => {
    if (a.Link) {
      const b = new h().setLabel(a.Label || "Join the fun!").setStyle(i.Link).setURL(j).setEmoji(a.Emoji);
      q.addComponents(b);
    }
  });
  const r = await a.send({
    content: e.Message.Content.replace("{streamer}", b.name),
    embeds: [p],
    components: [q]
  });
  b.announcementMessageId = r.id;
  const s = setInterval(() => Ha(b, d, a), 60000);
  b.updateInterval = s;
  U.add(b.name);
}
async function Ha(a, b, c) {
  const d = await Ea(a.name, b);
  if (!d) {
    Ia(a);
    return;
  }
  const e = z.Streamers[a.name] || z.Streamers.Default;
  const g = "https://www.twitch.tv/" + a.name;
  const h = d.thumbnail_url.replace("{width}", "320").replace("{height}", "180") + "?t=" + Date.now();
  const i = await Ca(d.game_id, b);
  const j = await Da(d.user_id, b);
  const k = e.Embed.Description.map(b => b.replace("{streamTitle}", d.title || "Live Stream").replace("{streamURL}", g).replace("{markdownTitle}", Fa(d.title || "Live Stream", g)).replace("{viewerCount}", d.viewer_count.toString()).replace("{streamer}", a.name)).filter(a => a).join("\n");
  const l = e.Embed.Title.replace("{streamer}", a.name) || "Twitch Stream";
  const m = new f().setColor(e.Embed.Color || "#FF4500").setTitle(l).setAuthor({
    name: e.Embed.AuthorName.replace("{streamer}", a.name),
    iconURL: j || undefined,
    url: g
  }).setDescription(k).setThumbnail(i).setImage(h).setFooter({
    text: e.Embed.Footer || "Twitch Stream",
    iconURL: e.Embed.FooterIcon || undefined
  });
  const n = await c.messages.fetch(a.announcementMessageId).catch(console.error);
  if (n) {
    const a = {
      embeds: [m]
    };
    await n.edit(a).catch(console.error);
  }
}
function Ia(a) {
  if (a.updateInterval) {
    clearInterval(a.updateInterval);
    a.updateInterval = null;
  }
}
async function Ja() {
  if (!z.Warnings || !z.Warnings.Expiry) {
    console.error("Warning configuration is missing or incomplete.");
    return;
  }
  const a = pa(z.Warnings.Expiry);
  const b = new Date();
  const c = new Date(b.getTime() - a);
  try {
    const a = {
      $lte: c
    };
    const b = {
      "warnings.date": a
    };
    const d = await D.find(b);
    for (const a of d) {
      a.warnings = a.warnings.filter(a => a.date > c);
      await a.save();
    }
  } catch (a) {
    console.error("Error removing expired warnings:", a);
  }
}
async function Ka() {
  const a = t.join(__dirname, "commands", "General", "Leveling", "fonts", z.RankCard.Font);
  const b = t.join(__dirname, "commands", "General", "Leveling", "backgrounds", z.RankCard.Background);
  if (r.existsSync(a)) {
    q.fromFile(a, t.parse(a).name);
  } else {
    console.error(z.RankCard.Font + " font file not found. Please check the file path.");
  }
  if (r.existsSync(b)) {} else {
    console.error(z.RankCard.Background + " background file not found. Please check the file path.");
  }
}
async function La() {
  const a = new Date();
  const b = {
    $lte: a
  };
  const c = {
    "tempBans.endTime": b,
    "tempBans.lifted": false
  };
  D.find(c).then(async b => {
    for (const c of b) {
      for (const b of c.tempBans) {
        if (b.endTime <= a && !b.lifted) {
          const a = C.guilds.cache.get(c.guildId);
          if (a) {
            try {
              await a.members.unban(c.userId);
              b.lifted = true;
            } catch (a) {
              if (a.code === 10026) {
                c.tempBans = c.tempBans.filter(a => a !== b);
              } else {
                console.error("Failed to unban user " + c.userId + ":", a);
              }
            }
          }
        }
      }
      await c.save();
    }
  }).catch(a => {
    console.error("Error checking expired tempbans:", a);
  });
}
function Ma() {
  console.log(u.green("[SCHEDULER]") + " Tempban scheduler started!");
  setInterval(La, 60000);
}
async function Na(a) {
  try {
    const d = await Q.find({
      status: {
        $in: ["open", "closed"]
      }
    });
    for (const b of d) {
      const c = (await a.channels.cache.get(b.channelId)) || (await a.channels.fetch(b.channelId).catch(() => null));
      if (!c) {
        b.status = "deleted";
        b.deletedAt = new Date();
        await b.save();
      }
    }
  } catch (a) {
    console.error("Error checking and updating ticket status:", a);
  }
}
setInterval(async () => {
  const a = new Date();
  const b = {
    $lte: a
  };
  const c = {
    reminderTime: b,
    sent: false
  };
  const d = await O.find(c);
  d.forEach(async a => {
    try {
      const b = await C.channels.fetch(a.channelId);
      const c = await C.users.fetch(a.userId);
      const d = new f().setColor(Y(B.Reminder.Embeds.DM.Color));
      if (B.Reminder.Embeds.DM.Title) {
        d.setTitle(B.Reminder.Embeds.DM.Title);
      }
      if (B.Reminder.Embeds.DM.Description) {
        d.setDescription(B.Reminder.Embeds.DM.Description.replace("{message}", a.message));
      }
      if (B.Reminder.Embeds.DM.Footer.Text) {
        const a = {
          text: B.Reminder.Embeds.DM.Footer.Text,
          iconURL: B.Reminder.Embeds.DM.Footer.Icon
        };
        d.setFooter(a);
      }
      if (B.Reminder.Embeds.DM.Author.Text) {
        const a = {
          name: B.Reminder.Embeds.DM.Author.Text,
          iconURL: B.Reminder.Embeds.DM.Author.Icon
        };
        d.setAuthor(a);
      }
      if (B.Reminder.Embeds.DM.Image) {
        d.setImage(B.Reminder.Embeds.DM.Image);
      }
      if (B.Reminder.Embeds.DM.Thumbnail) {
        d.setThumbnail(B.Reminder.Embeds.DM.Thumbnail);
      }
      d.setTimestamp();
      const e = {
        embeds: [d]
      };
      await c.send(e).catch(async c => {
        if (c.code === 50007) {
          const c = {
            content: "<@" + a.userId + ">",
            embeds: [d]
          };
          await b.send(c);
        } else {
          console.error("Failed to send reminder:", c);
        }
      });
      a.sent = true;
      await a.save();
    } catch (a) {
      console.error("Failed to send reminder:", a);
    }
  });
}, 30000);
async function Oa() {
  const a = new Date();
  const b = {
    $lte: a
  };
  const c = {
    expiration: b
  };
  const d = await M.find(c);
  for (const a of d) {
    const b = C.guilds.cache.get(a.guildId);
    if (!b) {
      continue;
    }
    try {
      const c = await b.members.fetch(a.userId);
      if (c) {
        await c.roles.remove(a.roleId);
      }
    } catch (a) {
      console.error("Failed to remove expired role: " + a);
    }
    const c = {
      _id: a._id
    };
    await M.deleteOne(c);
  }
}
C.polls = new Map();
C.on("messageReactionAdd", async (a, b) => {
  if (b.bot) {
    return;
  }
  if (a.partial) {
    try {
      await a.fetch();
    } catch (a) {
      console.error("Failed to fetch reaction:", a);
      return;
    }
  }
  const c = C.polls.get(a.message.id);
  if (!c) {
    return;
  }
  const d = a.message.reactions.cache.filter(a => a.users.cache.has(b.id));
  if (d.size > 1) {
    try {
      await a.users.remove(b.id);
    } catch (a) {
      console.error("Failed to remove user reaction:", a);
    }
    return;
  }
  const e = B.PollEmojis.upvote;
  const f = B.PollEmojis.downvote;
  if (a.emoji.name === e || a.emoji.id && "<:" + a.emoji.name + ":" + a.emoji.id + ">" === e) {
    c.upvotes++;
  } else if (a.emoji.name === f || a.emoji.id && "<:" + a.emoji.name + ":" + a.emoji.id + ">" === f) {
    c.downvotes++;
  } else {
    return;
  }
  await Pa(a.message.id, c);
  await Qa(a.message, c);
});
C.on("messageReactionRemove", async (a, b) => {
  if (b.bot) {
    return;
  }
  if (a.partial) {
    try {
      await a.fetch();
    } catch (a) {
      console.error("Failed to fetch reaction:", a);
      return;
    }
  }
  const c = C.polls.get(a.message.id);
  if (!c) {
    return;
  }
  const d = B.PollEmojis.upvote;
  const e = B.PollEmojis.downvote;
  if ((a.emoji.name === d || a.emoji.id && "<:" + a.emoji.name + ":" + a.emoji.id + ">" === d) && c.upvotes > 0) {
    c.upvotes--;
  } else if ((a.emoji.name === e || a.emoji.id && "<:" + a.emoji.name + ":" + a.emoji.id + ">" === e) && c.downvotes > 0) {
    c.downvotes--;
  } else {
    return;
  }
  await Pa(a.message.id, c);
  await Qa(a.message, c);
});
async function Pa(a, b) {
  try {
    const c = {
      messageId: a
    };
    const d = {
      upvotes: b.upvotes,
      downvotes: b.downvotes
    };
    await P.findOneAndUpdate(c, d);
  } catch (b) {
    console.error("Failed to update poll in database:", b);
    if (b.code === 50005 || b.code === 10008) {
      const b = {
        messageId: a
      };
      const c = await P.findOne(b);
      if (!c || c.userId !== c.userId) {
        const b = {
          messageId: a
        };
        await P.deleteOne(b);
      }
    }
  }
}
async function Qa(a, b) {
  const c = a.embeds[0];
  const d = {
    name: "Upvotes",
    value: b.upvotes + " votes",
    inline: true
  };
  const e = {
    name: "Downvotes",
    value: b.downvotes + " votes",
    inline: true
  };
  const g = f.from(c).spliceFields(1, 2, d, e);
  try {
    const b = {
      embeds: [g]
    };
    await a.edit(b);
  } catch (b) {
    console.error("Failed to update poll message:", b);
    if (b.code === 50005 || b.code === 10008) {
      const b = {
        messageId: a.id
      };
      const c = await P.findOne(b);
      if (!c || c.userId !== a.author.id) {
        const b = {
          messageId: a.id
        };
        await P.deleteOne(b);
      }
    }
  }
}
async function Ra() {
  try {
    const a = await P.find();
    for (const b of a) {
      C.polls.set(b.messageId, {
        upvotes: b.upvotes,
        downvotes: b.downvotes
      });
      try {
        const a = await C.channels.fetch(b.channelId);
        if (!a || !a.isTextBased()) {
          continue;
        }
        try {
          const c = await a.messages.fetch(b.messageId);
          if (c) {
            for (const a of c.reactions.cache.values()) {
              if (a.partial) {
                await a.fetch();
              }
            }
            const a = c.reactions.cache.get("👍")?.count - 1 || 0;
            const d = c.reactions.cache.get("👎")?.count - 1 || 0;
            b.upvotes = a;
            b.downvotes = d;
            await Pa(b.messageId, b);
            await Qa(c, b);
          }
        } catch (a) {
          if (a.code !== 10008) {
            console.error("Failed to fetch message or reactions for poll " + b.messageId + ":", a);
          }
        }
      } catch (a) {
        if (a.code !== 10003) {
          console.error("Failed to fetch channel for poll " + b.channelId + ":", a);
        }
      }
    }
  } catch (a) {
    console.error("Failed to load polls from database:", a);
  }
}
function Wa(a) {
  const b = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
  const c = b.exec(a);
  const d = parseInt(c[1]) || 0;
  const e = parseInt(c[2]) || 0;
  const f = parseInt(c[3]) || 0;
  return (d * 3600 + e * 60 + f) * 1000;
}
r.readdir("./events/", async (a, b) => {
  if (a) {
    return console.error;
  }
  b.forEach(a => {
    if (!a.endsWith(".js")) {
      return;
    }
    const b = require("./events/" + a);
    let c = a.split(".")[0];
    if (typeof b !== "function") {
      console.error("[ERROR] Event file '" + a + "' does not export a function. Skipping...");
      return;
    }
    C.on(c, b.bind(null, C));
    console.log(u.green("[EVENT]") + " " + a + " loaded!");
  });
});
r.readdir("./events/Music/", async (a, b) => {
  if (a) {
    return console.error;
  }
  b.forEach(a => {
    if (!a.endsWith(".js")) {
      return;
    }
    const b = require("./events/Music/" + a);
    let c = a.split(".")[0];
    if (typeof b !== "function") {
      console.error("[ERROR] Event file '" + a + "' does not export a function. Skipping...");
      return;
    }
    C.on(c, b.bind(null, C));
    console.log(u.green("[EVENT]") + " " + a + " loaded!");
  });
});
C.login(z.BotToken).catch(a => {
  if (a.message.includes("Used disallowed intents")) {
    console.log("[31m%s[0m", "Used disallowed intents (READ HOW TO FIX): \n\nYou did not enable Privileged Gateway Intents in the Discord Developer Portal!\nTo fix this, you have to enable all the privileged gateway intents in your discord developer portal, you can do this by opening the discord developer portal, go to your application, click on bot on the left side, scroll down and enable Presence Intent, Server Members Intent, and Message Content Intent");
    process.exit();
  } else if (a.message.includes("An invalid token was provided")) {
    console.log("[31m%s[0m", "[ERROR] The bot token specified in the config is incorrect!");
    process.exit();
  } else {
    console.log("[31m%s[0m", "[ERROR] An error occurred while attempting to login to the bot");
    console.log(a);
    process.exit();
  }
});
function Xa() {
  const a = y().tz(z.Timezone);
  const b = z.Economy.interestInterval.map(a => y.tz(a, "HH:mm", z.Timezone));
  b.sort((a, b) => a.diff(b));
  for (const c of b) {
    if (a.isBefore(c)) {
      return c;
    }
  }
  return b[0].add(1, "day");
}
function Ya() {
  const a = process.env.TEST_MODE ? 60000 : 86400000;
  const b = Xa();
  setTimeout(async () => {
    const a = await D.find({});
    for (const b of a) {
      const a = b.interestRate !== null ? b.interestRate : z.Economy.defaultInterestRate;
      const c = b.bank * a;
      b.bank += c;
      b.transactionLogs.push({
        type: "interest",
        amount: c,
        timestamp: new Date()
      });
      await b.save();
    }
    console.log("Applied interest to all users at " + b.format() + ".");
    Ya();
  }, b.diff(y().tz(z.Timezone)));
}