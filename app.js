const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');
const cron = require('node-cron');

const app = express();
const port = 4099;

// 设置定时任务，每24小时清除所有压缩包
cron.schedule('0 0 * * *', () => {
  clearAllZipFiles();
});

app.get('/download', async (req, res) => {
  const url = req.query.url;

  // 检查URL是否是GitHub项目链接
  if (!isGitHubUrl(url)) {
    return res.status(400).json({ error: 'Invalid GitHub URL' });
  }

  try {
    // 保存GitHub项目到本地
    const saveresult = await saveGitHubProject(url);
    const filesize = saveresult.fileSize;
    const filename = saveresult.filename;
    const downloadLink = await makeDirectUrl(filename);
    res.json({ filesize, downloadLink });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save GitHub project' });
  }
});


function isGitHubUrl(url) {
  // 检查URL是否是GitHub项目链接的逻辑，这里简化为以'https://github.com/'开头即可
  return url.startsWith('https://github.com/');
}


async function makeDirectUrl(filename) {
  const response = await fetch("https://drive.fcip.xyz/api/short-link/batch/generate", {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      "axios-request": "true",
      "content-type": "application/json;charset=UTF-8;",
      "sec-ch-ua": "\"Microsoft Edge\";v=\"113\", \"Chromium\";v=\"113\", \"Not-A.Brand\";v=\"24\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "zfile-token": "0d1a2d86-1cae-415c-9af6-90201261f293",
      "cookie": "SRCHHPGUSR=cdxtone=Precise&cdxtoneopts=h3precise,clgalileo,gencontentv3",
      "Referer": "https://drive.fcip.xyz/6",
      "Referrer-Policy": "same-origin"
    },
    "body": `{"storageKey":"6","paths":["/${filename}"]}`,
    "method": "POST"
  });

  const data = await response.json();
  const shortLink = data.data[0].pathLink;
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

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});
