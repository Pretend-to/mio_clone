# mio 克隆助手

![logo](https://blog.fcip.xyz/upload/go%E9%A3%9F%E7%94%A8%E6%8C%87%E5%8D%97.files/response.gif)


## 摘要
[点击加入作者QQ群](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=BPVotGnSlCdy9AWXKSw4WlY6XjgJ2Z7O&authKey=4Obq%2FxNAuF7qL3z96uXMoV8KqxiSbtTCbEjYIer38ZW6%2F%2BERcJMTg90BhGRh2iQJ&noverify=0&group_code=798543340)  

借助第三方服务器实现github克隆加速。

app.js 为服务器后端，提供了yz_plugin、linux_cli、win_x64三种前端实现方式。
除云崽插件以外全部使用python编写，你也可以自己编译适合自己的程序


## 安装方式
1. Linux(仅试验过Ubuntu_x64)
   
   通过脚本安装:
   ```bash
   sudo bash -c "$(wget -O- https://raw.githubusercontent.com/Pretend-to/github_proxy/master/linux_cli/install_scripts/mio_x64_install.sh)"
   ```

2. Windows(仅支持64位)
   
   首先下载 [release](https://github.com/Pretend-to/github_proxy/releases) 里含有 win_x64 的压缩包，找个地方解压。

3. 云崽

    下载yz_plugin下的js文件扔到yunzai/plugins/example/下即可。

## 使用方式
1. Linux(仅试验过Ubuntu_x64)
   
   使用示例:
   ```bash
   root@rn:/home/code# mio clone https://github.com/Pretend-to/Hebust-Networker-Keeper
   收到项目克隆请求，开始克隆!
   项目名称:Hebust-Networker-Keeper
   项目作者:Pretend-to
   项目描述:适用于某不知名河北科大，防止宿舍网乱跳。:
   创建时间:2023-04-18 01:30:29
   最近更新:2023-05-09 20:34:13
   当前有 2 个人⭐了这个项目
   服务器完成克隆请求！文件大小449.12 KB,耗时1.459176秒。正在下载到本地......
   克隆结束，已下载至当前目录下Hebust-Networker-Keeper文件夹

   root@rn:/home/code# ls
   Hebust-Networker-Keeper  python  
   ```

2. Windows(仅支持64位)
   
   双击`mio.bat` , 按指引操作即可。

3. 云崽

   群内发送clone + 仓库链接即可 (没有加号)

## 说明
后端服务器是用的作者自己的 racknerd小机+cloudflare CDN 鉴于使用情况没有为前端适配更换后端服务器的代码，可自行更改。
