import plugin from '../../lib/plugins/plugin.js';
import fetch from 'node-fetch';
import WebSocket from 'ws';

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
    const ws = new WebSocket('ws://104.168.68.91:4098');
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
    
    ws.on('open', () => {
      console.log('WebSocket 连接已建立');    
      // e.reply(`克隆进行中......`);
      const request = {
        url: pure_url, // 替换为实际的 GitHub 项目 URL
      };
      
      // 发送请求消息
      ws.send(JSON.stringify(request));
    });

     // 监听消息接收事件
    ws.on('message', (message) => {
      console.log('收到响应:', message);

      // 解析响应消息
      const response = JSON.parse(message);

      // 处理响应数据
      if (response.error) {
        console.error('请求失败:', response.error);
      } else {
        console.log('文件大小:', response.filesize);
        console.log('下载链接:', response.downloadLink);
      }

    // 关闭 WebSocket 连接
      ws.close();
    });
  }
}
