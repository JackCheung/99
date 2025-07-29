import requests
import json
import os

# 获取飞书访问令牌
def get_tenant_access_token(app_id, app_secret):
    url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
    payload = json.dumps({"app_id": app_id, "app_secret": app_secret})
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, headers=headers, data=payload)
    return response.json()['tenant_access_token']

# 获取多维表格数据
def get_bitable_data(access_token, app_token, table_id):
    url = f"https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/search"
    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {access_token}'}
    all_records = []
    page_token = ""
    
    while True:
        params = {"page_size": 500}
        if page_token:
            params["page_token"] = page_token
            
        response = requests.post(url, headers=headers, json=params)
        data = response.json()
        all_records.extend(data['data']['items'])
        
        if not data['data']['has_more']:
            break
        page_token = data['data']['page_token']
    
    return all_records

# 生成HTML文件
def generate_html(records):
    # 创建文章列表页
    with open("index.html", "w", encoding="utf-8") as f:
        f.write("""<!DOCTYPE html>
<html>
<head>
    <title>文章列表</title>
    <link rel="stylesheet" href="https://unpkg.com/mvp.css">
</head>
<body>
    <header>
        <h1>文章列表</h1>
    </header>
    <main>
        <ul>""")
        for record in records:
            fields = record['fields']
            f.write(f"""<li>
                <a href="articles/{record['record_id']}.html">{fields.get('标题', '无标题')}</a>
                <p>{fields.get('发布日期', '')} · {fields.get('作者', '')}</p>
            </li>""")
        f.write("""</ul>
    </main>
</body>
</html>""")
    
    # 创建文章详情页
    os.makedirs("articles", exist_ok=True)
    for record in records:
        fields = record['fields']
        with open(f"articles/{record['record_id']}.html", "w", encoding="utf-8") as f:
            f.write(f"""<!DOCTYPE html>
<html>
<head>
    <title>{fields.get('标题', '无标题')}</title>
    <link rel="stylesheet" href="https://unpkg.com/mvp.css">
</head>
<body>
    <header>
        <h1>{fields.get('标题', '无标题')}</h1>
        <p>{fields.get('发布日期', '')} · {fields.get('作者', '')}</p>
    </header>
    <main>
        <article>{fields.get('内容', '')}</article>
    </main>
    <footer>
        <a href="../index.html">返回列表</a>
    </footer>
</body>
</html>""")

if __name__ == "__main__":
    app_id = os.environ.get("APP_ID")
    app_secret = os.environ.get("APP_SECRET")
    app_token = os.environ.get("APP_TOKEN")
    table_id = os.environ.get("TABLE_ID")
    
    token = get_tenant_access_token(app_id, app_secret)
    records = get_bitable_data(token, app_token, table_id)
    generate_html(records)
