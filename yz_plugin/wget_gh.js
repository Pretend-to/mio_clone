import plugin from '../../lib/plugins/plugin.js';
import fetch from 'node-fetch';

export class Mio extends plugin {
  constructor(e) {
    super({
      name: '澪',
      dsc: '自己做着玩的',
      event: 'message',
      priority: 1000,
      rule: [{
        reg: "^clone.*",
        fnc: 'wget_gh'
      }]
    });
  }

  async wget_gh(e) {
    // console.log(e.msg);
    let GitHuburl = e.msg.replace(/^clone\s*(https?:\/\/.*)/g, "$1");
    console.log(GitHuburl);
    console.log("[gh下载项目]" + GitHuburl);
    let url = `https://api.fcip.xyz/git/download?url=${GitHuburl}`;
    let path = GitHuburl.replace('https://github.com/', '')
    e.reply(segment.image(`https://opengraph.githubassets.com/Pretend-to/${path}`))
    e.reply('收到项目克隆请求，克隆开始啦');

    try {
      const startTime = new Date().getTime(); // 获取开始时间

      const response = await fetch(url);
      const data = await response.json();

      if (data.downloadLink) {
        const endTime = new Date().getTime(); // 获取结束时间
        const clonetime = (endTime - startTime) / 1000; // 计算耗时，单位为秒

        e.reply(`克隆完成了啦，耗时${clonetime}秒。复制链接到浏览器即可加速下载，链接24h过期哦！\n链接：${data.downloadLink}`, false);
      } else {
        e.reply('连接api接口失败！错误原因：' + JSON.stringify(data));
      }
    } catch (error) {
      console.error('连接api接口失败！错误原因：', error);
      e.reply('连接api接口失败！错误原因：' + error);
    }
  }
}
