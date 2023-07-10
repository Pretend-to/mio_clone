import plugin from '../../lib/plugins/plugin.js';
import fetch from 'node-fetch';

export class Mio extends plugin {
  constructor(e) {
    super({
      name: '澪',
      dsc: '自己做着玩的',
      event: 'message',
      priority: 499,
      rule: [{
        reg: "^clone.*",
        fnc: 'wget_gh'
      }]
    });
  }

  async getPureAddress(url) {
    if (url.startsWith("https://")) {
        // 去掉链接中的 "https://" 部分
        url = url.replace("https://", "");
    }
    // 从GitHub仓库链接中提取用户名和仓库名称
    const parts = url.split('/');
    const repositoryName = parts[parts.length - (parts.length - 2)].replace('.git', '');
    const userName = parts[parts.length - (parts.length - 1)];
    return `https://github.com/${userName}/${repositoryName}`;
  }

  async get_size(size){    
    const units = ['B','KB', 'MB', 'GB', 'TB'];

    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    const formattedSize = size.toFixed(2);
    const unit = units[unitIndex];

    return `${formattedSize} ${unit}`;
  }

  async trans_time(utcDateString){    
    const utcDate = new Date(utcDateString);
    const options = { timeZone: "Asia/Shanghai", year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const beijingDate = utcDate.toLocaleString("zh-CN", options);
    return beijingDate;
  }

  async wget_gh(e) {
    // console.log(e.msg);
    let GitHuburl = e.msg.replace(/^clone\s*(https?:\/\/.*)/g, "$1");
    let pure_url = await this.getPureAddress(GitHuburl);
    let url = `https://api.fcip.xyz/git/download?url=${pure_url}`;
    let path = pure_url.replace('https://github.com/', '')
    let apiurl = `https://api.github.com/repos/${path}`

    console.log("[gh下载项目]" + pure_url);

    try {
      const response = await fetch(apiurl);
      const data = await response.json();

      if (data.size) {
        
        const created_time = await this.trans_time(data.created_at);
        const pushed_time = await this.trans_time(data.pushed_at);


        e.reply(`收到项目克隆请求，开始克隆!\n项目名称:${data.name}\n项目作者:${data.owner.login}\n项目描述:${data.description}:\n创建时间:${created_time}\n最近更新:${pushed_time}\n当前有 ${data.stargazers_count} 个人⭐了这个项目`);

      } else {
        e.reply('解析github项目失败！错误原因:\n' + JSON.stringify(data));
      }
    } catch (error) {
      console.error('解析github项目失败！错误原因:\n', error);
      e.reply('解析github项目失败！错误原因:\n' + error);
    }

    //e.reply(segment.image(`https://opengraph.githubassets.com/Pretend-to/${path}`))

    try {
      const startTime = new Date().getTime(); // 获取开始时间
      //e.reply(`克隆进行中......`);
      const response = await fetch(url);
      console.log(response);
      const data = await response.json();



      if (data.downloadLink) {
        const zipsize = await this.get_size(data.filesize);
        const endTime = new Date().getTime(); // 获取结束时间
        const clonetime = (endTime - startTime) / 1000; // 计算耗时，单位为秒

        e.reply(`克隆完成!文件大小${zipsize},耗时${clonetime}秒。复制链接到浏览器即可加速下载,有效期24h。\n${data.downloadLink}`, false);
      } else {
        e.reply('返回下载链接失败！错误原因：\n' + JSON.stringify(data));
      }
    } catch (error) {
      console.error('连接api接口失败！错误原因：', error);
      e.reply('返回下载链接失败！错误原因\n' + error);
    }
  }
}
