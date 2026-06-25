const {Client} = require("discord.js-selfbot-v11");
const {prompt} = require("enquirer");
const client = new Client();
var colors = require("colors");

async function run() {
  await logAscii();
  process.title = "Cloner de Nerostav";

  const userInput = await prompt([
    {type: "input", name: "token", message: "TOKEN da conta"},
    {type: "input", name: "original", message: "ID Do servidor que você irá copiar"},
    {type: "input", name: "target", message: "ID Do servidor que receberá a cópia"}
  ]);

  const {token, original, target} = userInput;

  client.on("ready", async () => {
    logAscii();

    const getGuild = (id) => client.guilds.cache ? client.guilds.cache.get(id) : client.guilds.get(id);
    const servers = [getGuild(original), getGuild(target)];

    servers.forEach(server => {
      if (!server) {
        log("Um de seus servidores está inválido, verifique os ID's.", 0x3);
        process.exit(0x1);
      }
    });

    let serverData = {
      'textChannels': servers[0].channels.filter(channel => channel.type === "text").sort((a, b) => a.calculatedPosition - b.calculatedPosition).map(c => c),
      'voiceChannels': servers[0].channels.filter(channel => channel.type === 'voice').sort((a, b) => a.calculatedPosition - b.calculatedPosition).map(c => c),
      'categories': servers[0].channels.filter(channel => channel.type === 'category').sort((a, b) => a.calculatedPosition - b.calculatedPosition).map(c => c),
      'roles': servers[0].roles.sort((a, b) => b.calculatedPosition - a.calculatedPosition).map(r => r)
    };

    process.title = "O Servidor está clonando...: " + servers[0].name;

    log("Deletando canais do servidor alvo...", 0x3);
    for (let channel of servers[1].channels.array()) {
      await channel["delete"]().catch(() => {});
    }

    log("Deletando cargos do servidor alvo...", 0x3);
    for (let role of servers[1].roles.array()) {
      await role["delete"]().catch(() => {});
    }

    await servers[1].setIcon(servers[0].iconURL).catch(() => {});
    await servers[1].setName(servers[0].name + " Nerostav Cloner").catch(() => {});

    for (let role of serverData.roles) {
      if (role.managed || role.name === "@everyone") continue;
      await servers[1].createRole({
        'name': role.name,
        'color': role.color,
        'permissions': role.permissions,
        'mentionable': role.mentionable,
        'position': role.position
      }).then(createdRole => log("Copiando Cargo: " + createdRole.name, 0x1)).catch(() => {});
    }

    for (let emoji of servers[0].emojis.array()) {
      await servers[1].createEmoji(emoji.url, emoji.name)
        .then(createdEmoji => log("Copiando emoji: " + createdEmoji.name, 0x1))
        .catch(() => {});
    }

    const buildPermissions = (permissionOverwrites) => {
      return permissionOverwrites.map(permission => {
        let role = servers[0].roles.get(permission.id);
        if (!role) return null;
        return {
          'id': servers[1].roles.find(r => r.name === role.name) || servers[1].id,
          'allow': permission.allow || 0x0,
          'deny': permission.deny || 0x0
        };
      }).filter(p => p);
    };

    for (let category of serverData.categories) {
      await servers[1].createChannel(category.name, {
        'type': "category",
        'permissionOverwrites': buildPermissions(category.permissionOverwrites),
        'position': category.position
      }).then(c => log("Copiando categoria: " + c.name, 0x1)).catch(() => {});
    }

    for (let textChannel of serverData.textChannels) {
      let newChannel = await servers[1].createChannel(textChannel.name, {
        'type': "text",
        'permissionOverwrites': buildPermissions(textChannel.permissionOverwrites),
        'position': textChannel.position
      }).catch(() => null);

      if (!newChannel) continue;

      if (textChannel.topic) {
        await newChannel.setTopic(textChannel.topic).catch(() => {});
      }

      if (textChannel.parent) {
        let parentCategory = servers[1].channels.find(c => c.name === textChannel.parent.name && c.type === 'category');
        if (!parentCategory) {
          parentCategory = await servers[1].createChannel(textChannel.parent.name, {
            'type': "category",
            'permissionOverwrites': buildPermissions(textChannel.parent.permissionOverwrites || []),
            'position': textChannel.parent.position
          }).catch(() => null);
        }
        if (parentCategory) {
          await newChannel.setParent(parentCategory.id).catch(() => {});
        }
      }

      log("Copiando canal de texto: " + textChannel.name, 0x1);
    }

    for (let voiceChannel of serverData.voiceChannels) {
      let newChannel = await servers[1].createChannel(voiceChannel.name, {
        'type': "voice",
        'permissionOverwrites': buildPermissions(voiceChannel.permissionOverwrites),
        'position': voiceChannel.position,
        'userLimit': voiceChannel.userLimit
      }).catch(() => null);

      if (!newChannel) continue;

      if (voiceChannel.parent) {
        let parentCategory = servers[1].channels.find(c => c.name === voiceChannel.parent.name && c.type === 'category');
        if (!parentCategory) {
          parentCategory = await servers[1].createChannel(voiceChannel.parent.name, {
            'type': "category",
            'permissionOverwrites': buildPermissions(voiceChannel.parent.permissionOverwrites || []),
            'position': voiceChannel.parent.position
          }).catch(() => null);
        }
        if (parentCategory) {
          await newChannel.setParent(parentCategory.id).catch(() => {});
        }
      }

      log("Copiando canal de voz: " + voiceChannel.name, 0x1);
    }

    log("Clonagem concluída!", 0x1);
  });

  process.on("uncaughtException", (error) => {
    console.log("🚫 Erro Detectado:\n\n" + error.stack);
  });
  process.on('uncaughtExceptionMonitor', (error) => {
    console.log("🚫 Erro Detectado:\n\n" + error.stack);
  });

  client.login(('' + token).replace(/"/g, ''))['catch'](() => {
    logAscii();
    log("Seu token está inválido. Verifique o token", 0x3);
  });
}

async function logAscii() {
  console.clear();
  console.log(`
   _______                          _____                              ____                             __
  / ____/ /___  ____  ___  _____   / ___/___  ______   _____  _____   / __ \\(_)_____________  _________/ /
 / /   / / __ \\/ __ \\/ _ \\/ ___/   \\__ \\/ _ \\/ ___/ | / / _ \\/ ___/  / / / / / ___/ ___/ __ \\/ ___/ __  /
/ /___/ / /_/ / / / /  __/ /      ___/ /  __/ /   | |/ /  __/ /     / /_/ / (__  ) /__/ /_/ / /  / /_/ /
\\____/_/\\____/_/ /_/\\___/_/      /____/\\___/_/    |___/\\___/_/     /_____/_/____/\\___/\\____/_/   \\__,_/



                                                                              By: Nerostav Kuznetsov
  `.brightGreen);
}

async function log(message2, type) {
  switch (type) {
    case 0x1:
      await console.log((" [✅] " + message2).brightGreen);
      break;
    case 0x2:
      await console.log((" [⚠️] " + message2).yellow);
      break;
    case 0x3:
      await console.log((" [❌] " + message2).red);
      break;
  }
}
run();
