const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');
const cron = require('node-cron');
const WebSocket = require('ws');
const app = express();

const download_url = 'https://api.fcip.xyz/git/download/'
const http_port = 4099;
const ws_port = 4098;

const wss = new WebSocket.Server({ port: ws_port });

// 设置定时任务，每0.5小时清除所有压缩包
cron.schedule('*/30 * * * *', () => {
  clearAllZipFiles();
});

// 中间件函数
function logRequest(req, res, next) {
  const startTime = new Date(); // 记录开始时间

  // 获取请求的 IP 地址
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // 记录请求开始的日志
  console.log(`[${startTime}] IP 地址 ${ip} 发起了请求：${req.method} ${req.originalUrl}`);

  // 在响应结束后记录请求结束的日志
  res.on('finish', () => {
    const endTime = new Date(); // 记录结束时间
    const requestTime = (endTime - startTime) / 1000; // 计算请求耗时（单位：秒）

    // 记录请求完成的日志
    console.log(`[${endTime}] IP 地址 ${ip} 请求完成：${req.method} ${req.originalUrl}`);
    console.log(`请求耗时：${requestTime} 秒`);
  });

  next(); // 调用下一个中间件函数或路由处理程序
}

// 将中间件函数应用到所有路由
app.use(logRequest);

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = `./projects/${filename}`;

  const startTime = new Date(); // 记录开始时间

  // 获取请求的 IP 地址
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // 记录下载开始的日志
  console.log(`[${startTime}] IP 地址 ${ip} 正在下载文件 ${filename}`);

  res.download(filePath, (err) => {
    if (err) {
      console.error('下载文件时发生错误：', err);
      res.status(500).send('下载文件时发生错误');
      return;
    }
  });
});


wss.on('connection', (ws) => {
  console.log('WebSocket 连接已建立');

  // 在收到请求后发送 JSON 文件
  ws.on('message', async (message) => {
    console.log('收到请求:', message);

    try {
      const { url } = JSON.parse(message); // 解析消息获取 GitHub 项目 URL
      // 检查URL是否是GitHub项目链接
      if (!isGitHubUrl(url)) {
        ws.send(JSON.stringify({ error: 'Failed to save GitHub project' }));
        ws.close();
      }else{
        const saveresult = await saveGitHubProject(url);
        const filesize = saveresult.fileSize;
        const filename = saveresult.filename;
        const downloadLink = await makeUrl(filename);
        ws.send(JSON.stringify({ filesize, downloadLink })); // 发送响应给客户端
      }

    } catch (error) {
      console.error(error);
      ws.send(JSON.stringify({ error: 'Failed to save GitHub project' })); // 发送错误响应给客户端
    }
    // 关闭连接
    ws.close();
    console.log('WebSocket 连接关闭');
  });
});


function isGitHubUrl(url) {
  // 检查URL是否是GitHub项目链接的逻辑，这里简化为以'https://github.com/'开头即可
  return url.startsWith('https://github.com/');
}

async function makeUrl(filename) {
  //const shortLink = `https://api.fcip.xyz/git/download/${filename}`
  const shortLink = `${download_url}${filename}`
  return shortLink;
}


async function saveGitHubProject(url) {
  // 生成本地保存路径
  const timestamp = Date.now();
  const projectName = getProjectNameFromUrl(url);
  const localPath = `./projects/${projectName}_${timestamp}.zip`;
  const pure_url = getPureAddress(url);

  let re_json = {};

  // 使用git clone命令克隆项目到本地
  await new Promise((resolve, reject) => {
    exec(`git clone ${pure_url} ./projects/${projectName}_${timestamp}`, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  // 压缩项目目录到zip文件
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(localPath);
    const archive = archiver('zip');
  
    output.on('close', () => {
      // 删除源文件
      deleteProjectDirectory(`./projects/${projectName}_${timestamp}`);
      const fileSize = archive.pointer();
      const result = {
        filename: `${projectName}_${timestamp}.zip`,
        fileSize: fileSize
      };
      resolve(JSON.stringify(result));
      re_json = result;
    });
    archive.on('error', reject);
  
    archive.pipe(output);
    archive.directory(`./projects/${projectName}_${timestamp}`, false);
    archive.finalize();
  });
  return re_json ;
}

function getPureAddress(url) {
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

function getProjectNameFromUrl(url) {
  // 从GitHub项目链接中提取项目名称
  const parts = url.split('/');
  return parts[parts.length - 1].replace('.git', '');
}

function deleteProjectDirectory(path) {
  // 删除项目目录
  fs.rmSync(path, { recursive: true });
}

function clearAllZipFiles() {
  // 清除所有压缩包
  fs.readdir('./projects', (err, files) => {
    if (err) {
      console.error(err);
      return;
    }

    files.forEach((file) => {
      if (file.endsWith('.zip')) {
        fs.unlinkSync(`./projects/${file}`);
      }
    });
  });
}

app.listen(http_port, () => {
  console.log(`Download server listening at http://localhost:${http_port} \nWebSocket server listening at ws://localhost:${ws_port} `);
});
