import requests
import os
import subprocess
import datetime

def get_pure_address(url):
    if url.startswith("https://"):
        # 去掉链接中的 "https://" 部分
        url = url.replace("https://", "")
    # 从GitHub仓库链接中提取用户名和仓库名称
    parts = url.split('/')
    repository_name = parts[-1].replace('.git', '')
    user_name = parts[-2]
    return f"https://github.com/{user_name}/{repository_name}"

def get_size(size):
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    unit_index = 0

    while size >= 1024 and unit_index < len(units) - 1:
        size /= 1024
        unit_index += 1

    formatted_size = "{:.2f}".format(size)
    unit = units[unit_index]

    return f"{formatted_size} {unit}"

def trans_time(utc_date_string):
    utc_date = datetime.datetime.strptime(utc_date_string, "%Y-%m-%dT%H:%M:%SZ")
    beijing_date = utc_date + datetime.timedelta(hours=8)  # 转换为北京时间
    return beijing_date.strftime("%Y-%m-%d %H:%M:%S")

def clone_github_repo(url):
    pure_url = get_pure_address(url)
    api_url = f"https://api.github.com/repos/{pure_url.replace('https://github.com/', '')}"
    download_url = f"https://api.fcip.xyz/git/download?url={pure_url}"
    path = pure_url.replace('https://github.com/', '')

    #print("[gh下载项目]" + pure_url)

    try:
        response = requests.get(api_url)
        data = response.json()

        if 'size' in data:
            created_time = trans_time(data['created_at'])
            pushed_time = trans_time(data['pushed_at'])

            print(f"收到项目克隆请求，开始克隆!\n项目名称:{data['name']}\n项目作者:{data['owner']['login']}\n项目描述:{data['description']}:\n创建时间:{created_time}\n最近更新:{pushed_time}\n当前有 {data['stargazers_count']} 个人⭐了这个项目")
        else:
            print('解析github项目失败！错误原因:\n' + str(data))
            return

    except Exception as e:
        print('解析github项目失败！错误原因:\n' + str(e))
        return

    try:
        start_time = datetime.datetime.now()  # 获取开始时间
        response = requests.get(download_url)
        data = response.json()

        if 'downloadLink' in data:
            zip_size = get_size(data['filesize'])
            end_time = datetime.datetime.now()  # 获取结束时间
            clone_time = (end_time - start_time).total_seconds()  # 计算耗时，单位为秒

            print(f"服务器完成克隆请求！文件大小{zip_size},耗时{clone_time}秒。正在下载到本地......")
            
            try:
                #print("开始下载文件...")
                subprocess.run(["wget", data['downloadLink'], "-O", f"{path.split('/')[-1]}.zip"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                #print("文件下载完成")

                target_dir = f"./{path.split('/')[-1]}"
                os.makedirs(target_dir, exist_ok=True)

                #print("开始解压文件...")
                subprocess.run(["unzip", "-q", f"{path.split('/')[-1]}.zip", "-d", target_dir], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                #print("文件解压完成")

                os.remove(f"{path.split('/')[-1]}.zip")
                print(f"克隆结束，已下载至当前目录下{path.split('/')[-1]}文件夹")
            except Exception as e:
                print(f"发生错误: {str(e)}")
        else:
            print('返回下载链接失败！错误原因：\n' + str(data))
    except Exception as e:
        print('连接api接口失败！错误原因：' + str(e))

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("请提供GitHub仓库链接作为参数")
    else:
        command = sys.argv[1]
        if command == "clone":
            if len(sys.argv) < 3:
                print("请提供GitHub仓库链接作为参数")
            else:
                url = sys.argv[2]
                clone_github_repo(url)
        else:
            print("参数错误！使用示例:\nmio clone https://github.com/user/repo ")